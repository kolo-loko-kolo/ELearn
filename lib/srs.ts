import { ReviewRating, Word } from '@/types';

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds days to a YYYY-MM-DD date string and returns the new YYYY-MM-DD string
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return getTodayDateString();
  const parts = dateStr.split('-').map(Number);
  const targetDate = new Date(parts[0], parts[1] - 1, parts[2] || 1);
  targetDate.setDate(targetDate.getDate() + days);
  return getTodayDateString(targetDate);
}

/**
 * Checks if a word is due for review today or overdue
 */
export function isWordDue(nextReviewDate?: string, referenceDate: string = getTodayDateString()): boolean {
  if (!nextReviewDate) return false;
  return nextReviewDate <= referenceDate;
}

/**
 * Implements the 3-Tier Rating SRS Algorithm
 * Ratings:
 * 1 = 困难 (Hard): enters difficult words focus, reset interval to 1 day
 * 2 = 良好 (Good): regular recall, interval at least 10 days
 * 3 = 容易 (Easy): effortless recall, interval at least 100 days
 */
export function calculateNextReview(
  word?: Partial<Pick<Word, 'repetition' | 'interval' | 'easeFactor' | 'lapses' | 'reviewCount'>> | null,
  rating: ReviewRating = 2,
  today: string = getTodayDateString()
): {
  repetition: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  lapses: number;
  reviewCount: number;
} {
  let repetition = word?.repetition ?? 0;
  let interval = word?.interval ?? 0;
  let easeFactor = word?.easeFactor ?? 2.5;
  let lapses = word?.lapses ?? 0;
  const reviewCount = (word?.reviewCount ?? 0) + 1;

  if (rating === 1) {
    // 困难: 归入重点攻坚，重置并增加失误次数
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    lapses += 1;
  } else if (rating === 2) {
    // 良好: 至少 10 天后再次刷新复习
    repetition += 1;
    interval = Math.max(10, Math.round(interval * 1.5 || 10));
    easeFactor = Math.max(2.4, easeFactor);
    lapses = 0; // 从困难状态恢复
  } else if (rating === 3) {
    // 容易: 至少 100 天后才会再次刷新
    repetition += 1;
    interval = Math.max(100, Math.round(interval * 2.0 || 100));
    easeFactor = Math.min(3.5, easeFactor + 0.2);
    lapses = 0;
  }

  const nextReviewDate = addDaysToDate(today, interval);

  return {
    repetition,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate,
    lapses,
    reviewCount,
  };
}

/**
 * Returns human-readable upcoming interval label for rating buttons
 */
export function getIntervalPreview(
  word?: Partial<Pick<Word, 'repetition' | 'interval' | 'easeFactor' | 'lapses' | 'reviewCount'>> | null,
  rating: ReviewRating = 2
): string {
  if (rating === 1) return '进入重点攻坚';
  if (rating === 2) {
    const res = calculateNextReview(word, 2);
    return `至少${res.interval}天`;
  }
  const res = calculateNextReview(word, 3);
  return `至少${res.interval}天`;
}

// Simple deterministic hash for stable daily random shuffle
function hashWordForDate(word: string, dateStr: string): number {
  const combined = `${word}_${dateStr}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Assembles today's flashcard review queue:
 * 1. Strictly 20 words per day (daily refresh limit).
 * 2. Candidate pool:
 *    - Base 3,000 CET vocabulary words.
 *    - Custom words in vocabulary for at least 10 days (joined >= 10 days ago).
 * 3. Priority:
 *    - Mature due review words for today (nextReviewDate === todayStr).
 *    - Randomly refreshed new/unreviewed words from candidate pool (using stable date-based shuffle).
 * 4. Words not reviewed on previous days do NOT roll over (nextReviewDate < todayStr excluded).
 */
export function getSessionQueue(
  allWords: Word[],
  todayStr: string = getTodayDateString()
): Word[] {
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Candidate pool: base CET words OR custom words added at least 10 days ago
  const eligibleWords = allWords.filter((w) => {
    const isBaseCetWord = typeof w.dayIndex === 'number' && w.dayIndex >= 0 && w.dayIndex < 150;
    const isCustomJoined10Days = (now - (w.createdAt || 0)) >= TEN_DAYS_MS;
    return isBaseCetWord || isCustomJoined10Days;
  });

  // Exclude words that were already reviewed today
  const unreviewedToday = eligibleWords.filter((w) => w.lastReviewedDate !== todayStr);

  // 1. Due reviews: strictly scheduled for today (nextReviewDate === todayStr) and interval >= 10
  const dueReviews = unreviewedToday.filter(
    (w) =>
      Boolean(w.reviewCount && w.reviewCount > 0) &&
      w.nextReviewDate === todayStr
  );

  // 2. Fresh / unreviewed words: reviewCount === 0 or not yet reviewed
  const freshWords = unreviewedToday.filter(
    (w) => !w.reviewCount || w.reviewCount === 0
  );

  // Sort fresh words using a stable daily hash so order changes daily but is constant today
  const shuffledFresh = [...freshWords].sort((a, b) => {
    return hashWordForDate(a.word, todayStr) - hashWordForDate(b.word, todayStr);
  });

  // Ensure absolute uniqueness
  const seen = new Set<string | number>();
  const combined: Word[] = [];

  // Add due reviews first
  for (const w of dueReviews) {
    const key = w.id ?? w.word;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(w);
    }
    if (combined.length >= 20) break;
  }

  // Fill remaining slots with fresh candidate words up to 20 words
  for (const w of shuffledFresh) {
    if (combined.length >= 20) break;
    const key = w.id ?? w.word;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(w);
    }
  }

  return combined;
}
