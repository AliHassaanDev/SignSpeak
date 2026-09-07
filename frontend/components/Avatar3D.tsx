"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame, useGraph } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PSLSign } from "../app/lib/psl-dictionary";

// Suppress THREE.Clock deprecation warning emitted by @react-three/fiber's
// internal renderer (the Canvas component).  R3F v9 uses THREE.Clock
// internally; this is fixed in later versions but harmless.
if (typeof window !== "undefined") {
  const _origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    _origWarn.apply(console, args);
  };
}

// Define pose types to match existing model
interface AvatarPose {
  leftArm: { shoulderAngle: number; elbowAngle: number; handShape: "open" | "closed" | "pointing" };
  rightArm: { shoulderAngle: number; elbowAngle: number; handShape: "open" | "closed" | "pointing" };
  headTilt: number;
  expression: "neutral" | "happy" | "focused";
  motionType: "nod" | "wave" | "chestTouch" | "forwardPush" | "handsTogether" | "sideToSide" | "none";
}

function Xbot({ pose, isPlaying, speed }: { pose: AvatarPose; isPlaying: boolean; speed: number }) {
  // Load the Xbot model
  const { scene } = useGLTF("/models/Xbot.glb");
  const { nodes } = useGraph(scene);
  const group = useRef<THREE.Group>(null);

  // Time tracker for sine wave animations
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;

    if (isPlaying) {
      timeRef.current += delta * speed * 5;
    } else {
      timeRef.current = 0; // reset
    }

    // Default rest pose (T-pose or A-pose offset)
    const dt = delta * speed * 8; // interpolation speed

    // Safely get bones if they exist in Xbot
    const rArm = nodes.mixamorigRightArm as THREE.Bone | undefined;
    const rForeArm = nodes.mixamorigRightForeArm as THREE.Bone | undefined;
    const lArm = nodes.mixamorigLeftArm as THREE.Bone | undefined;
    const lForeArm = nodes.mixamorigLeftForeArm as THREE.Bone | undefined;
    const head = nodes.mixamorigHead as THREE.Bone | undefined;
    const neck = nodes.mixamorigNeck as THREE.Bone | undefined;

    // Helper to lerp rotation
    const lerpRot = (bone: THREE.Bone | undefined, targetX: number, targetY: number, targetZ: number) => {
      if (bone) {
        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, targetX, dt);
        bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, targetY, dt);
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, targetZ, dt);
      }
    };

    if (isPlaying) {
      // Convert CSS-like angles (0 to 180) to radians for 3D
      // Left arm
      const lShoulderRad = THREE.MathUtils.degToRad(pose.leftArm.shoulderAngle);
      const lElbowRad = THREE.MathUtils.degToRad(pose.leftArm.elbowAngle);
      lerpRot(lArm, 0, 0, lShoulderRad + 1.2); // Add offset for A-pose to neutral
      lerpRot(lForeArm, -lElbowRad, 0, 0);

      // Right arm
      const rShoulderRad = THREE.MathUtils.degToRad(pose.rightArm.shoulderAngle);
      const rElbowRad = THREE.MathUtils.degToRad(pose.rightArm.elbowAngle);

      let targetRArmX = 0;
      let targetRArmY = 0;
      let targetRArmZ = -rShoulderRad - 1.2;
      let targetRForeArmX = -rElbowRad;

      // Handle motion types with procedural sine waves
      if (pose.motionType === "wave") {
        targetRArmZ = -2.5; // raise arm
        targetRArmX = Math.sin(timeRef.current) * 0.5; // wave motion
        targetRForeArmX = -0.5;
      } else if (pose.motionType === "chestTouch") {
        targetRArmX = -0.8;
        targetRArmZ = -1.0;
        targetRForeArmX = -2.0;
        targetRArmY = -1.0;
      } else if (pose.motionType === "forwardPush") {
        targetRArmX = -1.5;
        targetRArmZ = -1.5;
        targetRForeArmX = -0.5 + Math.sin(timeRef.current) * 0.4;
      } else if (pose.motionType === "sideToSide") {
        targetRArmZ = -1.5;
        targetRArmY = Math.sin(timeRef.current) * 0.8;
      }

      lerpRot(rArm, targetRArmX, targetRArmY, targetRArmZ);
      lerpRot(rForeArm, targetRForeArmX, 0, 0);

      // Head
      const headTiltRad = THREE.MathUtils.degToRad(pose.headTilt);
      lerpRot(head, 0, 0, headTiltRad);
      
      if (pose.motionType === "nod") {
        lerpRot(neck, Math.sin(timeRef.current) * 0.2, 0, 0);
      } else {
        lerpRot(neck, 0, 0, 0);
      }

    } else {
      // Return to resting idle pose
      lerpRot(rArm, 0, 0, -1.2);
      lerpRot(rForeArm, 0, 0, 0);
      lerpRot(lArm, 0, 0, 1.2);
      lerpRot(lForeArm, 0, 0, 0);
      lerpRot(head, 0, 0, 0);
      lerpRot(neck, 0, 0, 0);
    }
  });

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <group ref={group as any} dispose={null} position={[0, -0.95, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/Xbot.glb");

export default function Avatar3D({
  sign,
  isPlaying,
  speed,
}: {
  sign: PSLSign | null;
  isPlaying: boolean;
  speed: number;
}) {
  const pose = sign?.avatarPose || {
    leftArm: { shoulderAngle: 15, elbowAngle: 25, handShape: "open" },
    rightArm: { shoulderAngle: 15, elbowAngle: 25, handShape: "open" },
    headTilt: 0,
    expression: "neutral",
    motionType: "none",
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0.3, 1.7], fov: 40 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        gl={{
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          antialias: true,
        }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          const handleLost = (e: Event) => e.preventDefault();
          const handleRestored = () => {
            gl.setSize(canvas.clientWidth, canvas.clientHeight);
          };
          canvas.addEventListener("webglcontextlost", handleLost);
          canvas.addEventListener("webglcontextrestored", handleRestored);
        }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 4]} intensity={1.8} />
        <directionalLight position={[-3, 3, -2]} intensity={0.8} color="#9075f3" />
        <pointLight position={[0, 1.5, 1.5]} intensity={0.8} />

        <Suspense fallback={null}>
          <Xbot pose={pose as AvatarPose} isPlaying={isPlaying} speed={speed} />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.6}
          target={[0, 0.15, 0]}
        />
      </Canvas>
    </div>
  );
}
