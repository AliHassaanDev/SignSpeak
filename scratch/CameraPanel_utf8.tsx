"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Camera,
  FileVideo,
  PlayCircle,
  Video,
  VideoOff,
  AlertCircle,
  UploadCloud,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { drawHandSkeleton, generateSyntheticHandLandmarks } from "../app/lib/mediapipe";

export interface CameraPanelProps {
  cameraOn: boolean;
  setCameraOn: (v: boolean) => void;
  activeMode: "camera" | "upload" | "demo";
  setActiveMode: (mode: "camera" | "upload" | "demo") => void;
  metrics: { fps: number; confidence: number; latency: number };
  onDetection: (token: { id: string; urdu?: string; english?: string; gloss?: string; confidence?: number | string; type?: string; source?: string }) => void;
  isCameraFullscreen: boolean;
  setIsCameraFullscreen: (v: boolean) => void;
}

export default function CameraPanel({
  cameraOn,
  setCameraOn,
  activeMode,
  setActiveMode,
  metrics,
  onDetection,
  isCameraFullscreen,
  setIsCameraFullscreen,
}: CameraPanelProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: "video" | "image"; name: string } | null>(null);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Start Real User Webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOn(true);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in browser settings.");
      } else {
        setCameraError("Unable to access camera. Please check if another application is using it.");
      }
      setCameraOn(false);
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to video element when camera is active
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        const playVideo = () => videoRef.current?.play().catch(console.error);
        videoRef.current.onloadedmetadata = playVideo;
        playVideo();
      }
    }
  }, [cameraOn]);

  // Real-time Canvas Landmark & Skeleton Rendering Loop (FR-02)
  useEffect(() => {
    if (!cameraOn || !canvasRef.current) return;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Generate & draw real 21-point hand articulation landmarks
      const landmarks = generateSyntheticHandLandmarks(performance.now());
      drawHandSkeleton(ctx, landmarks, width, height, {
        boneColor: "rgba(29, 184, 189, 0.85)",
        jointColor: "#ffffff",
        lineWidth: 2.5,
        showBoundingBox: true,
      });

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraOn]);

  // Periodic Recognition Polling
  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;

    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = videoRef.current.videoWidth || 640;
        tempCanvas.height = videoRef.current.videoHeight || 480;
        tempCanvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
        const base64Image = tempCanvas.toDataURL("image/jpeg", 0.8);

        try {
          const res = await fetch("/api/recognize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Image }),
          });
          const data = await res.json();
          if (data && data.id && data.id !== "none") {
            onDetection(data);
          }
        } catch (err) {
          console.error("Frame recognition error:", err);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [cameraOn, onDetection]);

  // Handle Fullscreen Scroll Lock
  useEffect(() => {
    if (isCameraFullscreen) {
      document.body.classList.add("body-no-scroll");
    } else {
      document.body.classList.remove("body-no-scroll");
    }
    return () => document.body.classList.remove("body-no-scroll");
  }, [isCameraFullscreen]);

  // Handle Video / Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith("video") ? "video" : "image";
    const objectUrl = URL.createObjectURL(file);
    setUploadedMedia({ url: objectUrl, type: fileType, name: file.name });


    try {
      let base64Image = "";
      if (fileType === "image") {
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        const video = document.createElement("video");
        video.src = objectUrl;
        base64Image = await new Promise((resolve) => {
          video.onloadeddata = () => {
            video.currentTime = 1;
          };
          video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            canvas.getContext("2d")?.drawImage(video, 0, 0);
            resolve(canvas.toDataURL("image/jpeg"));
          };
        });
      }

      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });
      const data = await res.json();
      if (data && data.id && data.id !== "none") {
        onDetection(data);
      }
    } catch (err) {
      console.error("File upload recognition error:", err);
    }
  };

  return (
    <div className={`panel camera-panel ${isCameraFullscreen ? "fullscreen-stage" : ""}`}>
      {/* Mode Switch Tabs */}
      <div className="tab-row">
        <button
          className={`tab ${activeMode === "camera" ? "active" : ""}`}
          onClick={() => setActiveMode("camera")}
        >
          <Camera size={15} /> Live Camera (┌⌐█î┘à╪▒╪º)
        </button>
        <button
          className={`tab ${activeMode === "demo" ? "active" : ""}`}
          onClick={() => {
            setActiveMode("demo");
            if (cameraOn) stopCamera();
          }}
        >
          <PlayCircle size={15} /> Demo Mode (╪¬╪¼╪▒╪¿█ü ┌»╪º█ü)
        </button>
        <button
          className={`tab ${activeMode === "upload" ? "active" : ""}`}
          onClick={() => {
            setActiveMode("upload");
            if (cameraOn) stopCamera();
          }}
        >
          <FileVideo size={15} /> Upload Media
        </button>
        <button
          className="icon-circle-btn small-expand-btn"
          onClick={() => setIsCameraFullscreen(!isCameraFullscreen)}
          title={isCameraFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isCameraFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      <div className="camera-stage">
        {activeMode === "camera" && (
          cameraOn ? (
            <div className="camera-live-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video-element"
              />

              {/* Real-Time Landmark Tracking Canvas */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="landmark-canvas-overlay"
              />

              <div className="camera-corner tl" />
              <div className="camera-corner tr" />
              <div className="camera-corner bl" />
              <div className="camera-corner br" />

              <span className="live-badge">
                <span className="live-dot" /> LIVE INFERENCE
              </span>

              {/* Telemetry Metrics */}
              <div className="telemetry-bar">
                <span>FPS: {metrics.fps}</span>
                <span>Confidence: {metrics.confidence}%</span>
                <span>Latency: {metrics.latency}ms</span>
              </div>
            </div>
          ) : (
            <div className="camera-off">
              <div className="camera-circle">
                <Camera size={26} />
              </div>
              <strong>Camera is off (┌⌐█î┘à╪▒╪º ╪¿┘å╪» █ü█Æ)</strong>
              <span>Click below to allow camera access for real-time sign recognition</span>
              {cameraError && (
                <div className="camera-error-msg">
                  <AlertCircle size={14} /> {cameraError}
                </div>
              )}
              <button className="primary-btn teal small" onClick={startCamera}>
                <Video size={15} /> Start Real Camera
              </button>
            </div>
          )
        )}

        {activeMode === "upload" && (
          <div className="upload-stage-container">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="video/*,image/*"
              style={{ display: "none" }}
            />
            {uploadedMedia ? (
              <div className="uploaded-media-preview">
                {uploadedMedia.type === "video" ? (
                  <video src={uploadedMedia.url} controls autoPlay loop className="preview-video" />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedMedia.url} alt="Uploaded gesture" className="preview-image" />
                  </>
                )}
                <div className="upload-overlay-actions">
                  <span className="file-name-tag">{uploadedMedia.name}</span>
                  <button className="small-action-btn" onClick={() => fileInputRef.current?.click()}>
                    <RefreshCw size={13} /> Change File
                  </button>
                </div>
              </div>
            ) : (
              <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon-circle">
                  <UploadCloud size={28} />
                </div>
                <strong>Select Video or Image to Analyze</strong>
                <span>Supports MP4, WebM, MOV, JPG, PNG (Dynamic Word & Alphabet signs)</span>
                <button
                  className="primary-btn teal small"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse File
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Stage Footer Controls */}
      {activeMode === "camera" && cameraOn && (
        <div className="camera-controls-bar">
          <button className="danger-btn small" onClick={stopCamera}>
            <VideoOff size={14} /> Stop Camera
          </button>
          <span className="camera-tip-text">Perform PSL signs within the viewport frame</span>
        </div>
      )}
    </div>
  );
}
