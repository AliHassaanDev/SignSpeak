"use client";

import React, { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PSLSign } from "../app/lib/psl-dictionary";
import { AnimationItem } from "../services/pslService";
import {
  BONE_MAP,
  loadGlossDictionary,
  getLoadedDictionary,
  normalizeToken,
  type GlossDictionary,
} from "../app/lib/poseSequencer";

// Suppress THREE.Clock deprecation warning
if (typeof window !== "undefined") {
  const _origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    _origWarn.apply(console, args);
  };
}

/* ────────────────────────── Types ────────────────────────── */

export interface AvatarPlayerProps {
  animationQueue?: AnimationItem[];
  currentGloss?: string;
  isPlaying?: boolean;
  speed?: number;
  sign?: PSLSign | null;
  onSequenceComplete?: () => void;
  onIndexChange?: (index: number) => void;
}

const FALLBACK_DURATION = 1.2;
type BoneCacheMap = Map<string, THREE.Bone>;

interface AvatarPose {
  leftArm: { shoulderAngle: number; elbowAngle: number; handShape: string };
  rightArm: { shoulderAngle: number; elbowAngle: number; handShape: string };
  headTilt: number;
  expression: string;
  motionType: string;
}

/* ────────────────────── AnimationMixer Helpers ────────────────────── */

/**
 * Build a Three.js AnimationClip from a sequence of gloss keyframes.
 * Each token's keyframes are laid out sequentially in time, with 0.15 s
 * transition gaps between tokens.  All tokens' keyframes for a given bone
 * are merged into a SINGLE track per bone: emitting one track per token
 * would create duplicate track names inside the clip, and AnimationMixer
 * accumulates duplicate-named tracks into the same PropertyMixer — every
 * sign would be averaged with the other tokens' poses, producing the
 * barely-moving, out-of-sync avatar on multi-word sentences.
 */

/**
 * Remaps raw keyframe dataset rotations [x, y, z] (in radians)
 * to match Three.js Mixamo GLTF bone orientation.
 */
function datasetToMixamoQuaternion(
  shortKey: string,
  rot: [number, number, number]
): THREE.Quaternion {
  let [x, y, z] = rot;

  // Invert Z and Y axes for right and left upper arms
  if (shortKey === "rArm" || shortKey === "lArm") {
    z = -z;
    y = -y;
  } else if (shortKey === "rHand" || shortKey === "lHand") {
    y = -y;
  }

  // Use 'YXZ' Euler order to avoid joint flips/gimbal lock
  const euler = new THREE.Euler(x, y, z, "YXZ");
  return new THREE.Quaternion().setFromEuler(euler);
}

function buildGlossSequenceClip(
  tokens: string[],
  dict: GlossDictionary,
  boneMap: Map<string, THREE.Bone>,
): THREE.AnimationClip {
  const boneKeys = Array.from(boneMap.keys());
  const boneTimes = new Map<string, number[]>();
  const boneValues = new Map<string, number[]>();
  const transitionGap = 0.15;
  let timeOffset = 0;

  const pushKey = (
  shortKey: string,
  time: number,
  rot: [number, number, number],
) => {
  let times = boneTimes.get(shortKey);
  if (!times) {
    times = [];
    boneTimes.set(shortKey, times);
    boneValues.set(shortKey, []);
  }

  // Convert raw dataset rotation to calibrated Mixamo Quaternion
  const q = datasetToMixamoQuaternion(shortKey, rot);

  times.push(time);
  boneValues.get(shortKey)!.push(q.x, q.y, q.z, q.w);
};

  for (const token of tokens) {
    const raw = dict[token] || dict[token.toUpperCase()] || dict[token.toLowerCase()];
    const keyframes = Array.isArray(raw) ? raw : raw?.keyframes ?? null;
    if (!keyframes || keyframes.length === 0) {
      timeOffset += FALLBACK_DURATION + transitionGap;
      continue;
    }

    for (const kf of keyframes) {
      for (const shortKey of boneKeys) {
        const rot = kf.bones[shortKey];
        if (!rot) continue;
        pushKey(shortKey, timeOffset + kf.time, rot);
      }
    }

    timeOffset += keyframes[keyframes.length - 1].time + transitionGap;
  }

  const tracks: THREE.QuaternionKeyframeTrack[] = [];
  for (const [shortKey, times] of boneTimes) {
    if (times.length === 0) continue;
    tracks.push(
      new THREE.QuaternionKeyframeTrack(
        `${BONE_MAP[shortKey]}.quaternion`,
        times,
        boneValues.get(shortKey)!,
      ),
    );
  }

  const totalDuration = timeOffset > 0 ? timeOffset : 1;
  return new THREE.AnimationClip("glossSequence", totalDuration, tracks);
}

/**
 * Build a looping idle AnimationClip — arms hanging naturally with
 * a gentle head bob.
 */
function buildIdleClip(boneMap: Map<string, THREE.Bone>): THREE.AnimationClip {
  const tracks: THREE.QuaternionKeyframeTrack[] = [];
  const dur = 4;
  const steps = 8;

  const idlePoses: Record<string, [number, number, number][]> = {
    rArm: Array.from({ length: steps + 1 }, () => [0, 0, 1.4]),
    rForeArm: Array.from({ length: steps + 1 }, () => [0, 0, 0]),
    rHand: Array.from({ length: steps + 1 }, () => [0, 0, 0]),
    lArm: Array.from({ length: steps + 1 }, () => [0, 0, -1.4]),
    lForeArm: Array.from({ length: steps + 1 }, () => [0, 0, 0]),
    lHand: Array.from({ length: steps + 1 }, () => [0, 0, 0]),
    head: Array.from({ length: steps + 1 }, (_, i) => [
      Math.sin((i / steps) * Math.PI * 2) * 0.04,
      0,
      0,
    ]),
  };

  for (const [shortKey, poses] of Object.entries(idlePoses)) {
    if (!boneMap.has(shortKey)) continue;
    const times: number[] = [];
    const values: number[] = [];
    for (let i = 0; i <= steps; i++) {
      times.push((i / steps) * dur);
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(poses[i][0], poses[i][1], poses[i][2]),
      );
      values.push(q.x, q.y, q.z, q.w);
    }
    tracks.push(
      new THREE.QuaternionKeyframeTrack(
        `${BONE_MAP[shortKey]}.quaternion`,
        times,
        values,
      ),
    );
  }

  return new THREE.AnimationClip("idle", dur, tracks);
}

/* ──────────────────────────────────────────────────────────────────
 * XbotAvatar — single always-mounted component.
 * ONE scene load, ONE <primitive>, ONE useFrame.
 * Handles three modes:
 *   A) Keyframe animation (when tokens exist)
 *   B) Procedural sign pose (when sign has avatarPose, no tokens)
 *   C) Idle rest pose (fallback)
 * ────────────────────────────────────────────────────────────────── */

function XbotAvatar({
  animationQueue,
  currentGloss,
  isPlaying,
  speed,
  sign,
  onSequenceComplete,
  onIndexChange,
}: {
  animationQueue: AnimationItem[];
  currentGloss: string;
  isPlaying: boolean;
  speed: number;
  sign: PSLSign | null;
  onSequenceComplete?: () => void;
  onIndexChange?: (index: number) => void;
}) {
  // ── Single scene load — never unmounted ──
  // The GLB ships 7 professional Mixamo animations (idle, walk, run, agree,
  // headShake, sad_pose, sneak_pose). These are proven to rig-correct and are
  // used as the idle/fallback so the avatar always has believable motion.
  const { scene, animations } = useGLTF("/models/Xbot.glb");

  // ── Gloss dictionary ──
  const [glossDict, setGlossDict] = useState<GlossDictionary>(getLoadedDictionary() ?? {});
  useEffect(() => {
    const cached = getLoadedDictionary();
    if (cached && Object.keys(cached).length > 0) {
      setGlossDict(cached);
    } else {
      loadGlossDictionary().then((dict) => setGlossDict(dict));
    }
  }, []);

  // ── Build active token array from queue or gloss string ──
  // Expands digraph tokens (e.g. LETTER_SH → LETTER_S + LETTER_H) so
  // each token matches a single-letter entry in the JSON dictionary.
  const activeTokens = useMemo<string[]>(() => {
    const expandToken = (raw: string): string[] => {
      const t = normalizeToken(raw);
      if (!t) return [];
      const letterMatch = t.match(/^LETTER_(.+)$/);
      if (letterMatch && letterMatch[1].length > 1) {
        return letterMatch[1].split("").map((c) => `LETTER_${c}`);
      }
      return [t];
    };

    if (animationQueue && animationQueue.length > 0) {
      return animationQueue
        .flatMap((item) =>
          expandToken(
            item.token ||
            (item as unknown as { gloss?: string }).gloss ||
            (item as unknown as { word?: string }).word ||
            "",
          ),
        )
        .filter(Boolean);
    }
    if (currentGloss && currentGloss.trim()) {
      return currentGloss
        .trim()
        .split(/\s+/)
        .flatMap((t) => expandToken(t))
        .filter(Boolean);
    }
    return [];
  }, [animationQueue, currentGloss]);

  const tokenKey = activeTokens.join("|");
  const hasTokens = activeTokens.length > 0;

  // ── Sequential playback refs ──
  const playbackTimeRef = useRef(0);
  const currentTokenIndexRef = useRef(0);
  const playingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const onSeqCompleteRef = useRef(onSequenceComplete);
  const onIdxChangeRef = useRef(onIndexChange);
  const loggedMissingRef = useRef<Set<string>>(new Set());

  // Procedural pose animation timer
  const procTimeRef = useRef(0);

  useEffect(() => { playingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { onSeqCompleteRef.current = onSequenceComplete; }, [onSequenceComplete]);
  useEffect(() => { onIdxChangeRef.current = onIndexChange; }, [onIndexChange]);

  // Reset playback when token contents change
  useEffect(() => {
    playbackTimeRef.current = 0;
    currentTokenIndexRef.current = 0;
    loggedMissingRef.current.clear();
    onIdxChangeRef.current?.(0);
  }, [tokenKey]);

  // Reset Mode B flag when tokens change
  useEffect(() => {
    wasModeBRef.current = false;
  }, [tokenKey]);

  // ── Cache bones ONCE — scene never changes, so refs stay valid ──
  const bonesMap = useMemo<BoneCacheMap>(() => {
    const map = new Map<string, THREE.Bone>();
    for (const [shortKey, mixamoName] of Object.entries(BONE_MAP)) {
      const bone = scene.getObjectByName(mixamoName);
      if (bone) {
        const b = bone as THREE.Bone;
        // CRITICAL: Ensure local matrix auto-updates from rotation/quaternion.
        // Without this, skeleton.update() reads stale local matrices.
        b.matrixAutoUpdate = true;
        map.set(shortKey, b);
      }
    }
    const found = Array.from(map.keys());
    console.log(`[AvatarPlayer] Cached ${found.length} bones:`, found);
    return map;
  }, [scene]);

  // ── AnimationMixer — proven to correctly drive SkinnedMesh deformation ──
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const seqActionRef = useRef<THREE.AnimationAction | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const wasModeBRef = useRef(false);

  // Locate the GLB's built-in idle clip (professional Mixamo animation)
  const builtinIdleClip = useMemo<THREE.AnimationClip | null>(() => {
    const clip = animations.find((a) => a.name === "idle") ?? animations[0] ?? null;
    console.log(
      `[AvatarPlayer] GLB animations available: [${animations.map((a) => a.name).join(", ")}]` +
        ` — using "${clip?.name ?? "none"}" as idle`,
    );
    return clip;
  }, [animations]);

  const skinnedMeshes = useMemo<THREE.SkinnedMesh[]>(() => {
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((child) => {
      const m = child as THREE.SkinnedMesh;
      if (m.isSkinnedMesh && m.skeleton) {
        meshes.push(m);
        // CRITICAL FIX: Pre-compute bone texture so skeleton.update() can
        // set needsUpdate=true from the very first frame.  Without this,
        // the texture is created lazily during the first render, and
        // skeleton.update() in preceding useFrame calls cannot flag it
        // for GPU re-upload.
        m.skeleton.computeBoneTexture();
      }
    });
    console.log(`[AvatarPlayer] Cached ${meshes.length} skinned meshes (boneTexture pre-computed)`);
    return meshes;
  }, [scene]);

  // ── Main frame loop ──
  useFrame((_state, delta) => {
    const spd = speedRef.current;
    const mixer = mixerRef.current;

    if (hasTokens && playingRef.current) {
      // ═══ MODE A: Keyframe animation via AnimationMixer ═══
      procTimeRef.current = 0;

      // The sequence action must be the ONLY active action. If the idle
      // action is still running, fade it out — two simultaneous weight-1
      // actions average their poses and the signs become barely visible.
      if (idleActionRef.current) {
        idleActionRef.current.fadeOut(0.15);
        idleActionRef.current = null;
      }

      // Unpause the sequence action when returning from a paused hold
      // (guarded so a finished, clamped action is left alone)
      if (
        seqActionRef.current?.paused &&
        seqActionRef.current.time < seqActionRef.current.getClip().duration - 1e-3
      ) {
        seqActionRef.current.paused = false;
      }

      // Restart mixer if returning from Mode B (which stopped the mixer)
      if (wasModeBRef.current) {
        wasModeBRef.current = false;
        if (seqActionRef.current) {
          seqActionRef.current.reset().play();
        } else if (mixer) {
          const clip = buildGlossSequenceClip(activeTokens, glossDict, bonesMap);
          const action = mixer.clipAction(clip);
          action.reset().play();
          seqActionRef.current = action;
        }
      }

      // Advance token index tracking for UI callbacks
      const idx = currentTokenIndexRef.current;
      const token = idx < activeTokens.length ? activeTokens[idx] : null;
      if (token) {
        const rawGlossData =
          glossDict[token] ||
          glossDict[token.toUpperCase()] ||
          glossDict[token.toLowerCase()];
        const keyframes = Array.isArray(rawGlossData)
          ? rawGlossData
          : rawGlossData?.keyframes ?? null;

        if (keyframes && keyframes.length > 0) {
          const tokenDuration = keyframes[keyframes.length - 1].time;
          playbackTimeRef.current += delta * spd;

          // One-time log when starting a new token
          if (playbackTimeRef.current <= delta * spd * 1.1) {
            const peak = keyframes[Math.floor(keyframes.length / 2)];
            console.log(`[AvatarPlayer] Playing "${token}" dur=${tokenDuration}s kf=${keyframes.length} peak_bones=`, peak?.bones);
          }

          if (playbackTimeRef.current >= tokenDuration) {
            playbackTimeRef.current = 0;
            if (idx < activeTokens.length - 1) {
              const nextIdx = idx + 1;
              currentTokenIndexRef.current = nextIdx;
              onIdxChangeRef.current?.(nextIdx);
            } else {
              playingRef.current = false;
              onSeqCompleteRef.current?.();
            }
          }
        } else {
          if (!loggedMissingRef.current.has(token)) {
            const count = Object.keys(glossDict).length;
            console.log(`[AvatarPlayer] Token "${token}" missing (${count} loaded), idle fallback`);
            loggedMissingRef.current.add(token);
          }
          playbackTimeRef.current += delta * spd;
          if (playbackTimeRef.current >= FALLBACK_DURATION) {
            playbackTimeRef.current = 0;
            if (idx < activeTokens.length - 1) {
              const nextIdx = idx + 1;
              currentTokenIndexRef.current = nextIdx;
              onIdxChangeRef.current?.(nextIdx);
            } else {
              playingRef.current = false;
              onSeqCompleteRef.current?.();
            }
          }
        }
      }

      // Mixer drives all bone updates — no manual skeleton.update() needed
      if (mixer) mixer.update(delta * spd);

    } else if (sign?.avatarPose && isPlaying) {
      // ═══ MODE B: Procedural sign pose (direct bone manipulation) ═══
      playbackTimeRef.current = 0;
      procTimeRef.current += delta * spd * 5;
      const pose = sign.avatarPose as unknown as AvatarPose;
      const dt = delta * spd * 8;

      // Stop mixer actions so they don't fight our manual bone writes
      if (mixer) {
        seqActionRef.current?.stop();
        seqActionRef.current = null;
        idleActionRef.current?.stop();
        idleActionRef.current = null;
        mixer.stopAllAction();
      }
      wasModeBRef.current = true;

      const lerpRot = (bone: THREE.Bone | undefined, tx: number, ty: number, tz: number) => {
        if (bone) {
          bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, tx, dt);
          bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, ty, dt);
          bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, tz, dt);
        }
      };

      const lArm = bonesMap.get("lArm");
      const lForeArm = bonesMap.get("lForeArm");
      const rArm = bonesMap.get("rArm");
      const rForeArm = bonesMap.get("rForeArm");
      const head = bonesMap.get("head");

      const lShoulderRad = THREE.MathUtils.degToRad(pose.leftArm.shoulderAngle);
      const lElbowRad = THREE.MathUtils.degToRad(pose.leftArm.elbowAngle);
      lerpRot(lArm, 0, 0, lShoulderRad + 1.2);
      lerpRot(lForeArm, -lElbowRad, 0, 0);

      const rShoulderRad = THREE.MathUtils.degToRad(pose.rightArm.shoulderAngle);
      const rElbowRad = THREE.MathUtils.degToRad(pose.rightArm.elbowAngle);
      let tRArmX = 0, tRArmY = 0;
      const tRArmZ = -rShoulderRad - 1.2;
      let tRForeArmX = -rElbowRad;

      const mt = pose.motionType;
      if (mt === "wave") {
        tRArmX = Math.sin(procTimeRef.current) * 0.5;
        tRForeArmX = -0.5;
      } else if (mt === "chestTouch") {
        tRArmX = -0.8; tRArmY = -1.0; tRForeArmX = -2.0;
      } else if (mt === "forwardPush") {
        tRArmX = -1.5; tRForeArmX = -0.5 + Math.sin(procTimeRef.current) * 0.4;
      } else if (mt === "sideToSide") {
        tRArmY = Math.sin(procTimeRef.current) * 0.8;
      }

      lerpRot(rArm, tRArmX, tRArmY, tRArmZ);
      lerpRot(rForeArm, tRForeArmX, 0, 0);
      lerpRot(head, 0, 0, THREE.MathUtils.degToRad(pose.headTilt));

    } else if (hasTokens) {
      // ═══ MODE A-HOLD: paused with tokens — freeze the current sign pose ═══
      // Do NOT advance the mixer here (that would keep playing the sequence
      // while "paused") and do NOT run the idle animation on top of the held
      // pose — both made the avatar drift out of sync with the words.
      procTimeRef.current = 0;
      if (seqActionRef.current) {
        seqActionRef.current.paused = true;
      }
      if (idleActionRef.current) {
        idleActionRef.current.stop();
        idleActionRef.current = null;
      }
    } else {
      // ═══ MODE C: Idle rest pose via AnimationMixer ═══
      playbackTimeRef.current = 0;
      procTimeRef.current = 0;

      if (mixer) {
        // Restart mixer if returning from Mode B
        if (wasModeBRef.current) {
          wasModeBRef.current = false;
          mixer.stopAllAction();
          seqActionRef.current = null;
          idleActionRef.current = null;
        }

        if (!idleActionRef.current) {
          // Prefer the GLB's built-in professional idle animation.
          // This is also the end-to-end pipeline proof: if the avatar visibly
          // sways/breathes at rest, the ENTIRE GPU skinning pipeline works.
          const clip = builtinIdleClip ?? buildIdleClip(bonesMap);
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          idleActionRef.current = action;
          console.log(
            `[AvatarPlayer] Idle action started: "${clip.name}" ` +
              `(builtin=${!!builtinIdleClip}, tracks=${clip.tracks.length}, dur=${clip.duration.toFixed(2)}s)`,
          );
        }

        mixer.update(delta);
      }
    }

    // ── CRITICAL: Three.js r185 does NOT call skeleton.update() automatically. ──
    // The render loop calls updateMatrixWorld() (updating bone world matrices),
    // but nobody recomputes boneMatrices or flags the boneTexture for GPU re-upload.
    // We must do BOTH here every frame:
    //   1. scene.updateMatrixWorld(true) — propagate bone rotations to matrixWorld
    //   2. skeleton.update() — write boneMatrices from matrixWorld, flag boneTexture
    scene.updateMatrixWorld(true);
    for (let i = 0; i < skinnedMeshes.length; i++) {
      skinnedMeshes[i].skeleton!.update();
    }
  });

  // Set up AnimationMixer once scene is loaded
  useEffect(() => {
    const m = new THREE.AnimationMixer(scene);
    mixerRef.current = m;
    console.log("[AvatarPlayer] AnimationMixer initialized");
    return () => {
      m.stopAllAction();
      mixerRef.current = null;
      seqActionRef.current = null;
      idleActionRef.current = null;
    };
  }, [scene]);

  // ── Replay / resume handling ──
  // Pressing Play after a finished sequence must restart the clip from the
  // beginning: a finished LoopOnce action stays clamped on its final frame,
  // so without an explicit reset() a replay would show no motion at all.
  const prevPlayingRef = useRef(isPlaying);
  useEffect(() => {
    const wasPlaying = prevPlayingRef.current;
    prevPlayingRef.current = isPlaying;
    if (wasPlaying || !isPlaying || activeTokens.length === 0) return;

    const action = seqActionRef.current;
    if (!action) return;

    if (action.time >= action.getClip().duration - 1e-3) {
      // Previous run finished — restart from the beginning
      playbackTimeRef.current = 0;
      currentTokenIndexRef.current = 0;
      onIdxChangeRef.current?.(0);
      action.reset().play();
    } else {
      // Previous run was paused mid-sequence — resume from the held pose
      action.paused = false;
    }
    if (idleActionRef.current) {
      idleActionRef.current.stop();
      idleActionRef.current = null;
    }
  }, [isPlaying, tokenKey]);

  // Build + play sequence clip when tokens change
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    wasModeBRef.current = false;

    if (activeTokens.length > 0) {
      const clip = buildGlossSequenceClip(activeTokens, glossDict, bonesMap);
      const newAction = mixer.clipAction(clip);
      newAction.setLoop(THREE.LoopOnce, 1);
      newAction.clampWhenFinished = true;

      // The sequence action must exclusively own the mixer: stop the idle
      // action and any previous sequence action. Simultaneous weight-1
      // actions average their poses, making the signs barely visible.
      if (idleActionRef.current) {
        idleActionRef.current.stop();
        idleActionRef.current = null;
      }
      if (seqActionRef.current && seqActionRef.current !== newAction) {
        seqActionRef.current.stop();
      }

      newAction.reset().play();
      // Hold the first frame when playback hasn't been requested yet — the
      // isPlaying transition effect above un-pauses it when Play is pressed.
      if (!playingRef.current) {
        newAction.paused = true;
      }
      seqActionRef.current = newAction;
      console.log(`[AvatarPlayer] Sequence clip: ${activeTokens.length} tokens, ${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks`);
    } else {
      if (seqActionRef.current) {
        seqActionRef.current.fadeOut(0.3);
        seqActionRef.current = null;
      }
    }
  }, [tokenKey, glossDict]);

  // Single <primitive> — scene never detached
  return (
    <group dispose={null} position={[0, -0.95, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/Xbot.glb");

/* ──────────────────────────────────────────────────────────────────
 * Exported component — ONE Canvas, always mounted.
 * ────────────────────────────────────────────────────────────────── */

export default function AvatarPlayer({
  animationQueue,
  currentGloss,
  isPlaying = true,
  speed = 1,
  sign,
  onSequenceComplete,
  onIndexChange,
}: AvatarPlayerProps) {
  const queue = animationQueue ?? [];

  // Diagnostic: log props when they change
  const prevPropsRef = useRef('');
  const propsKey = `q=${queue.length} gloss="${currentGloss?.substring(0, 30) ?? ''}" play=${isPlaying} sign=${sign ? 'yes' : 'null'}`;
  if (propsKey !== prevPropsRef.current) {
    prevPropsRef.current = propsKey;
    console.log(`[AvatarPlayer] Props: ${propsKey}`);
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0.3, 1.7], fov: 40 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 4]} intensity={1.8} />
        <directionalLight position={[-3, 3, -2]} intensity={0.8} color="#9075f3" />
        <pointLight position={[0, 1.5, 1.5]} intensity={0.8} />

        <Suspense fallback={null}>
          <XbotAvatar
            animationQueue={queue}
            currentGloss={currentGloss ?? ""}
            isPlaying={isPlaying}
            speed={speed}
            sign={sign ?? null}
            onSequenceComplete={onSequenceComplete}
            onIndexChange={onIndexChange}
          />
        </Suspense>

        <OrbitControls
          enableZoom
          enablePan={false}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.6}
          target={[0, 0.15, 0]}
        />
      </Canvas>
    </div>
  );
}
