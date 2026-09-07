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
  Trash2,
  Play
} from "lucide-react";
import { signBridgeAPI } from "../app/lib/api";

export interface CameraPanelProps {
  cameraOn: boolean;
  setCameraOn: (v: boolean) => void;
  activeMode: "camera" | "upload" | "demo";
  setActiveMode: (mode: "camera" | "upload" | "demo") => void;
  metrics: { fps: number; confidence: number; latency: number };
  onDetection: (token: { id: string; urdu?: string; english?: string; gloss?: string; confidence?: number | string; type?: string; source?: string }) => void;
  isCameraFullscreen: boolean;
  setIsCameraFullscreen: (v: boolean) => void;
  onReset?: () => void;
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
  onReset,
}: CameraPanelProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: "video" | "image"; name: string; file?: Blob | File } | null>(null);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingStage, setTranslatingStage] = useState<"uploading" | "analyzing">("uploading");

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

  const startRecording = () => {
    if (!streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    const localChunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        localChunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      // Create a local blob from recorded chunks and switch to upload mode to preview it
      const blob = new Blob(localChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      onReset?.();
      setUploadedMedia({ url, type: "video", name: "recorded-video.webm", file: blob });
      setActiveMode("upload");
      stopCamera(); // stop live camera after recording
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Stop Webcam
  const stopCamera = () => {
    if (isRecording) stopRecording();
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

  // Real-time Canvas Landmark & Skeleton Rendering Loop (FR-02) (REMOVED)

  // Periodic Recognition Polling (REMOVED)

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

    onReset?.(); // Reset the transcript panel when a new file is uploaded
    const fileType = file.type.startsWith("video") ? "video" : "image";
    const objectUrl = URL.createObjectURL(file);
    setUploadedMedia({ url: objectUrl, type: fileType, name: file.name, file });
    e.target.value = "";
  };

  return (
    <div className={`panel camera-panel ${isCameraFullscreen ? "fullscreen-stage" : ""}`}>
      {/* Mode Switch Tabs */}
      <div className="tab-row" style={{ display: 'flex' }}>
        <button
          className={`tab ${activeMode === "camera" ? "active" : ""}`}
          style={{ flex: 1 }}
          onClick={() => {
            setActiveMode("camera");
            onReset?.();
          }}
        >
          <Camera size={15} /> Camera (کیمرا)
        </button>
        <button
          className={`tab ${activeMode === "upload" ? "active" : ""}`}
          style={{ flex: 1 }}
          onClick={() => {
            setActiveMode("upload");
            onReset?.();
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

              <div className="camera-corner tl" />
              <div className="camera-corner tr" />
              <div className="camera-corner bl" />
              <div className="camera-corner br" />
            </div>
          ) : (
            <div className="camera-off">
              <div className="camera-circle">
                <Camera size={26} />
              </div>
              <strong>Camera is off (کیمرا بند ہے)</strong>
              <span>Click below to allow camera access for real-time sign recognition</span>
              {cameraError && (
                <div className="camera-error-msg">
                  <AlertCircle size={14} /> {cameraError}
                </div>
              )}
              <button
                className="primary-btn teal small"
                onClick={() => {
                  onReset?.();
                  startCamera();
                }}
              >
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
                <div className="upload-overlay-actions" style={{ boxSizing: 'border-box', flexWrap: 'wrap', gap: '10px' }}>
                  <span className="file-name-tag" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '35%' }}>{uploadedMedia.name}</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="small-action-btn"
                      style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => {
                        onReset?.();
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <RefreshCw size={13} /> Change File
                    </button>
                    <button className="danger-btn small" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setUploadedMedia(null); onReset?.(); }}>
                      <Trash2 size={13} />
                    </button>
                    <button className="primary-btn teal small" disabled={isTranslating} style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={async () => {
                      if (!uploadedMedia.file) return;
                      setIsTranslating(true);
                      setTranslatingStage("uploading");
                      // After 3s, switch label to "Analyzing signs…"
                      const stageTimer = setTimeout(() => setTranslatingStage("analyzing"), 3000);
                      try {
                        const result = await signBridgeAPI.translatePSLToUrdu(uploadedMedia.file) as any;
                        if (result && result.id && result.id !== "none") {
                          onDetection(result);
                        } else {
                          const err = result.error || "Failed to translate the video. Please ensure the subject is clear and try again.";
                          alert(`Error: ${err}`);
                        }
                      } catch (err) {
                        console.error("Translation failed:", err);
                        alert("Translation encountered an error. Check console for details.");
                      } finally {
                        clearTimeout(stageTimer);
                        setIsTranslating(false);
                        setTranslatingStage("uploading");
                      }
                    }}>
                      <Play size={13} /> {isTranslating ? (translatingStage === "uploading" ? "Uploading video…" : "Analyzing signs…") : "Translate"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="upload-dropzone"
                onClick={() => {
                  onReset?.();
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }}
              >
                <div className="upload-icon-circle">
                  <UploadCloud size={28} />
                </div>
                <strong>Select Video or Image to Analyze</strong>
                <span>Supports MP4, WebM, MOV, JPG, PNG (Dynamic Word & Alphabet signs)</span>
                <button
                  className="primary-btn teal small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset?.();
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                      fileInputRef.current.click();
                    }
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
        <div className="camera-controls-bar" style={{ display: 'flex', gap: '12px', width: '100%' }}>
          {isRecording ? (
            <button className="danger-btn" style={{ flex: 1, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={stopRecording}>
              <VideoOff size={16} /> Stop Recording
            </button>
          ) : (
            <button className="primary-btn teal" style={{ flex: 1, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={startRecording}>
              <PlayCircle size={16} /> Record Video
            </button>
          )}
          <button className="secondary-btn" style={{ flex: 1, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={stopCamera}>
            <VideoOff size={16} /> Stop Camera
          </button>
        </div>
      )}
    </div>
  );
}
