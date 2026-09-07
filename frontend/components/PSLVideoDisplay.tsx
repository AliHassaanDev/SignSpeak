"use client";

import React, { useRef, useEffect } from "react";
import { Maximize2, Minimize2, ArrowUpRight } from "lucide-react";
import { PSLSign } from "../app/lib/psl_types";

export interface PSLVideoDisplayProps {
  signs: PSLSign[];
  currentSignIndex: number;
  setCurrentSignIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  autoPlay: boolean;
  setAutoPlay: (autoPlay: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fs: boolean) => void;
  videoUrl?: string | null;
}

export default function PSLVideoDisplay({
  signs,
  currentSignIndex,
  setCurrentSignIndex,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  autoPlay,
  setAutoPlay,
  isFullscreen,
  setIsFullscreen,
  videoUrl,
}: PSLVideoDisplayProps) {
  const activeChipRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentSign = signs[currentSignIndex] || (signs.length > 0 ? signs[0] : null);

  // Handle Video Playback State
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, videoUrl]);

  // Handle Video Speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Auto-scroll active sequence chip into view
  useEffect(() => {
    if (activeChipRef.current) {
      activeChipRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentSignIndex]);

  // Handle Fullscreen Scroll Lock
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add("body-no-scroll");
    } else {
      document.body.classList.remove("body-no-scroll");
    }
    return () => document.body.classList.remove("body-no-scroll");
  }, [isFullscreen]);

  return (
    <div className={`panel avatar-panel ${isFullscreen ? "fullscreen-stage" : ""}`}>
      {/* Panel Title & Status Header */}
      <div className="panel-title-row">
        <div className="avatar-header-info">
          <span className="panel-title">PSL Video Synthesis Output</span>
          {currentSign && (
            <span className="active-sign-badge">
              Sign {currentSignIndex + 1}/{signs.length}: <strong>{currentSign.urdu}</strong> ({currentSign.gloss})
            </span>
          )}
        </div>
        <button
          className="icon-circle-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Video Player Stage */}
      <div className="avatar-stage" style={{ backgroundColor: "#000", position: "relative" }}>
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={true}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
            {signs.length > 0 ? "Generating Video..." : "Awaiting Translation..."}
          </div>
        )}

        {/* Gesture description banner at the bottom of stage */}
        {currentSign && (
          <div className="sign-description-banner">
            <span className="desc-text">{currentSign.description}</span>
          </div>
        )}
      </div>

      {/* Timeline & Sign Sequence Visualizer */}
      {signs.length > 0 && (
        <div className="sign-timeline-bar">
          <div className="timeline-labels">
            <div className="timeline-title-group">
              <span className="timeline-main-title">Sign Sequence Progression</span>
              <span className="timeline-counter-badge">
                {currentSignIndex + 1} of {signs.length} signs
              </span>
            </div>
            <span className="timeline-percent-badge">
              {Math.round(((currentSignIndex + 1) / signs.length) * 100)}%
            </span>
          </div>

          <div className="timeline-track">
            <div
              className="timeline-progress"
              style={{ width: `${((currentSignIndex + 1) / signs.length) * 100}%` }}
            />
          </div>

          <div className="sequence-chips-row">
            {signs.map((s, idx) => (
              <button
                key={`${s.id}-${idx}`}
                ref={idx === currentSignIndex ? activeChipRef : null}
                className={`sequence-chip ${
                  idx === currentSignIndex
                    ? "active"
                    : idx < currentSignIndex
                    ? "completed"
                    : ""
                }`}
                onClick={() => {
                  setCurrentSignIndex(idx);
                  setIsPlaying(true);
                  if (videoRef.current) videoRef.current.currentTime = 0; // Simplified sync for MVP
                }}
                title={`Sign ${idx + 1}: ${s.urdu} (${s.gloss})`}
              >
                <span className="seq-step-num">#{idx + 1}</span>
                <span className="seq-urdu" dir="rtl">{s.urdu}</span>
                <span className="seq-gloss">{s.gloss.replace(/^SPELL_/, "Letter ")}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Controls & Toggles */}
      <div className="avatar-footer">
        <div className="toggle-group">
          <button
            className={`switch ${autoPlay ? "on" : ""}`}
            onClick={() => setAutoPlay(!autoPlay)}
            aria-label="Toggle Auto Play"
          >
            <span />
          </button>
          <span className="toggle-label">Auto-Play on Translation</span>
        </div>

        <button className="fullscreen-btn" onClick={() => setIsFullscreen(!isFullscreen)}>
          {isFullscreen ? "Exit Fullscreen" : "Expanded View"}{" "}
          {isFullscreen ? <Minimize2 size={13} /> : <ArrowUpRight size={13} />}
        </button>
      </div>
    </div>
  );
}
