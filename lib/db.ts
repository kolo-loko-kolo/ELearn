import Dexie, { Table } from 'dexie';
import { Word, ReviewLog, UserSettings, CETExamRecord } from '@/types';
import { getTodayDateString, addDaysToDate } from './srs';
import { CET_3000_WORDS } from './cetVocab3000';
import { CET_50_ARTICLES } from './cetArticles50';

// ─── Varied Example Sentence Generator ────────────────────────────────────────
interface TemplatePair {
  en: (w: string) => string;
  zh: (w: string, m: string) => string;
}

function extractShortMeaning(translation?: string, word?: string): string {
  if (!translation) return word || '';
  const cleaned = translation.replace(/^(?:[a-z]{1,5}\.\s*)+/i, '').trim();
  const first = cleaned.split(/[；;,，\/\s]/)[0]?.trim();
  return first || word || '';
}

const NOUN_TEMPLATES: TemplatePair[] = [
  {
    en: (w) => `The ${w} has played a pivotal role in modern academic research.`,
    zh: (w, m) => `${m}（${w}）在现代学术研究中扮演了至关重要的角色。`,
  },
  {
    en: (w) => `Recent studies have revealed new insights into the nature of ${w}.`,
    zh: (w, m) => `最新研究揭示了关于${m}（${w}）本质的全新见解。`,
  },
  {
    en: (w) => `A solid understanding of ${w} is indispensable for passing the CET exam.`,
    zh: (w, m) => `深入掌握${m}（${w}）对于顺利通过四六级考试必不可少。`,
  },
  {
    en: (w) => `Experts are currently assessing the overall impact of ${w} on society.`,
    zh: (w, m) => `专家们目前正在评估${m}（${w}）对社会的整体影响。`,
  },
  {
    en: (w) => `Without sufficient ${w}, it would be impossible to finalize this project.`,
    zh: (w, m) => `缺乏足够的${m}（${w}），该项目将很难顺利收尾。`,
  },
  {
    en: (w) => `She demonstrated exceptional competence in managing ${w} effectively.`,
    zh: (w, m) => `她在高效处理${m}（${w}）方面展现出了非凡的能力。`,
  },
  {
    en: (w) => `The significance of ${w} became apparent during the team's discussion.`,
    zh: (w, m) => `在团队讨论过程中，${m}（${w}）的重要性愈发显现出来。`,
  },
  {
    en: (w) => `Scholars around the globe have actively debated this ${w} for decades.`,
    zh: (w, m) => `数十年来，全球学者一直就这一${m}（${w}）展开热烈讨论。`,
  },
  {
    en: (w) => `The rapid development of ${w} has created countless opportunities for youth.`,
    zh: (w, m) => `${m}（${w}）的迅猛发展为年轻人创造了数不胜数的机遇。`,
  },
  {
    en: (w) => `Mastering the fundamentals of ${w} will give you a competitive edge.`,
    zh: (w, m) => `牢固掌握${m}（${w}）的基础知识将让你在竞争中脱颖而出。`,
  },
];

const VERB_TEMPLATES: TemplatePair[] = [
  {
    en: (w) => `Researchers continue to ${w} innovative solutions to environmental challenges.`,
    zh: (w, m) => `研究人员正不断尝试${m}（${w}）创新方案以应对环境挑战。`,
  },
  {
    en: (w) => `Students are strongly encouraged to ${w} new vocabulary in daily conversations.`,
    zh: (w, m) => `强烈鼓励学生在日常口语对话中积极${m}（${w}）新学到的词汇。`,
  },
  {
    en: (w) => `The government decided to ${w} existing regulations to stimulate economic growth.`,
    zh: (w, m) => `政府决定对现有规章制度进行${m}（${w}），以刺激经济繁荣。`,
  },
  {
    en: (w) => `She worked diligently to ${w} all the critical data before the presentation.`,
    zh: (w, m) => `她在汇报前勤奋整理并${m}（${w}）了所有关键数据。`,
  },
  {
    en: (w) => `It is necessary to ${w} both the long-term benefits and the potential risks.`,
    zh: (w, m) => `全面${m}（${w}）长远益处与潜在风险是非常必要的。`,
  },
  {
    en: (w) => `The international committee gathered to ${w} the latest research findings.`,
    zh: (w, m) => `国际委员会汇聚一堂，共同${m}（${w}）最新的科研成果。`,
  },
  {
    en: (w) => `We must learn how to ${w} unexpected problems with calm and confidence.`,
    zh: (w, m) => `我们必须学会沉着自信地${m}（${w}）各种突发意外。`,
  },
  {
    en: (w) => `His remarkable ability to ${w} complex theories impressed his mentors.`,
    zh: (w, m) => `他${m}（${w}）复杂理论的卓越能力给导师们留下了深刻印象。`,
  },
  {
    en: (w) => `They agreed to ${w} their collaborative efforts on renewable energy.`,
    zh: (w, m) => `他们一致同意在可再生能源领域进一步${m}（${w}）彼此的合作。`,
  },
  {
    en: (w) => `You can easily ${w} your learning efficiency with consistent daily practice.`,
    zh: (w, m) => `通过持之以恒的日常积累，你可以轻松${m}（${w}）学习效率。`,
  },
];

const ADJ_TEMPLATES: TemplatePair[] = [
  {
    en: (w) => `The committee presented a ${w} proposal that won unanimous approval.`,
    zh: (w, m) => `委员会提交了一份${m}（${w}）的提案，获得了全票通过。`,
  },
  {
    en: (w) => `Maintaining a ${w} attitude is essential when facing academic pressure.`,
    zh: (w, m) => `面对学业压力时，保持一种${m}（${w}）的心态至关重要。`,
  },
  {
    en: (w) => `The experiment yielded ${w} results that exceeded all initial projections.`,
    zh: (w, m) => `实验得出了${m}（${w}）的结果，远远超出了最初的预期。`,
  },
  {
    en: (w) => `It is ${w} to examine multiple perspectives before reaching a conclusion.`,
    zh: (w, m) => `在得出结论之前，从多个角度进行${m}（${w}）的考量尤为关键。`,
  },
  {
    en: (w) => `Her ${w} performance in the competition earned her national recognition.`,
    zh: (w, m) => `她在比赛中${m}（${w}）的表现为她赢得了全国范围的赞誉。`,
  },
  {
    en: (w) => `Technological progress has created a more ${w} environment for online learning.`,
    zh: (w, m) => `科技进步为在线学习创造了更为${m}（${w}）的环境。`,
  },
  {
    en: (w) => `The speaker provided several ${w} examples to clarify the abstract concept.`,
    zh: (w, m) => `演讲者举出了几个${m}（${w}）的例证，以阐明这一抽象概念。`,
  },
  {
    en: (w) => `A ${w} approach allows researchers to discover underlying patterns effectively.`,
    zh: (w, m) => `一种${m}（${w}）的方法使研究者能够高效发掘隐藏的规律。`,
  },
  {
    en: (w) => `The institution is known for fostering a ${w} culture of academic freedom.`,
    zh: (w, m) => `该机构以孕育${m}（${w}）的学术自由氛围而著称。`,
  },
  {
    en: (w) => `Finding a ${w} balance between work and study is vital for university students.`,
    zh: (w, m) => `在工作与学业之间找到${m}（${w}）的平衡对大学生十分重要。`,
  },
];

const ADV_TEMPLATES: TemplatePair[] = [
  {
    en: (w) => `She explained the core mechanism ${w}, making it accessible to beginners.`,
    zh: (w, m) => `她${m}（${w}）地解释了核心机制，让初学者也能轻松领会。`,
  },
  {
    en: (w) => `The data was ${w} verified by independent third-party laboratories.`,
    zh: (w, m) => `该数据已经由独立的第三方实验室进行了${m}（${w}）的复核。`,
  },
  {
    en: (w) => `The engineering team ${w} resolved the technical issue within an hour.`,
    zh: (w, m) => `工程团队在一小时内${m}（${w}）地解决了该技术故障。`,
  },
  {
    en: (w) => `He ${w} acknowledged the valuable contributions of all his teammates.`,
    zh: (w, m) => `他${m}（${w}）地向所有队友所付出的宝贵努力表示认可与感谢。`,
  },
  {
    en: (w) => `The system operates ${w} even under extreme network load conditions.`,
    zh: (w, m) => `即便在极端网络高负荷状态下，该系统依然运转得十分${m}（${w}）。`,
  },
  {
    en: (w) => `The policy was ${w} formulated to safeguard the public interest.`,
    zh: (w, m) => `该政策经过${m}（${w}）制定，旨在切实维护公众利益。`,
  },
  {
    en: (w) => `Students who prepare ${w} generally achieve higher scores on standardized tests.`,
    zh: (w, m) => `准备得更为${m}（${w}）的学生通常在标准化考试中取得更高成绩。`,
  },
  {
    en: (w) => `She ${w} adapted to the demanding academic expectations of the university.`,
    zh: (w, m) => `她${m}（${w}）地适应了大学严格的学术要求与节奏。`,
  },
];

const GENERIC_TEMPLATES: TemplatePair[] = [
  {
    en: (w) => `The term "${w}" is frequently tested in CET-4 and CET-6 reading comprehension.`,
    zh: (w, m) => `“${w}”（${m}）是大学英语四六级阅读理解中频繁考察的高频核心词。`,
  },
  {
    en: (w) => `Mastering the contextual usage of "${w}" helps improve both reading and writing skills.`,
    zh: (w, m) => `掌握“${w}”（${m}）的语境用法能全面提升英语读写表达能力。`,
  },
  {
    en: (w) => `In academic literature, "${w}" often carries nuanced connotations worth noting.`,
    zh: (w, m) => `在学术文献中，“${w}”（${m}）常包含值得仔细揣摩的深层语境含义。`,
  },
  {
    en: (w) => `Fluent speakers often use "${w}" to express ideas with greater clarity and precision.`,
    zh: (w, m) => `熟练的英语使用者常借用“${w}”（${m}）更精准清晰地传达观点。`,
  },
  {
    en: (w) => `Understanding how "${w}" functions in authentic sentences is key to active vocabulary mastery.`,
    zh: (w, m) => `理解“${w}”（${m}）在真实句型中的搭配运用，是实现积极词汇掌握的关键。`,
  },
];

export function generateExampleSentence(
  word: string,
  pos?: string,
  translation?: string,
  orderIndex: number = 0
): { sentence: string; translation: string } {
  const w = word.toLowerCase();
  const posLower = (pos || '').toLowerCase();
  const shortMeaning = extractShortMeaning(translation, word);
  let templates: TemplatePair[];

  if (posLower.includes('noun') || posLower === 'n') {
    templates = NOUN_TEMPLATES;
  } else if (posLower.includes('verb') || posLower === 'v') {
    templates = VERB_TEMPLATES;
  } else if (posLower.includes('adj') || posLower.includes('adjective')) {
    templates = ADJ_TEMPLATES;
  } else if (posLower.includes('adv') || posLower.includes('adverb')) {
    templates = ADV_TEMPLATES;
  } else {
    templates = GENERIC_TEMPLATES;
  }

  const idx = Math.abs(orderIndex) % templates.length;
  const pair = templates[idx];
  return {
    sentence: pair.en(w),
    translation: pair.zh(w, shortMeaning),
  };
}

export interface CustomArticle {
  id?: number;
  title: string;
  content: string;
  translation?: string;
  createdAt: number;
}

export interface SettingRecord {
  key: string;
  value: UserSettings | string | number | boolean;
}

export class ELearnDB extends Dexie {
  words!: Table<Word, number>;
  reviewLogs!: Table<ReviewLog, number>;
  settings!: Table<SettingRecord, string>;
  articles!: Table<CustomArticle, number>;
  examRecords!: Table<CETExamRecord, number>;

  constructor() {
    super('ELearnDB');
    this.version(1).stores({
      words: '++id, word, nextReviewDate, repetition, createdAt, *tags',
      reviewLogs: '++id, wordId, reviewDate, reviewedAt',
      settings: 'key',
      articles: '++id, createdAt',
    });
    this.version(2).stores({
      words: '++id, word, nextReviewDate, repetition, createdAt, *tags',
      reviewLogs: '++id, wordId, reviewDate, reviewedAt',
      settings: 'key',
      articles: '++id, createdAt',
      examRecords: '++id, paperId, level, scaledScore, passed, completedAt',
    });
  }
}

export const db = new ELearnDB();

export const DEFAULT_SETTINGS: UserSettings = {
  dailyReviewGoal: 20,
  dailyNewWordGoal: 20,
  accentPreference: 'en-US',
  speechRate: 1.0,
  theme: 'dark',
  studyPlanStartDate: Date.now(),
};

let initPromise: Promise<void> | null = null;

/**
 * Resets all application data to a clean, pristine state with only the 3,000 CET words & 50 articles.
 * Uses atomic transaction to guarantee no duplicates or race conditions.
 */
export async function resetApplicationData(): Promise<void> {
  const today = getTodayDateString();

  const formatted3000: Omit<Word, 'id'>[] = CET_3000_WORDS.map((item) => {
    const eg = generateExampleSentence(item.word, item.pos, item.translation, item.orderIndex);
    return {
      word: item.word,
      phonetic: `/${item.word}/`,
      pos: item.pos,
      translation: item.translation,
      definition: item.definition,
      exampleSentence: eg.sentence,
      exampleTranslation: eg.translation,
      tags: item.tags,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      // Only Day 0 (first 20 words) starts with today's review date; subsequent days are blank until reached
      nextReviewDate: item.dayIndex === 0 ? today : '',
      reviewCount: 0,
      lapses: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      orderIndex: item.orderIndex,
      dayIndex: item.dayIndex,
    };
  });

  const formatted50: CustomArticle[] = CET_50_ARTICLES.map((art) => ({
    title: art.title,
    content: art.content,
    translation: art.translation || '',
    createdAt: Date.now() - 86400000 * (50 - art.id),
  }));

  const newSettings: UserSettings = {
    ...DEFAULT_SETTINGS,
    studyPlanStartDate: Date.now(),
  };

  // Perform clean atomic transaction
  await db.transaction('rw', [db.words, db.reviewLogs, db.examRecords, db.articles, db.settings], async () => {
    await db.words.clear();
    await db.reviewLogs.clear();
    await db.examRecords.clear();
    await db.articles.clear();
    await db.words.bulkAdd(formatted3000 as Word[]);
    await db.articles.bulkAdd(formatted50);
    await db.settings.put({ key: 'userSettings', value: newSettings });
    await db.settings.put({ key: 'db_version_reset_v8', value: '8.0' });
  });
}

/**
 * Automatically cleans up duplicate review logs for the same word on the same date
 */
export async function deduplicateReviewLogs(): Promise<void> {
  const allLogs = await db.reviewLogs.toArray();
  const seenKeys = new Set<string>();
  const duplicateIds: number[] = [];

  for (const log of allLogs) {
    const key = `${log.reviewDate}-${log.wordId || log.word}`;
    if (seenKeys.has(key)) {
      if (log.id) duplicateIds.push(log.id);
    } else {
      seenKeys.add(key);
    }
  }

  if (duplicateIds.length > 0) {
    await db.reviewLogs.bulkDelete(duplicateIds);
  }
}

/**
 * Initializes database and performs one-time migration/reset if needed (guarded against concurrent execution)
 */
export async function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Check migration version marker and word count
    const versionRecord = await db.settings.get('db_version_reset_v8');
    const wordCount = await db.words.count();

    if (!versionRecord || versionRecord.value !== '8.0') {
      if (wordCount === 3000) {
        // Upgrade existing 3,000 words in-place:
        // 1. Varied bilingual example sentences & translations
        // 2. Strict enforcement: "前一天没复习的单词不计入下一天"
        //    - Clear any overdue dates (nextReviewDate < today) so yesterday's unreviewed words do NOT carry over
        //    - For words reviewed once with interval < 3, normalize interval to 3 and push nextReviewDate out
        const todayStr = getTodayDateString();
        const existingWords = await db.words.toArray();
        const updates: Word[] = existingWords.map((w) => {
          const eg = generateExampleSentence(w.word, w.pos, w.translation, w.orderIndex ?? 0);
          let nextReviewDate = w.nextReviewDate;
          let interval = w.interval ?? 0;

          // If word was due on a previous day and never reviewed, clear it so it doesn't leak into today
          if (nextReviewDate && nextReviewDate < todayStr && (!w.reviewCount || w.reviewCount === 0)) {
            nextReviewDate = '';
          }

          // If newly learned word was scheduled with interval < 3, adjust to 3 days from its review date
          if (w.reviewCount === 1 && interval < 3) {
            interval = 3;
            nextReviewDate = addDaysToDate(w.lastReviewedDate || todayStr, 3);
          }

          return {
            ...w,
            interval,
            nextReviewDate,
            exampleSentence: eg.sentence,
            exampleTranslation: eg.translation,
          };
        });
        await db.words.bulkPut(updates);

        // Update articles to include the bilingual translations
        const existingArticles = await db.articles.toArray();
        if (existingArticles.length <= 50) {
          await db.articles.clear();
          const formatted50: CustomArticle[] = CET_50_ARTICLES.map((art) => ({
            title: art.title,
            content: art.content,
            translation: art.translation || '',
            createdAt: Date.now() - 86400000 * (50 - art.id),
          }));
          await db.articles.bulkAdd(formatted50);
        }

        await db.settings.put({ key: 'db_version_reset_v8', value: '8.0' });
      } else {
        await resetApplicationData();
        return;
      }
    }

    // Clean up duplicate review logs if any exist
    await deduplicateReviewLogs();

    // Ensure settings exist
    const existingSettings = await db.settings.get('userSettings');
    if (!existingSettings) {
      await db.settings.put({ key: 'userSettings', value: DEFAULT_SETTINGS });
    }
  })();

  return initPromise;
}
