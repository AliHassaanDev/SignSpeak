/**
 * Type definitions for the PSL Tutor / Learn module.
 */

/* ── Curriculum Levels ── */

export type TutorLevel = 1 | 2 | 3 | 4;

export interface CurriculumLevel {
  id: TutorLevel;
  title: string;
  subtitle: string;
  topics: string[];
}

export const CURRICULUM_LEVELS: CurriculumLevel[] = [
  {
    id: 1,
    title: "Essentials & Alphabets",
    subtitle: "Fingerspelling, greetings & hand shapes",
    topics: [
      "Fingerspelling (ا to ی)",
      "Basic greetings (Salam, Shukriya)",
      "Hand shapes (fist, open, point)",
    ],
  },
  {
    id: 2,
    title: "Survival PSL",
    subtitle: "Emergencies, food, water & questions",
    topics: [
      "Emergencies (Madad, Hospital, Doctor)",
      "Food & water (Khana, Pani)",
      "Basic questions (Kaise hain?)",
    ],
  },
  {
    id: 3,
    title: "Grammar & Structure",
    subtitle: "PSL word order & facial expressions",
    topics: [
      "PSL word order rules",
      "Facial expressions & non-manual markers",
      "Removing spoken filler words",
    ],
  },
  {
    id: 4,
    title: "Interactive Challenges",
    subtitle: "Quizzes, speed rounds & scenarios",
    topics: [
      "Reverse translation (PSL → Urdu)",
      "Speed quizzes",
      "Real-world scenario practice",
    ],
  },
];

/* ── Chat Messages ── */

export interface ChatMessage {
  id: string;
  role: "tutor" | "user";
  text: string;
  glossTokens?: string[];
  handDescription?: string;
  quizOptions?: string[];
  timestamp: number;
}

/* ── API Types ── */

export interface TutorChatRequest {
  message: string;
  level: TutorLevel;
  history: { role: "user" | "model"; parts: { text: string }[] }[];
}

export interface TutorChatResponse {
  tutor_reply: string;
  gloss_tokens: string[];
  hand_description: string;
  current_level: TutorLevel;
  quiz_options?: string[];
}
