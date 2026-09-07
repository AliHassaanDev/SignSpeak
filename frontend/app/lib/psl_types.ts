export interface PSLSign {
  id: string;
  urdu: string;
  gloss: string;
  english: string;
  category: "greeting" | "question" | "emergency" | "daily" | "alphabet" | "number";
  duration: number; // in milliseconds
  description: string;
  avatarPose: {
    leftArm: { shoulderAngle: number; elbowAngle: number; handShape: "open" | "fist" | "point" | "wave" | "peace" | "thumbsUp" | "chest" | "spread" };
    rightArm: { shoulderAngle: number; elbowAngle: number; handShape: "open" | "fist" | "point" | "wave" | "peace" | "thumbsUp" | "chest" | "spread" };
    headTilt: number;
    expression: "neutral" | "smile" | "question" | "alert";
    motionType: "wave" | "chestTouch" | "forwardPush" | "circle" | "pointForward" | "handsTogether" | "sideToSide" | "nod";
  };
}


export interface UrduToPSLInferenceResult {
  modelName: string;
  modelVersion: string;
  inputUrdu?: string;
  normalizedText?: string;
  tokens: PSLSign[];
  video_url?: string;
  glossSequence?: string[];
  totalDurationMs?: number;
  modelConfidence: number;
  signCount: number;
}

