import { StudentMemory, LearnedSign, QuizStats, TutorLevel, ChatMessage } from "../../types/tutor";

const MEMORY_STORAGE_KEY = "signspeak_tutor_memory_v1";
const CHAT_STORAGE_PREFIX = "signspeak_tutor_chat_lvl_";

export const DEFAULT_QUIZ_STATS: QuizStats = {
  totalQuestions: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
};

export const DEFAULT_STUDENT_MEMORY: StudentMemory = {
  learnedSigns: [],
  discussedTopics: [],
  quizStats: DEFAULT_QUIZ_STATS,
  completedTopics: [],
  summary: "",
};

/** Load persisted student memory from localStorage */
export function loadStudentMemory(): StudentMemory {
  if (typeof window === "undefined") return { ...DEFAULT_STUDENT_MEMORY };
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STUDENT_MEMORY };
    const parsed = JSON.parse(raw);
    return {
      learnedSigns: Array.isArray(parsed.learnedSigns) ? parsed.learnedSigns : [],
      discussedTopics: Array.isArray(parsed.discussedTopics) ? parsed.discussedTopics : [],
      quizStats: {
        totalQuestions: Number(parsed.quizStats?.totalQuestions) || 0,
        correctAnswers: Number(parsed.quizStats?.correctAnswers) || 0,
        currentStreak: Number(parsed.quizStats?.currentStreak) || 0,
        bestStreak: Number(parsed.quizStats?.bestStreak) || 0,
      },
      completedTopics: Array.isArray(parsed.completedTopics) ? parsed.completedTopics : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch (err) {
    console.warn("[TutorMemory] Failed to load memory:", err);
    return { ...DEFAULT_STUDENT_MEMORY };
  }
}

/** Save student memory to localStorage */
export function saveStudentMemory(memory: StudentMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch (err) {
    console.warn("[TutorMemory] Failed to save memory:", err);
  }
}

/** Records a newly taught or practiced sign into memory */
export function recordLearnedSigns(
  tokens: string[],
  level: TutorLevel,
  currentMemory: StudentMemory
): StudentMemory {
  const updated = { ...currentMemory };
  const existingGlosses = new Set(updated.learnedSigns.map((s) => s.gloss));
  let modified = false;

  for (const token of tokens) {
    const cleanToken = token.trim().toUpperCase();
    if (cleanToken && !existingGlosses.has(cleanToken)) {
      const label = cleanToken.replace(/^LETTER_/, "Letter ").replace(/_/g, " ");
      updated.learnedSigns.push({
        gloss: cleanToken,
        label,
        level,
        masteredAt: Date.now(),
      });
      existingGlosses.add(cleanToken);
      modified = true;
    }
  }

  if (modified) {
    saveStudentMemory(updated);
  }
  return updated;
}

/** Records a quiz result into memory and updates streaks */
export function recordQuizAttempt(
  isCorrect: boolean,
  currentMemory: StudentMemory
): StudentMemory {
  const updated = { ...currentMemory };
  const stats = { ...updated.quizStats };

  stats.totalQuestions += 1;
  if (isCorrect) {
    stats.correctAnswers += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
  } else {
    stats.currentStreak = 0;
  }

  updated.quizStats = stats;
  saveStudentMemory(updated);
  return updated;
}

/** Records a topic that was discussed in the lesson */
export function recordDiscussedTopic(
  topic: string,
  currentMemory: StudentMemory
): StudentMemory {
  const clean = topic.trim();
  if (!clean) return currentMemory;

  const updated = { ...currentMemory };
  if (!updated.discussedTopics.includes(clean)) {
    updated.discussedTopics.push(clean);
    saveStudentMemory(updated);
  }
  return updated;
}

/** Load level-specific chat messages from localStorage */
export function loadLevelChatMessages(level: TutorLevel): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${level}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[TutorMemory] Failed to load messages for level ${level}:`, err);
    return [];
  }
}

/** Save level-specific chat messages to localStorage */
export function saveLevelChatMessages(level: TutorLevel, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    // Keep last 30 messages to prevent storage bloat
    const trimmed = messages.slice(-30);
    localStorage.setItem(`${CHAT_STORAGE_PREFIX}${level}`, JSON.stringify(trimmed));
  } catch (err) {
    console.warn(`[TutorMemory] Failed to save messages for level ${level}:`, err);
  }
}

/** Complete reset of student memory and all level chats */
export function resetAllTutorMemory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MEMORY_STORAGE_KEY);
    for (let l = 1; l <= 4; l++) {
      localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${l}`);
    }
  } catch (err) {
    console.warn("[TutorMemory] Failed to reset memory:", err);
  }
}
