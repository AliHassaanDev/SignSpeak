"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ImageOff,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Clock3,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { AnimationItem } from "../services/pslService";

/* ── Types ── */

export interface VideoQueueItem {
  token: string;
  type?: "WORD" | "LETTER" | "WORD_SIGN" | "FINGERSPELLING";
  urdu?: string;
  english?: string;
  imageUrl: string | null;
  durationMs?: number;
}

interface PSLVideoPlayerProps {
  /** Rich sequential animation items from backend */
  items?: AnimationItem[];
  /** Fallback space-separated gloss tokens (e.g. "WHERE GO") */
  currentGloss?: string;
  /** Whether the queue is currently playing */
  isPlaying: boolean;
  /** Playback speed multiplier (0.5, 1.0, 1.5, 2.0) */
  speed: number;
  /** Callback to toggle isPlaying */
  setIsPlaying?: (playing: boolean) => void;
  /** Callback to change speed */
  setSpeed?: (speed: number) => void;
  /** Fired when the entire sequence finishes */
  onSequenceComplete?: () => void;
  /** Fired on each clip boundary with the current 0-based index */
  onIndexChange?: (idx: number) => void;
  /** Current index controlled externally (optional) */
  externalIndex?: number;
}

/* ── Static registry (loaded once as fallback) ── */

let registryCache: Record<string, string> | null = null;

async function loadVideoRegistry(): Promise<Record<string, string>> {
  if (registryCache) return registryCache;
  try {
    const res = await fetch("/data/gloss_video_registry.json");
    registryCache = await res.json();
    return registryCache!;
  } catch {
    return {};
  }
}

/** Base display duration per sign image in ms (2.0 seconds as requested) */
const BASE_DISPLAY_MS = 2000;

/** Preload an image, returns a promise that resolves when loaded */
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/* ── Component ── */

export default function PSLVideoPlayer({
  items,
  currentGloss,
  isPlaying,
  speed,
  setIsPlaying,
  setSpeed,
  onSequenceComplete,
  onIndexChange,
  externalIndex,
}: PSLVideoPlayerProps) {
  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  const [loading, setLoading] = useState(false);
  const [registryLoaded, setRegistryLoaded] = useState(false);
  const [imgSrcA, setImgSrcA] = useState<string | null>(null);
  const [imgSrcB, setImgSrcB] = useState<string | null>(null);

  const registryRef = useRef<Record<string, string>>({});
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const queueRef = useRef<VideoQueueItem[]>([]);
  const currentIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadTokenRef = useRef(0);

  isPlayingRef.current = isPlaying;
  speedRef.current = speed;

  /* ── Load registry on mount ── */
  useEffect(() => {
    loadVideoRegistry()
      .then((reg) => {
        registryRef.current = reg;
        setRegistryLoaded(true);
      })
      .catch((e) => console.error("[PSLVideoPlayer] Registry load failed:", e));
  }, []);

  /* ── Build queue from items or gloss string ── */
  useEffect(() => {
    if (items && items.length > 0) {
      const newQueue: VideoQueueItem[] = items.map((it) => ({
        token: it.token,
        type: it.type,
        urdu: it.urdu,
        english: it.english,
        imageUrl: it.image_url || it.asset || (registryRef.current[it.token] ?? null),
        durationMs: it.duration_ms || BASE_DISPLAY_MS,
      }));
      setQueue(newQueue);
      queueRef.current = newQueue;
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setActiveSlot("A");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      preloadTokenRef.current++;
      setImgSrcA(null);
      setImgSrcB(null);
      return;
    }

    if (!registryLoaded) return;
    const tokens = (currentGloss ?? "").trim().split(/\s+/).filter(Boolean);
    const reg = registryRef.current;
    const newQueue: VideoQueueItem[] = tokens.map((t) => ({
      token: t,
      imageUrl: reg[t] ?? null,
      durationMs: BASE_DISPLAY_MS,
    }));
    setQueue(newQueue);
    queueRef.current = newQueue;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setActiveSlot("A");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    preloadTokenRef.current++;
    setImgSrcA(null);
    setImgSrcB(null);
  }, [items, currentGloss, registryLoaded]);

  /* ── Sync with external index if provided ── */
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== currentIndex && externalIndex < queue.length) {
      showImage(externalIndex);
    }
  }, [externalIndex]);

  /* ── Clear timer on unmount ── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* ── Display image at index with smooth crossfade ── */
  const showImage = useCallback(
    async (index: number) => {
      const q = queueRef.current;
      if (index >= q.length) {
        setIsPlaying?.(false);
        onSequenceComplete?.();
        return;
      }

      const item = q[index];
      if (!item?.imageUrl) {
        // Skip unavailable image and advance
        showImage(index + 1);
        return;
      }

      const token = ++preloadTokenRef.current;
      setLoading(true);
      setCurrentIndex(index);
      currentIndexRef.current = index;
      onIndexChange?.(index);

      try {
        await preloadImage(item.imageUrl);
        if (token !== preloadTokenRef.current) return;

        setLoading(false);

        // Crossfade toggle between Slot A and Slot B
        if (index % 2 === 0) {
          setImgSrcA(item.imageUrl);
          setActiveSlot("A");
        } else {
          setImgSrcB(item.imageUrl);
          setActiveSlot("B");
        }

        // Schedule next frame in the video-like sequence if playing
        if (isPlayingRef.current) {
          const itemBaseMs = item.durationMs || BASE_DISPLAY_MS;
          const duration = Math.max(600, itemBaseMs / speedRef.current);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            showImage(currentIndexRef.current + 1);
          }, duration);
        }
      } catch {
        if (token !== preloadTokenRef.current) return;
        setLoading(false);
        showImage(index + 1);
      }
    },
    [onIndexChange, onSequenceComplete, setIsPlaying],
  );

  /* ── Start playback when queue or isPlaying changes ── */
  useEffect(() => {
    if (queue.length > 0 && isPlaying) {
      showImage(currentIndexRef.current >= queue.length ? 0 : currentIndexRef.current);
    } else if (!isPlaying && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isPlaying, queue.length]);

  const currentItem = queue[currentIndex];
  const isEmpty = queue.length === 0;
  const hasNoImage = currentItem && !currentItem.imageUrl;
  const progressPercent = queue.length > 0 ? Math.round(((currentIndex + 1) / queue.length) * 100) : 0;

  const cycleSpeed = () => {
    if (!setSpeed) return;
    if (speed === 1.0) setSpeed(0.5);
    else if (speed === 0.5) setSpeed(1.5);
    else if (speed === 1.5) setSpeed(2.0);
    else setSpeed(1.0);
  };

  const handleReplay = () => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setIsPlaying?.(true);
    showImage(0);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = Math.max(0, currentIndex - 1);
    showImage(prevIdx);
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextIdx = Math.min(queue.length - 1, currentIndex + 1);
    showImage(nextIdx);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (queue.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIdx = Math.min(queue.length - 1, Math.floor(fraction * queue.length));
    showImage(targetIdx);
  };

  const formatTokenDisplay = (item: VideoQueueItem) => {
    if (item.token.startsWith("LETTER_")) {
      const letter = item.token.replace("LETTER_", "");
      return `Letter: ${letter}${item.urdu ? ` (${item.urdu})` : ""}`;
    }
    const cleanWord = item.token.replace(/_/g, " ");
    return `${cleanWord}${item.urdu ? ` • ${item.urdu}` : ""}`;
  };

  return (
    <div className="psl-video-player modern-player" data-slot={activeSlot}>
      {/* Dual image crossfader for seamless video-like transition */}
      {imgSrcA && (
        <img
          src={imgSrcA}
          alt="PSL Sign Language"
          className={`psl-img-slot ${activeSlot === "A" ? "active" : ""}`}
          draggable={false}
        />
      )}
      {imgSrcB && (
        <img
          src={imgSrcB}
          alt="PSL Sign Language"
          className={`psl-img-slot ${activeSlot === "B" ? "active" : ""}`}
          draggable={false}
        />
      )}

      {/* Empty state placeholder */}
      {isEmpty && (
        <div className="video-empty-state">
          <div className="empty-state-icon-wrap">
            <Sparkles size={34} className="empty-icon-sparkle" />
          </div>
          <h4 className="empty-state-title">PSL Sign Video Player</h4>
          <p className="empty-state-desc">
            Enter Urdu or English text on the left and click <strong>Translate</strong>.
            Signs will play sequentially in 2-second frames like video.
          </p>
          <div className="empty-state-pills">
            <span className="state-pill">2.0s Per Sign</span>
            <span className="state-pill">SOV Word Order</span>
            <span className="state-pill">Alphabet Fingerspelling</span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="video-loading-overlay">
          <Loader2 size={26} className="spin" />
          <span className="video-loading-text">Loading next sign...</span>
        </div>
      )}

      {/* No image fallback */}
      {hasNoImage && !loading && (
        <div className="video-error-overlay">
          <div className="video-generating-card">
            <ImageOff size={22} />
            <span>Sign for <strong>{currentItem.token.replace(/_/g, " ")}</strong> not in library</span>
          </div>
        </div>
      )}

      {/* Live Top Floating Badge Bar: Token Name & Step Counter */}
      {currentItem && !isEmpty && (
        <div className="player-meta-bar">
          <div className="video-token-badge">
            <span className="token-indicator-dot" />
            <span className="token-text">{formatTokenDisplay(currentItem)}</span>
            {currentItem.type === "LETTER" && <span className="type-pill">Fingerspelling</span>}
          </div>
          <span className="video-step-counter">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>
      )}

      {/* Integrated Video Playback Controls Dock (inside player frame) */}
      {queue.length > 0 && (
        <div className="player-controls-dock">
          {/* Clickable Scrubber Bar */}
          <div
            className="player-scrubber-track"
            onClick={handleScrubberClick}
            title="Click to jump to any sign"
          >
            <div
              className="player-scrubber-fill"
              style={{ width: `${progressPercent}%` }}
            >
              <span className="scrubber-thumb" />
            </div>
          </div>

          <div className="player-controls-row">
            {/* Left side: Step info */}
            <div className="controls-left-info">
              <span className="player-step-label">
                Sign {currentIndex + 1} of {queue.length}
              </span>
            </div>

            {/* Center: Playback control buttons */}
            <div className="player-center-btns">
              <button
                type="button"
                className="ctrl-btn nav-btn"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                title="Previous Sign"
              >
                <SkipBack size={15} />
              </button>

              <button
                type="button"
                className={`ctrl-btn play-main-btn ${isPlaying ? "playing" : ""}`}
                onClick={() => setIsPlaying?.(!isPlaying)}
                title={isPlaying ? "Pause Video Playback" : "Play Sign Sequence"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                type="button"
                className="ctrl-btn nav-btn"
                onClick={handleNext}
                disabled={currentIndex >= queue.length - 1}
                title="Next Sign"
              >
                <SkipForward size={15} />
              </button>

              <button
                type="button"
                className="ctrl-btn replay-btn"
                onClick={handleReplay}
                title="Replay sequence from beginning"
              >
                <RotateCcw size={14} />
                <span className="btn-text-optional">Replay</span>
              </button>
            </div>

            {/* Right side: Speed cycle */}
            <div className="controls-right-opts">
              {setSpeed && (
                <button
                  type="button"
                  className="ctrl-btn speed-ctrl"
                  onClick={cycleSpeed}
                  title="Change playback speed"
                >
                  <Clock3 size={13} />
                  <span>{speed.toFixed(1)}x</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
