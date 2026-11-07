'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Word, UserSettings } from '@/types';
import { getTodayDateString, getSessionQueue, addDaysToDate } from '@/lib/srs';
import { Heatmap } from '@/components/Heatmap';
import { AudioButton } from '@/components/AudioButton';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  Layers, 
  BookOpenText, 
  Mic, 
  Plus, 
  TrendingUp, 
  CalendarCheck,
  ArrowRight, 
  BookA, 
  GraduationCap,
  AlertCircle,
  Target,
  CheckCircle2,
  RotateCcw,
  X
} from 'lucide-react';

export default function Dashboard() {
  const today = getTodayDateString();

  // Reactive data queries
  const words = useLiveQuery(() => db.words.toArray());
  const reviewLogs = useLiveQuery(() => db.reviewLogs.toArray());
  const examRecords = useLiveQuery(() => db.examRecords.toArray());
  const settingsDoc = useLiveQuery(() => db.settings.get('userSettings'));
  const settings = useMemo(() => {
    return (settingsDoc?.value as UserSettings) || { dailyReviewGoal: 20, dailyNewWordGoal: 20 };
  }, [settingsDoc]);

  // Restudy word modal state
  const [restudyWord, setRestudyWord] = useState<Word | null>(null);

  // Computed metrics
  const stats = useMemo(() => {
    const wordList = words || [];
    const logList = reviewLogs || [];

    // Calculate today's exact queue (20 words per day: due reviews + freshly refreshed words)
    const todayQueue = getSessionQueue(wordList, today);
    const dueCount = todayQueue.length;

    // Unique words reviewed today (same word reviewed multiple times only counts once toward daily goal)
    const todayLogs = logList.filter((log) => log.reviewDate === today);
    const uniqueReviewedWordIds = new Set(todayLogs.map((log) => log.wordId || log.word));
    const reviewsToday = uniqueReviewedWordIds.size;

    // 已复习：复习过的单词数，同一单词只记录一次
    const reviewedWordIds = new Set<string | number>();
    wordList.forEach((w) => {
      if (w.reviewCount && w.reviewCount >= 1) {
        reviewedWordIds.add(w.id ?? w.word);
      }
    });
    logList.forEach((log) => {
      if (log.wordId || log.word) {
        reviewedWordIds.add(log.wordId || log.word);
      }
    });
    const reviewedCount = reviewedWordIds.size;

    // 多次复习：复习过三次及以上的单词
    const multiReviewedCount = wordList.filter(
      (w) => Boolean(w.reviewCount && w.reviewCount >= 3)
    ).length;

    // Check if user completed CET exam or practice today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const cetDoneToday = (examRecords || []).some((r) => r.completedAt >= todayStart.getTime());

    // Check if user added words from reader / custom today
    const customWordsAddedToday = wordList.some(
      (w) => w.createdAt >= todayStart.getTime() && typeof w.dayIndex !== 'number'
    );

    // Module percentages
    const vocabPct = Math.min(100, Math.round((reviewsToday / (settings.dailyReviewGoal || 20)) * 100));
    const cetPct = cetDoneToday ? 100 : 0;
    const readingPct = customWordsAddedToday ? 100 : 0;

    // Overall learning goal progress (weighted combination across modules)
    const overallLearningPct = Math.min(
      100,
      Math.round(vocabPct * 0.5 + cetPct * 0.3 + readingPct * 0.2)
    );

    // 累计学习天数：只记录学习进度>=50%的天数，不重置天数
    const logsByDate = new Map<string, Set<string | number>>();
    logList.forEach((log) => {
      if (!logsByDate.has(log.reviewDate)) {
        logsByDate.set(log.reviewDate, new Set());
      }
      logsByDate.get(log.reviewDate)!.add(log.wordId || log.word);
    });

    const qualifiedDates = new Set<string>();
    logsByDate.forEach((wordsSet, date) => {
      // 达到每日20词目标的50%（即至少10词）计为有效学习天
      if (wordsSet.size >= 10) {
        qualifiedDates.add(date);
      }
    });

    // 今日综合进度达到50%也将今日计入累计学习天数
    if (overallLearningPct >= 50) {
      qualifiedDates.add(today);
    }

    const accumulatedStudyDays = qualifiedDates.size;

    return {
      dueCount,
      totalCount: wordList.length,
      reviewedCount,
      multiReviewedCount,
      reviewsToday,
      accumulatedStudyDays,
      vocabPct,
      cetDoneToday,
      customWordsAddedToday,
      overallLearningPct,
    };
  }, [words, reviewLogs, examRecords, today, settings]);

  const difficultWords = useMemo(() => {
    const list = words || [];
    return list
      .filter((w) => (w.lapses && w.lapses > 0) || (w.easeFactor && w.easeFactor < 2.4))
      .sort((a, b) => (b.lapses || 0) - (a.lapses || 0) || (a.easeFactor || 2.5) - (b.easeFactor || 2.5))
      .slice(0, 8);
  }, [words]);

  // Complete Restudy of a difficult word (marks as 良好, interval = 10, automatically removed from difficult words)
  const handleFinishRestudy = async () => {
    if (!restudyWord || !restudyWord.id) return;

    // User requirement: "在困难词汇重点攻坚再次学习后标记为良好"
    // Reset lapses to 0, restore easeFactor, interval = 10, next review 10 days later
    await db.words.update(restudyWord.id, {
      lapses: 0,
      easeFactor: 2.5,
      interval: 10,
      repetition: Math.max(1, (restudyWord.repetition || 0) + 1),
      nextReviewDate: addDaysToDate(today, 10),
      lastReviewedDate: today,
      reviewCount: (restudyWord.reviewCount || 0) + 1,
      updatedAt: Date.now(),
    });

    // Record review log (deduplicate: same word reviewed multiple times today only counts once)
    const existingLog = await db.reviewLogs
      .where('wordId')
      .equals(restudyWord.id)
      .and((log) => log.reviewDate === today)
      .first();

    if (existingLog && existingLog.id) {
      await db.reviewLogs.update(existingLog.id, {
        rating: 2, // 良好
        reviewedAt: Date.now(),
        intervalAfter: 10,
      });
    } else {
      await db.reviewLogs.add({
        wordId: restudyWord.id,
        word: restudyWord.word,
        rating: 2, // 良好
        reviewDate: today,
        reviewedAt: Date.now(),
        intervalBefore: restudyWord.interval || 0,
        intervalAfter: 10,
      });
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setRestudyWord(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-in fade-in">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
              今日概览
            </h1>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50">
              <CalendarCheck className="w-3.5 h-3.5 text-amber-500" />
              累计学习 {stats.accumulatedStudyDays} 天
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            通过科学的间隔重复培养英语直觉，让记忆成为本能。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vocab?add=true">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>添加单词</span>
            </Button>
          </Link>
          <Link href="/vocab/review">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm font-semibold">
              <Layers className="w-4 h-4" />
              <span>开始复习 ({stats.dueCount})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Review CTA Card */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/20 p-6 sm:p-8 dark:border-indigo-950/50 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-zinc-900 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>今日闪卡任务 · 精选 20 词</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {stats.dueCount > 0
                ? `今天有 ${stats.dueCount} 个单词需要复习`
                : '太棒了！今天的复习任务已全部搞定 🎉'}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {stats.dueCount > 0
                ? '每日精选 20 词新知 + 智能遗忘节点复习，稳步实现四六级 3000 核心词突破。'
                : '今日闪卡进度超前！你可以前往“短文阅读”阅读地道英文，或进行“四六级专项精炼”。'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {stats.dueCount > 0 ? (
              <Link href="/vocab/review">
                <Button size="lg" className="w-full sm:w-auto shadow-md font-bold">
                  <span>开始闪卡复习 ({stats.dueCount})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link href="/cet">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                  <span>四六级专项精炼</span>
                  <GraduationCap className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Progress & Goals Grid: 今日复习目标 + 今日学习目标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Daily Review Goal (今日复习目标) */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  今日复习目标
                </h3>
                <p className="text-xs text-zinc-500">
                  已复习 {stats.reviewsToday} / 目标 {settings.dailyReviewGoal || 20} 张闪卡
                </p>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-zinc-700 dark:text-zinc-300">
              {stats.vocabPct}%
            </span>
          </div>

          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${stats.vocabPct}%`,
              }}
            />
          </div>
        </div>

        {/* Card 2: Combined Daily Learning Goal (今日学习目标) */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  今日学习目标
                </h3>
                <p className="text-xs text-zinc-500">
                  各模块综合进度统计（闪卡 + 四六级刷题 + 短文阅读）
                </p>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.overallLearningPct}%
            </span>
          </div>

          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${stats.overallLearningPct}%`,
              }}
            />
          </div>

          {/* Module Mini Status Breakdown */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              {stats.vocabPct >= 100 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : '•'}
              闪卡: {stats.reviewsToday}/20
            </span>
            <span className="flex items-center gap-1">
              {stats.cetDoneToday ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : '•'}
              四六级: {stats.cetDoneToday ? '已刷题' : '待精炼'}
            </span>
            <span className="flex items-center gap-1">
              {stats.customWordsAddedToday ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : '•'}
              短文阅读: {stats.customWordsAddedToday ? '已阅读' : '待探索'}
            </span>
          </div>
        </div>
      </div>

      {/* Vocabulary Stats 4-col */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500">词库总词数</span>
          <div className="text-2xl font-bold font-mono mt-1 text-zinc-900 dark:text-zinc-100">
            {stats.totalCount}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500">今日待复习</span>
          <div className="text-2xl font-bold font-mono mt-1 text-indigo-600 dark:text-indigo-400">
            {stats.dueCount}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">已复习</span>
            <span className="text-[10px] text-zinc-400 font-sans">同词计1次</span>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
            {stats.reviewedCount}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">多次复习</span>
            <span className="text-[10px] text-zinc-400 font-sans">3次及以上</span>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
            {stats.multiReviewedCount}
          </div>
        </div>
      </div>

      {/* Contribution Heatmap Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              学习一致性追踪
            </h3>
          </div>
          <span className="text-xs text-zinc-400">数据保存在本地浏览器 IndexedDB</span>
        </div>
        <Heatmap logs={reviewLogs || []} weeksCount={16} />
      </div>

      {/* Quick Action Feature Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/cet"
          className="group p-5 rounded-2xl border border-zinc-200/80 bg-white hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-indigo-700 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            四六级模考与专项
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            全真听力朗读、长篇深度阅读、汉译英核心得分比对与 710 分换算成绩单。
          </p>
        </Link>

        <Link
          href="/reader"
          className="group p-5 rounded-2xl border border-zinc-200/80 bg-white hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-indigo-700 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BookOpenText className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            短文阅读与生词挖掘
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            阅读地道英语短文，支持朗读听文章与全文释义对照，点击生词一键录入记忆闪卡。
          </p>
        </Link>

        <Link
          href="/practice"
          className="group p-5 rounded-2xl border border-zinc-200/80 bg-white hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-indigo-700 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            影子跟读与发音评测
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            听标准语音韵律，使用麦克风跟读，获得即时语音识别比对与逐词发音准确率反馈。
          </p>
        </Link>

        <Link
          href="/vocab"
          className="group p-5 rounded-2xl border border-zinc-200/80 bg-white hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-indigo-700 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BookA className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            生词词库管理
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            按主题标签筛选整理词汇，支持输入单词一键调用官方词典接口自动填充释义。
          </p>
        </Link>
      </div>

      {/* Difficult Words Section (困难词汇重点攻坚) */}
      <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              困难词汇重点攻坚
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-medium border border-rose-200/50">
              复习中标记“忘记/困难”的词汇
            </span>
          </div>
          {difficultWords.length > 0 && (
            <Link href="/vocab/review" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              进入闪卡复习
            </Link>
          )}
        </div>

        {difficultWords.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 space-y-1">
            <p>目前还没有标记为遗忘或困难的词汇，记忆状态良好！</p>
            <p className="text-[11px] text-zinc-500">在闪卡复习中评为“忘记”或“困难”的单词将自动收录至此集中突破。</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {difficultWords.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AudioButton text={item.word} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        translate="no"
                        className="notranslate font-bold text-base text-zinc-900 dark:text-zinc-100 font-serif"
                      >
                        {item.word}
                      </span>
                      <span
                        translate="no"
                        className="notranslate text-xs text-zinc-400 font-mono"
                      >
                        {item.phonetic}
                      </span>
                      {item.pos && (
                        <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {item.pos}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-1">
                      {item.translation || item.definition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-400">
                    难度 EF {item.easeFactor || 2.5}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRestudyWord(item)}
                    className="text-xs font-semibold gap-1.5 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>再次学习</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restudy Word Card Modal (再次学习卡片弹窗) */}
      {restudyWord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    重点攻坚 · 再次学习
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    完成强化学习后该单词将自动从困难词汇库中移出
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestudyWord(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Word Card Main Content */}
            <div className="space-y-4">
              <div className="text-center space-y-2 py-2">
                <div className="flex items-center justify-center gap-3">
                  <span
                    translate="no"
                    className="notranslate text-3xl sm:text-4xl font-extrabold font-serif text-zinc-900 dark:text-zinc-100 tracking-tight"
                  >
                    {restudyWord.word}
                  </span>
                  <AudioButton text={restudyWord.word} size="md" />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span
                    translate="no"
                    className="notranslate text-sm font-mono text-zinc-400"
                  >
                    {restudyWord.phonetic}
                  </span>
                  {restudyWord.pos && (
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                      {restudyWord.pos}
                    </span>
                  )}
                  {typeof restudyWord.dayIndex === 'number' && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      第{restudyWord.dayIndex + 1}天词汇
                    </span>
                  )}
                </div>
              </div>

              {/* Chinese Translation & Definition Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-center">
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  {restudyWord.translation}
                </div>
                {restudyWord.definition && (
                  <p
                    translate="no"
                    className="notranslate text-xs text-zinc-500 dark:text-zinc-400 font-serif"
                  >
                    {restudyWord.definition}
                  </p>
                )}
              </div>

              {/* Example Sentence Card */}
              {restudyWord.exampleSentence && (
                <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-zinc-800/20 border border-indigo-100/60 dark:border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    语境例句 (Context Example)
                  </span>
                  <p
                    translate="no"
                    className="notranslate text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed italic"
                  >
                    &ldquo;{restudyWord.exampleSentence}&rdquo;
                  </p>
                  {restudyWord.exampleTranslation && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
                      {restudyWord.exampleTranslation}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRestudyWord(null)}
                className="text-zinc-500"
              >
                稍后再学
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinishRestudy}
                className="gap-2 shadow-sm font-bold px-5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>完成学习 · 移出困难词汇</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
