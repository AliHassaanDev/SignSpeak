/**
 * Pose Sequencer — JSON-driven keyframe animation engine for PSL avatar.
 *
 * Replaces per-gloss .glb loading with a single base model and quaternion
 * slerp interpolation between timestamped Euler-angle keyframes stored in
 * `/data/psl_glosses.json`.
 */

import * as THREE from "three";

/* ────────────────────────── Types ────────────────────────── */

/** A single keyframe: timestamp (seconds) + per-bone Euler rotation vectors [x, y, z] in radians. */
export interface Keyframe {
  time: number;
  bones: Record<string, [number, number, number]>;
}

/** Animation data for one gloss: total duration + ordered keyframes. */
export interface GlossData {
  duration: number;
  keyframes: Keyframe[];
}

/** The full gloss dictionary loaded from JSON. */
export type GlossDictionary = Record<string, GlossData>;

/* ────────────────────────── Bone Map ────────────────────────── */

/**
 * Maps short bone keys used in the JSON dictionary to full Mixamo
 * armature bone names on the Xbot model.
 */
export const BONE_MAP: Record<string, string> = {
  rArm: "mixamorigRightArm",
  rForeArm: "mixamorigRightForeArm",
  rHand: "mixamorigRightHand",
  lArm: "mixamorigLeftArm",
  lForeArm: "mixamorigLeftForeArm",
  lHand: "mixamorigLeftHand",
  head: "mixamorigHead",
  // Finger joints (1 = knuckle, 2 = middle, 3 = distal). On the Xbot
  // rig, finger curl is a POSITIVE local Z rotation: extended fingers sit
  // near Z = 0.1, naturally-relaxed joints at Z = 0.3-0.7 (values decoded
  // from the GLB's baked animations). Needed for distinct fingerspelling
  // handshapes instead of near-identical arm-only poses.
  rThumb1: "mixamorigRightHandThumb1",
  rThumb2: "mixamorigRightHandThumb2",
  rThumb3: "mixamorigRightHandThumb3",
  rIndex1: "mixamorigRightHandIndex1",
  rIndex2: "mixamorigRightHandIndex2",
  rIndex3: "mixamorigRightHandIndex3",
  rMiddle1: "mixamorigRightHandMiddle1",
  rMiddle2: "mixamorigRightHandMiddle2",
  rMiddle3: "mixamorigRightHandMiddle3",
  rRing1: "mixamorigRightHandRing1",
  rRing2: "mixamorigRightHandRing2",
  rRing3: "mixamorigRightHandRing3",
  rPinky1: "mixamorigRightHandPinky1",
  rPinky2: "mixamorigRightHandPinky2",
  rPinky3: "mixamorigRightHandPinky3",
  lThumb1: "mixamorigLeftHandThumb1",
  lThumb2: "mixamorigLeftHandThumb2",
  lThumb3: "mixamorigLeftHandThumb3",
  lIndex1: "mixamorigLeftHandIndex1",
  lIndex2: "mixamorigLeftHandIndex2",
  lIndex3: "mixamorigLeftHandIndex3",
  lMiddle1: "mixamorigLeftHandMiddle1",
  lMiddle2: "mixamorigLeftHandMiddle2",
  lMiddle3: "mixamorigLeftHandMiddle3",
  lRing1: "mixamorigLeftHandRing1",
  lRing2: "mixamorigLeftHandRing2",
  lRing3: "mixamorigLeftHandRing3",
  lPinky1: "mixamorigLeftHandPinky1",
  lPinky2: "mixamorigLeftHandPinky2",
  lPinky3: "mixamorigLeftHandPinky3",
};

/* ────────────────────────── Dictionary Loader ────────────────────────── */

let _cachedDictionary: GlossDictionary | null = null;
let _pendingFetch: Promise<GlossDictionary> | null = null;

/**
 * Fetch the gloss dictionary JSON once and cache it.
 * Subsequent calls return the cached result without re-fetching.
 */
export async function loadGlossDictionary(): Promise<GlossDictionary> {
  if (_cachedDictionary) return _cachedDictionary;
  if (_pendingFetch) return _pendingFetch;

  _pendingFetch = fetch("/data/psl_glosses.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load psl_glosses.json: ${res.status}`);
      }
      return res.json() as Promise<GlossDictionary>;
    })
    .then((data) => {
      _cachedDictionary = data;
      _pendingFetch = null;
      console.log(
        `[PoseSequencer] Loaded gloss dictionary: ${Object.keys(data).length} entries`,
      );
      return data;
    })
    .catch((err) => {
      _pendingFetch = null;
      console.error("[PoseSequencer] Failed to load gloss dictionary:", err);
      return {} as GlossDictionary;
    });

  return _pendingFetch;
}

/**
 * Returns the cached dictionary synchronously if already loaded,
 * or `null` if the fetch hasn't completed yet.
 */
export function getLoadedDictionary(): GlossDictionary | null {
  return _cachedDictionary;
}

// Start fetching immediately when this module is first imported.
// By the time the 3D model finishes loading (seconds), the tiny JSON
// dictionary (milliseconds) will already be cached.
if (typeof window !== "undefined") {
  loadGlossDictionary();
}

/* ────────────────────────── Interpolation Engine ────────────────────────── */

// Reusable quaternion temporaries to avoid per-frame allocations.
const _qA = new THREE.Quaternion();
const _qB = new THREE.Quaternion();
const _euler = new THREE.Euler();

/**
 * Apply slerp-interpolated bone rotations from a keyframe sequence.
 *
 * @param boneMap    Map of short-key → THREE.Bone (only bones present in the skeleton)
 * @param keyframes  Ordered array of timestamped keyframes
 * @param elapsed    Seconds since the current gloss animation started
 */
export function applyPoseInterpolation(
  boneMap: Map<string, THREE.Bone>,
  keyframes: Keyframe[],
  elapsed: number,
): void {
  if (keyframes.length === 0) return;

  // Clamp elapsed to the last keyframe if we've gone past the end
  const lastKf = keyframes[keyframes.length - 1];
  const clampedTime = Math.min(elapsed, lastKf.time);

  // Find the two keyframes bracketing the current time
  let kfA: Keyframe = keyframes[0];
  let kfB: Keyframe = keyframes[0];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (clampedTime >= keyframes[i].time && clampedTime <= keyframes[i + 1].time) {
      kfA = keyframes[i];
      kfB = keyframes[i + 1];
      break;
    }
  }

  // If we're before the first keyframe, snap to it
  if (clampedTime <= keyframes[0].time) {
    kfA = keyframes[0];
    kfB = keyframes[0];
  }

  // Compute interpolation alpha [0..1]
  const segmentDuration = kfB.time - kfA.time;
  const alpha = segmentDuration > 0.0001 ? (clampedTime - kfA.time) / segmentDuration : 1.0;

  // Collect all bone keys present in either keyframe
  const allBoneKeys = new Set<string>();
  for (const key of Object.keys(kfA.bones)) allBoneKeys.add(key);
  for (const key of Object.keys(kfB.bones)) allBoneKeys.add(key);

  // Slerp each bone's rotation
  for (const shortKey of allBoneKeys) {
    const bone = boneMap.get(shortKey);
    if (!bone) continue;

    const rotA = kfA.bones[shortKey];
    const rotB = kfB.bones[shortKey];

    // Default to [0, 0, 0] if a bone key is missing from one frame
    const ax = rotA ? rotA[0] : 0;
    const ay = rotA ? rotA[1] : 0;
    const az = rotA ? rotA[2] : 0;
    const bx = rotB ? rotB[0] : 0;
    const by = rotB ? rotB[1] : 0;
    const bz = rotB ? rotB[2] : 0;

    _qA.setFromEuler(_euler.set(ax, ay, az));
    _qB.setFromEuler(_euler.set(bx, by, bz));
    _qA.slerp(_qB, alpha);

    bone.quaternion.copy(_qA);
    bone.matrixAutoUpdate = true;
    bone.updateMatrix();
  }
}

/**
 * Apply a rest/idle pose to all bones — arms hanging naturally with a
 * subtle head bob.  Used as fallback when a gloss is not in the dictionary.
 */
export function applyIdlePose(
  boneMap: Map<string, THREE.Bone>,
  elapsed: number,
  lerpSpeed: number,
): void {
  const idleTargets: Record<string, [number, number, number]> = {
    rArm: [0, 0, 1.4],
    rForeArm: [0, 0, 0],
    rHand: [0, 0, 0],
    lArm: [0, 0, -1.4],
    lForeArm: [0, 0, 0],
    lHand: [0, 0, 0],
    head: [Math.sin(elapsed * 1.5) * 0.04, 0, 0],
  };

  for (const [shortKey, target] of Object.entries(idleTargets)) {
    const bone = boneMap.get(shortKey);
    if (!bone) continue;

    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, target[0], lerpSpeed);
    bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, target[1], lerpSpeed);
    bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, target[2], lerpSpeed);
    bone.matrixAutoUpdate = true;
    bone.updateMatrix();
  }
}

/**
 * Normalize a gloss token for dictionary lookup.
 * Strips structural prefixes, uppercases, and removes non-alphanumeric characters.
 */
export function normalizeToken(raw: string): string {
  let k = raw.toUpperCase().trim();
  k = k.replace(/^WORD_SIGN_/, "").replace(/_SIGN$/, "");
  // The local model's fingerspelling fallback emits SPELL_X tokens while the
  // keyframe dictionary and backend use the LETTER_X convention — unify them
  // so both paths resolve to LETTER_A..LETTER_Z keyframes.
  k = k.replace(/^SPELL_/, "LETTER_");
  return k.replace(/[^A-Z0-9_]/g, "");
}
