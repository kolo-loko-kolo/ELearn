export interface Word {
  id?: number;
  word: string;
  phonetic?: string;
  phoneticUs?: string;
  phoneticUk?: string;
  pos?: string; // Part of speech: noun, verb, adjective, etc.
  definition: string;
  translation?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  tags: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;

  // Spaced Repetition (SM-2) fields
  repetition: number;     // Number of consecutive successful reviews
  interval: number;       // Current review interval in days
  easeFactor: number;     // Ease factor (SM-2 EF, default 2.5, min 1.3)
  nextReviewDate: string; // Format: YYYY-MM-DD
  lastReviewedDate?: string; // Format: YYYY-MM-DD
  reviewCount: number;
  lapses: number;         // Number of times rated "Again"

  // 150-Day CET-4/6 Study Cycle fields
  orderIndex?: number;    // 0 to 2999
  dayIndex?: number;      // 0 to 149 (20 words per day across 150 days)
}

export type ReviewRating = 1 | 2 | 3;
// 1 = 困难 (Hard - into difficult words focus), 2 = 良好 (Good - refresh in >=10d), 3 = 容易 (Easy - refresh in >=100d)

export interface ReviewLog {
  id?: number;
  wordId: number;
  word: string;
  rating: ReviewRating;
  reviewDate: string;     // YYYY-MM-DD for grouping
  reviewedAt: number;     // Timestamp
  intervalBefore: number;
  intervalAfter: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  dailyReviewGoal: number;
  dailyNewWordGoal: number;
  accentPreference: 'en-US' | 'en-GB';
  speechRate: number;     // 0.8 to 1.2
  geminiApiKey?: string;
  theme?: ThemeMode;
  studyPlanStartDate?: number; // Timestamp of when the 150-day cycle began
}

export interface PracticeSentence {
  id: string;
  text: string;
  translation: string;
  category: 'Daily' | 'Business' | 'Tech' | 'Idioms' | 'Custom';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface PronunciationResult {
  transcript: string;
  score: number; // 0 - 100
  words: {
    original: string;
    matched: boolean;
    spoken?: string;
  }[];
}

// CET-4 & CET-6 Exam and Practice Types
export type CETLevel = 'CET4' | 'CET6';

export type CETSectionType = 'listening' | 'reading' | 'cloze' | 'translation';

export interface CETQuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  options?: string[]; // [A, B, C, D]
  correctAnswer: string; // e.g., "A", "B", "C", "D" or sample text
  explanation: string;
  targetSentence?: string; // Sentence in text where answer is located
}

export interface CETSection {
  id: string;
  type: CETSectionType;
  title: string;
  instruction: string;
  passage?: string; // Text for reading or translation source
  audioTranscript?: string; // Spoken script for listening questions
  speakerRole?: string; // e.g. "News Report", "Conversation", "Lecture"
  wordBank?: { letter: string; word: string; pos?: string }[]; // For cloze
  questions: CETQuestionItem[];
  keyTerms?: { en: string; zh: string }[]; // For translation or reading key terms
  sampleTranslation?: string; // For translation section
}

export interface CETPaper {
  id: string;
  level: CETLevel;
  title: string;
  yearSession: string; // e.g., "2024年6月真题精编卷"
  difficulty: '基础' | '标准' | '进阶';
  durationMinutes: number;
  totalScore: number; // Standard 710
  sections: CETSection[];
}

export interface CETExamRecord {
  id?: number;
  paperId: string;
  paperTitle: string;
  level: CETLevel;
  weekKey?: string; // Format: e.g. "2026-W44" for the weekly mock exam
  scaledScore: number; // 0 - 710
  sectionScores: {
    listening: number; // out of 248.5
    reading: number;   // out of 248.5
    translation: number; // out of 106.5 (or writing/trans total 213)
  };
  passed: boolean; // scaledScore >= 425
  timeSpentSeconds: number;
  answers: Record<string, string>; // questionId -> userAnswer
  completedAt: number;
}
