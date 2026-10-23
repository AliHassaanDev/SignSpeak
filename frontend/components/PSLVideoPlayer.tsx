"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Film,
  Image as ImageIcon,
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
import { useLanguage } from "../app/context/LanguageContext";

/* ── Types ── */

export type PSLDisplayMode = "video" | "image" | "model3d";

export interface VideoQueueItem {
  token: string;
  type?: "WORD" | "LETTER" | "WORD_SIGN" | "FINGERSPELLING";
  urdu?: string;
  english?: string;
  mediaUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  isVideo: boolean;
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
  /** Presentation mode: "video" (real PSL clips) or "image" (sign illustration cards) */
  mode?: PSLDisplayMode;
  /** Callback when user changes the presentation mode */
  onModeChange?: (mode: PSLDisplayMode) => void;
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

/** Check if a URL or path is a video file */
function checkIsVideo(url: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|mkv)$/i.test(url);
}

/** Base display duration per sign in ms */
const BASE_DISPLAY_MS = 2000;

export default function PSLVideoPlayer({
  items,
  currentGloss,
  isPlaying,
  speed,
  mode = "video",
  onModeChange,
  setIsPlaying,
  setSpeed,
  onSequenceComplete,
  onIndexChange,
  externalIndex,
}: PSLVideoPlayerProps) {
  const [displayMode, setDisplayMode] = useState<PSLDisplayMode>(mode);
  const displayModeRef = useRef<PSLDisplayMode>(mode);
  displayModeRef.current = displayMode;
  const { t, isUrdu } = useLanguage();

  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  const [loading, setLoading] = useState(false);
  const [registryLoaded, setRegistryLoaded] = useState(false);

  // Slot A media state
  const [mediaA, setMediaA] = useState<{ url: string | null; isVideo: boolean }>({ url: null, isVideo: false });
  // Slot B media state
  const [mediaB, setMediaB] = useState<{ url: string | null; isVideo: boolean }>({ url: null, isVideo: false });

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);

  const registryRef = useRef<Record<string, string>>({});
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const queueRef = useRef<VideoQueueItem[]>([]);
  const currentIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  isPlayingRef.current = isPlaying;
  speedRef.current = speed;

  const advancingRef = useRef(false);

  /* ── Load registry on mount ── */
  useEffect(() => {
    loadVideoRegistry()
      .then((reg) => {
        registryRef.current = reg;
        setRegistryLoaded(true);
      })
      .catch((e) => console.error("[PSLVideoPlayer] Registry load failed:", e));
  }, []);

  /* ── Sync displayMode when mode prop changes ── */
  useEffect(() => {
    if (mode && mode !== displayModeRef.current) {
      setDisplayMode(mode);
      displayModeRef.current = mode;
      updateActiveMediaForMode(mode, currentIndexRef.current);
    }
  }, [mode]);

  /* ── Build queue from items or gloss string ── */
  useEffect(() => {
    if (items && items.length > 0) {
      const isVid = displayModeRef.current === "video";
      const newQueue: VideoQueueItem[] = items.map((it) => {
        const baseToken = it.token || "HELLO";
        const rawV = it.video_url || (registryRef.current[baseToken] ?? `/videos/glosses/${baseToken}.mp4`);
        const rawI = it.image_url || rawV.replace(/\.mp4$/i, ".png") || `/videos/glosses/${baseToken}.png`;

        const vUrl = rawV.replace(/\.png$/i, ".mp4");
        const iUrl = rawI.replace(/\.mp4$/i, ".png");
        const activeUrl = isVid ? vUrl : iUrl;

        return {
          token: it.token,
          type: it.type,
          urdu: it.urdu,
          english: it.english,
          mediaUrl: activeUrl,
          videoUrl: vUrl,
          imageUrl: iUrl,
          isVideo: isVid,
          durationMs: it.duration_ms || BASE_DISPLAY_MS,
        };
      });

      setQueue(newQueue);
      queueRef.current = newQueue;
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setActiveSlot("A");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Immediately render first item preview in Slot A
      if (newQueue.length > 0) {
        const first = newQueue[0];
        setMediaA({ url: isVid ? first.videoUrl : first.imageUrl, isVideo: isVid });
        setMediaB({ url: null, isVideo: false });
      } else {
        setMediaA({ url: null, isVideo: false });
        setMediaB({ url: null, isVideo: false });
      }
      return;
    }

    if (!registryLoaded) return;
    const tokens = (currentGloss ?? "").trim().split(/\s+/).filter(Boolean);
    const reg = registryRef.current;
    const isVid = displayModeRef.current === "video";
    const newQueue: VideoQueueItem[] = tokens.map((t) => {
      const rawV = reg[t] ?? `/videos/glosses/${t}.mp4`;
      const vUrl = rawV.replace(/\.png$/i, ".mp4");
      const iUrl = rawV.replace(/\.mp4$/i, ".png");
      const activeUrl = isVid ? vUrl : iUrl;
      return {
        token: t,
        mediaUrl: activeUrl,
        videoUrl: vUrl,
        imageUrl: iUrl,
        isVideo: isVid,
        durationMs: BASE_DISPLAY_MS,
      };
    });

    setQueue(newQueue);
    queueRef.current = newQueue;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setActiveSlot("A");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Immediately render first item preview in Slot A
    if (newQueue.length > 0) {
      const first = newQueue[0];
      setMediaA({ url: isVid ? first.videoUrl : first.imageUrl, isVideo: isVid });
      setMediaB({ url: null, isVideo: false });
    } else {
      setMediaA({ url: null, isVideo: false });
      setMediaB({ url: null, isVideo: false });
    }
  }, [items, currentGloss, registryLoaded]);

  /* ── Update video playback speed when speed prop changes ── */
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.playbackRate = speed;
    if (videoRefB.current) videoRefB.current.playbackRate = speed;
  }, [speed]);

  /* ── Switch Presentation Mode (Video <-> Image) on the fly ── */
  const updateActiveMediaForMode = useCallback((newMode: PSLDisplayMode, index: number) => {
    if (newMode === "model3d") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (videoRefA.current) videoRefA.current.pause();
      if (videoRefB.current) videoRefB.current.pause();
      setIsPlaying?.(false);
      return;
    }

    const q = queueRef.current;
    if (!q || q.length === 0 || index >= q.length) return;
    const item = q[index];
    if (!item) return;

    const isVid = newMode === "video";
    const targetSlot = index % 2 === 0 ? "A" : "B";
    const activeUrl = isVid
      ? (item.videoUrl || item.mediaUrl || `/videos/glosses/${item.token}.mp4`).replace(/\.png$/i, ".mp4")
      : (item.imageUrl || item.mediaUrl || `/videos/glosses/${item.token}.png`).replace(/\.mp4$/i, ".png");

    if (targetSlot === "A") {
      setMediaA({ url: activeUrl, isVideo: isVid });
    } else {
      setMediaB({ url: activeUrl, isVideo: isVid });
    }

    // Preload next clip in the alternate slot
    const nextItem = q[index + 1];
    if (nextItem) {
      const nextUrl = isVid
        ? (nextItem.videoUrl || nextItem.mediaUrl || `/videos/glosses/${nextItem.token}.mp4`).replace(/\.png$/i, ".mp4")
        : (nextItem.imageUrl || nextItem.mediaUrl || `/videos/glosses/${nextItem.token}.png`).replace(/\.mp4$/i, ".png");
      if (nextUrl) {
        if (targetSlot === "A") {
          setMediaB({ url: nextUrl, isVideo: isVid });
        } else {
          setMediaA({ url: nextUrl, isVideo: isVid });
        }
      }
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isPlayingRef.current) {
      if (!isVid) {
        // Start slideshow timer in image mode
        const itemDuration = item.durationMs || BASE_DISPLAY_MS;
        const duration = Math.max(600, (itemDuration * 0.75) / speedRef.current);
        timerRef.current = setTimeout(() => {
          advancingRef.current = true;
          playMediaAtIndex(index + 1);
        }, duration);
      } else {
        // Play video
        setTimeout(() => {
          const activeVidEl = targetSlot === "A" ? videoRefA.current : videoRefB.current;
          if (activeVidEl) {
            activeVidEl.playbackRate = speedRef.current;
            activeVidEl.play().catch(() => {});
          }
        }, 50);
      }
    }
  }, []);

  const switchMode = useCallback((newMode: PSLDisplayMode) => {
    if (newMode === displayModeRef.current) return;
    setDisplayMode(newMode);
    displayModeRef.current = newMode;
    onModeChange?.(newMode);
    updateActiveMediaForMode(newMode, currentIndexRef.current);
  }, [onModeChange, updateActiveMediaForMode]);

  /* ── Play sign media at specified index ── */
  const playMediaAtIndex = useCallback(
    (index: number) => {
      const q = queueRef.current;
      if (index >= q.length) {
        setIsPlaying?.(false);
        onSequenceComplete?.();
        return;
      }

      const item = q[index];
      if (!item) {
        playMediaAtIndex(index + 1);
        return;
      }

      const isVid = displayModeRef.current === "video";
      const activeUrl = isVid
        ? (item.videoUrl || item.mediaUrl || `/videos/glosses/${item.token}.mp4`).replace(/\.png$/i, ".mp4")
        : (item.imageUrl || item.mediaUrl || `/videos/glosses/${item.token}.png`).replace(/\.mp4$/i, ".png");

      if (!activeUrl) {
        // Skip unavailable item and advance
        playMediaAtIndex(index + 1);
        return;
      }

      // Reset advancing guard for the new item
      advancingRef.current = false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setCurrentIndex(index);
      currentIndexRef.current = index;
      onIndexChange?.(index);

      const targetSlot = index % 2 === 0 ? "A" : "B";

      if (targetSlot === "A") {
        setMediaA({ url: activeUrl, isVideo: isVid });
        setActiveSlot("A");
      } else {
        setMediaB({ url: activeUrl, isVideo: isVid });
        setActiveSlot("B");
      }

      // Preload next clip in the alternate slot
      const nextItem = q[index + 1];
      if (nextItem) {
        const nextUrl = isVid
          ? (nextItem.videoUrl || nextItem.mediaUrl || `/videos/glosses/${nextItem.token}.mp4`).replace(/\.png$/i, ".mp4")
          : (nextItem.imageUrl || nextItem.mediaUrl || `/videos/glosses/${nextItem.token}.png`).replace(/\.mp4$/i, ".png");
        if (nextUrl) {
          if (targetSlot === "A") {
            setMediaB({ url: nextUrl, isVideo: isVid });
          } else {
            setMediaA({ url: nextUrl, isVideo: isVid });
          }
        }
      }

      // If it's Image mode, use timer to advance sequentially like a video slideshow
      if (!isVid && isPlayingRef.current) {
        const itemDuration = item.durationMs || BASE_DISPLAY_MS;
        const duration = Math.max(600, (itemDuration * 0.75) / speedRef.current);
        timerRef.current = setTimeout(() => {
          advancingRef.current = true;
          playMediaAtIndex(index + 1);
        }, duration);
      }
    },
    [onIndexChange, onSequenceComplete, setIsPlaying]
  );

  /* ── Video 'ended' handler: seamlessly advances to next sign in sequence ── */
  const handleVideoEnded = useCallback(() => {
    if (!isPlayingRef.current || advancingRef.current) return;
    advancingRef.current = true;
    const nextIdx = currentIndexRef.current + 1;
    playMediaAtIndex(nextIdx);
  }, [playMediaAtIndex]);

  /* ── Handle Play / Pause state synchronization ── */
  useEffect(() => {
    const isVid = displayModeRef.current === "video";
    if (isVid) {
      const activeVideo = activeSlot === "A" ? videoRefA.current : videoRefB.current;
      if (!activeVideo) return;

      if (isPlaying) {
        activeVideo.playbackRate = speedRef.current;
        activeVideo.play().catch(() => {});
      } else {
        activeVideo.pause();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    } else {
      // In Image mode
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (isPlaying && queueRef.current.length > 0) {
        const curItem = queueRef.current[currentIndexRef.current];
        const itemDuration = curItem?.durationMs || BASE_DISPLAY_MS;
        const duration = Math.max(600, (itemDuration * 0.75) / speedRef.current);
        timerRef.current = setTimeout(() => {
          advancingRef.current = true;
          playMediaAtIndex(currentIndexRef.current + 1);
        }, duration);
      }
    }
  }, [isPlaying, activeSlot, currentIndex, playMediaAtIndex]);

  /* ── Clear timer on unmount ── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* ── Untrimmed video playback: let video play naturally to completion ── */
  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    // Play original untrimmed video in full; natural completion is handled by handleVideoEnded
  }, []);

  /* ── Start playback when queue or isPlaying changes ── */
  useEffect(() => {
    if (queue.length > 0 && isPlaying) {
      playMediaAtIndex(currentIndexRef.current >= queue.length ? 0 : currentIndexRef.current);
    } else if (!isPlaying && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isPlaying, queue.length, playMediaAtIndex]);

  /* ── Sync with external index if provided ── */
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== currentIndex && externalIndex < queue.length) {
      playMediaAtIndex(externalIndex);
    }
  }, [externalIndex, playMediaAtIndex, currentIndex, queue.length]);

  const currentItem = queue[currentIndex];
  const isEmpty = queue.length === 0;
  const hasNoMedia = currentItem && !currentItem.mediaUrl;
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
    playMediaAtIndex(0);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = Math.max(0, currentIndex - 1);
    playMediaAtIndex(prevIdx);
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextIdx = Math.min(queue.length - 1, currentIndex + 1);
    playMediaAtIndex(nextIdx);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (queue.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIdx = Math.min(queue.length - 1, Math.floor(fraction * queue.length));
    playMediaAtIndex(targetIdx);
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
      {/* ── Slot A: Video / Image ── */}
      {mediaA.url && (
        mediaA.isVideo ? (
          <video
            key={`slotA_${mediaA.url}_${currentIndex}`}
            ref={videoRefA}
            src={mediaA.url}
            autoPlay={isPlaying && activeSlot === "A"}
            muted
            playsInline
            onCanPlay={(e) => {
              e.currentTarget.playbackRate = speedRef.current;
              if (isPlayingRef.current && activeSlot === "A") {
                e.currentTarget.play().catch(() => {});
              }
            }}
            onTimeUpdate={activeSlot === "A" ? handleTimeUpdate : undefined}
            onEnded={activeSlot === "A" ? handleVideoEnded : undefined}
            onError={() => {
              if (isPlayingRef.current && activeSlot === "A") handleVideoEnded();
            }}
            className={`psl-video-slot ${activeSlot === "A" ? "active" : ""}`}
            style={{ display: activeSlot === "A" || mediaB.url ? "block" : "none" }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={`slotA_${mediaA.url}_${currentIndex}`}
            src={mediaA.url}
            alt="PSL Sign Language"
            className={`psl-img-slot ${activeSlot === "A" ? "active" : ""}`}
            draggable={false}
          />
        )
      )}

      {/* ── Slot B: Video / Image ── */}
      {mediaB.url && (
        mediaB.isVideo ? (
          <video
            key={`slotB_${mediaB.url}_${currentIndex}`}
            ref={videoRefB}
            src={mediaB.url}
            autoPlay={isPlaying && activeSlot === "B"}
            muted
            playsInline
            onCanPlay={(e) => {
              e.currentTarget.playbackRate = speedRef.current;
              if (isPlayingRef.current && activeSlot === "B") {
                e.currentTarget.play().catch(() => {});
              }
            }}
            onTimeUpdate={activeSlot === "B" ? handleTimeUpdate : undefined}
            onEnded={activeSlot === "B" ? handleVideoEnded : undefined}
            onError={() => {
              if (isPlayingRef.current && activeSlot === "B") handleVideoEnded();
            }}
            className={`psl-video-slot ${activeSlot === "B" ? "active" : ""}`}
            style={{ display: activeSlot === "B" || mediaA.url ? "block" : "none" }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={`slotB_${mediaB.url}_${currentIndex}`}
            src={mediaB.url}
            alt="PSL Sign Language"
            className={`psl-img-slot ${activeSlot === "B" ? "active" : ""}`}
            draggable={false}
          />
        )
      )}

      {/* ── 3D Model Studio Embedded View (HoloSign 75) ── */}
      {displayMode === "model3d" && (
        <div className="psl-model3d-container">
          <iframe
            src="/holosign_75.html"
            title="3D Sign & Gesture Benchmark Studio"
            className="psl-model3d-iframe"
          />
        </div>
      )}

      {/* Empty state placeholder */}
      {isEmpty && displayMode !== "model3d" && (
        <div className="video-empty-state">
          <div className="empty-state-icon-wrap">
            <Sparkles size={34} className="empty-icon-sparkle" />
          </div>
          <h4 className="empty-state-title">
            {displayMode === "image" ? t.playerEmptyTitleImage : t.playerEmptyTitleVideo}
          </h4>
          <p className="empty-state-desc">
            {displayMode === "image"
              ? t.playerEmptyDescImage
              : t.playerEmptyDescVideo}
          </p>
          <div className="empty-state-pills">
            <span className="state-pill">
              {displayMode === "image" ? (
                <>
                  <ImageIcon size={12} style={{ display: "inline", marginRight: 4 }} />
                  {t.playerPillHDImage}
                </>
              ) : (
                <>
                  <Film size={12} style={{ display: "inline", marginRight: 4 }} />
                  {t.playerPillHDVideo}
                </>
              )}
            </span>
            <span className="state-pill">{t.playerPillSOV}</span>
            <span className="state-pill">{t.playerPillFingerspelling}</span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && displayMode !== "model3d" && (
        <div className="video-loading-overlay">
          <Loader2 size={26} className="spin" />
          <span className="video-loading-text">
            {displayMode === "image" ? t.playerLoadingImage : t.playerLoadingVideo}
          </span>
        </div>
      )}

      {/* No media fallback */}
      {hasNoMedia && !loading && displayMode !== "model3d" && (
        <div className="video-error-overlay">
          <div className="video-generating-card">
            <ImageOff size={22} />
            <span>
              {t.playerNotFound(currentItem.token.replace(/_/g, " "), displayMode)}
            </span>
          </div>
        </div>
      )}

      {/* Live Top Floating Badge Bar: Token Name, Mode Switcher & Step Counter */}
      {currentItem && !isEmpty && displayMode !== "model3d" && (
        <div className="player-meta-bar">
          <div className="video-token-badge">
            <span className="token-indicator-dot" />
            <span className="token-text">{formatTokenDisplay(currentItem)}</span>
            {currentItem.type === "LETTER" && <span className="type-pill">{t.playerPillFingerspelling}</span>}
            <span
              className="type-pill"
              style={
                displayMode === "video"
                  ? { background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.4)" }
                  : { background: "rgba(6, 182, 212, 0.2)", color: "#06b6d4", borderColor: "rgba(6, 182, 212, 0.4)" }
              }
            >
              {displayMode === "video" ? t.modeVideo : t.modeImages}
            </span>
          </div>

          {/* Quick inline mode switcher in player header */}
          <div className="player-inline-mode-toggle" role="group" aria-label="Select Presentation Format">
            <button
              type="button"
              className={`inline-mode-btn ${displayMode === "image" ? "active image-active" : ""}`}
              onClick={() => switchMode("image")}
              title="Understand by Images: Sequential sign cards"
            >
              <ImageIcon size={12} />
              <span>{t.modeImages}</span>
            </button>
            <button
              type="button"
              className={`inline-mode-btn ${displayMode === "video" ? "active video-active" : ""}`}
              onClick={() => switchMode("video")}
              title="Understand by Video: Natural PSL video clips"
            >
              <Film size={12} />
              <span>{t.modeVideo}</span>
            </button>
            <button
              type="button"
              className={`inline-mode-btn ${(displayMode as string) === "model3d" ? "active model-active" : ""}`}
              onClick={() => switchMode("model3d")}
              title="3D Model: HoloSign 75 Benchmark Studio"
            >
              <Box size={12} />
              <span>{t.mode3DModel}</span>
            </button>
          </div>

          <span className="video-step-counter">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>
      )}

      {/* Integrated Video Playback Controls Dock (inside player frame) */}
      {queue.length > 0 && displayMode !== "model3d" && (
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
                {t.signCounter(currentIndex + 1, queue.length)}
              </span>
            </div>

            {/* Center: Playback control buttons */}
            <div className="player-center-btns">
              <button
                type="button"
                className="ctrl-btn nav-btn"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                title={t.ctrlPrev}
              >
                <SkipBack size={15} />
              </button>

              <button
                type="button"
                className={`ctrl-btn play-main-btn ${isPlaying ? "playing" : ""}`}
                onClick={() => setIsPlaying?.(!isPlaying)}
                title={isPlaying ? t.ctrlPause : t.ctrlPlay}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? t.ctrlPause : t.ctrlPlay}</span>
              </button>

              <button
                type="button"
                className="ctrl-btn nav-btn"
                onClick={handleNext}
                disabled={currentIndex >= queue.length - 1}
                title={t.ctrlNext}
              >
                <SkipForward size={15} />
              </button>

              <button
                type="button"
                className="ctrl-btn replay-btn"
                onClick={handleReplay}
                title={t.ctrlReplay}
              >
                <RotateCcw size={14} />
                <span className="btn-text-optional">{t.ctrlReplay}</span>
              </button>
            </div>

            {/* Right side: Speed cycle */}
            <div className="controls-right-opts">
              {setSpeed && (
                <button
                  type="button"
                  className="ctrl-btn speed-ctrl"
                  onClick={cycleSpeed}
                  title={t.ctrlSpeed}
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
