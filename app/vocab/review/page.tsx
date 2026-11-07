'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Word, ReviewRating, UserSettings } from '@/types';
import { calculateNextReview, getIntervalPreview, getTodayDateString, getSessionQueue } from '@/lib/srs';
import { FlashCard } from '@/components/FlashCard';
import { Button } from '@/components/ui/Button';
import { TextToSpeech } from '@/lib/speech';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Layers, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  PenTool
} from 'lucide-react';
import { DictationQuiz } from '@/components/DictationQuiz';

export default function ReviewPage() {
  const today = getTodayDateString();

  const allWords = useLiveQuery(() => db.words.toArray());
  const settingsDoc = useLiveQuery(() => db.settings.get('userSettings'));
  const settings = settingsDoc?.value as UserSettings | undefined;
  const accent = settings?.accentPreference || 'en-US';

  // State
  // Stable snapshot of words for this review session
  const [sessionQueue, setSessionQueue] = useState<Word[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<{ word: string; rating: ReviewRating }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Dictation Mode State
  const [isDictating, setIsDictating] = useState(false);
  const [dictationWordList, setDictationWordList] = useState<Word[]>([]);

  // Initialize sessionQueue once when words are loaded (20 words refreshed daily)
  useEffect(() => {
    if (sessionQueue === null && allWords && allWords.length > 0) {
      const queueList = getSessionQueue(allWords, today);
      setSessionQueue(queueList);
    }
  }, [allWords, sessionQueue, today]);

  const queue = sessionQueue || [];
  const currentWord = queue[currentIndex];

  // Confetti effect on completion
  useEffect(() => {
    if (isCompleted) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [isCompleted]);

  // Navigate next / prev manually
  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= queue.length) {
      setIsCompleted(true);
    } else {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, queue.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Handle rating a card (rates memory & automatically advances to next card)
  const handleRate = useCallback(
    async (rating: ReviewRating) => {
      if (!currentWord || !currentWord.id) {
        if (currentIndex + 1 >= queue.length) {
          setIsCompleted(true);
        }
        return;
      }

      const previousInterval = currentWord.interval;
      const srsUpdate = calculateNextReview(currentWord, rating, today);

      // Update word in IndexedDB
      await db.words.update(currentWord.id, {
        ...srsUpdate,
        lastReviewedDate: today,
        updatedAt: Date.now(),
      });

      // Record review log (deduplicate: same word reviewed multiple times today only counts once)
      const existingLog = await db.reviewLogs
        .where('wordId')
        .equals(currentWord.id)
        .and((log) => log.reviewDate === today)
        .first();

      if (existingLog && existingLog.id) {
        await db.reviewLogs.update(existingLog.id, {
          rating,
          reviewedAt: Date.now(),
          intervalBefore: previousInterval,
          intervalAfter: srsUpdate.interval,
        });
      } else {
        await db.reviewLogs.add({
          wordId: currentWord.id,
          word: currentWord.word,
          rating,
          reviewDate: today,
          reviewedAt: Date.now(),
          intervalBefore: previousInterval,
          intervalAfter: srsUpdate.interval,
        });
      }

      setSessionRatings((prev) => [...prev, { word: currentWord.word, rating }]);

      // Automatically advance to the next word in the stable session queue
      if (currentIndex + 1 >= queue.length) {
        setIsCompleted(true);
      } else {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentWord, today, currentIndex, queue.length]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate(1); // 困难
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(2); // 良好
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate(3); // 容易
        }
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }

      if (e.key === 'r' || e.key === 'R') {
        if (currentWord) {
          TextToSpeech.speak(currentWord.word, { lang: accent });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleRate, currentWord, accent, handleNext, handlePrev]);

  // Dictation Mode
  if (isDictating && dictationWordList.length > 0) {
    return (
      <DictationQuiz
        words={dictationWordList}
        accent={accent}
        onExit={() => setIsDictating(false)}
      />
    );
  }

  // Loading state
  if (sessionQueue === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-400">正在准备复习闪卡...</p>
        </div>
      </div>
    );
  }

  const wordList = allWords || [];

  // If no words are due
  if (queue.length === 0 && !isCompleted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
            今日无待复习闪卡
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            今天所有计划内的闪卡都已顺利完成复习，知识点记忆稳固！
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setSessionQueue([...wordList].sort((a, b) => (a.interval || 0) - (b.interval || 0)));
              setCurrentIndex(0);
              setIsFlipped(false);
              setSessionRatings([]);
              setIsCompleted(false);
            }}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            <span>提前练习全库词汇 ({wordList.length} 词)</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setDictationWordList([...wordList]);
              setIsDictating(true);
            }}
            className="gap-1.5"
          >
            <PenTool className="w-4 h-4" />
            <span>开始全库默写测验</span>
          </Button>
        </div>
      </div>
    );
  }

  // Completion Screen (or if currentIndex exceeds queue)
  if (isCompleted || !currentWord) {
    const hardCount = sessionRatings.filter((r) => r.rating === 1).length;
    const goodEasyCount = sessionRatings.filter((r) => r.rating >= 2).length;
    const hardWords = queue.filter((w) => sessionRatings.some((r) => r.word === w.word && r.rating === 1));

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-7 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
            本轮复习圆满完成！
          </h2>
          <p className="text-sm text-zinc-500">
            本次共复习了 {sessionRatings.length} 张词汇闪卡，坚持就是语感的基石！
          </p>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 text-center">
            <span className="text-xs text-zinc-500 font-medium">稳固掌握 (良好/容易)</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {goodEasyCount}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 text-center">
            <span className="text-xs text-zinc-500 font-medium">需重点攻坚 (困难)</span>
            <div className="text-2xl font-bold font-mono text-rose-500 mt-1">
              {hardCount}
            </div>
          </div>
        </div>

        {/* Dictation Mode Banner / Card */}
        <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/30 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-purple-950/20 text-left space-y-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  趁热打铁 · 单词默写测验
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  反向拼写强化
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                根据中文释义在键盘上盲打拼出英文，打通“中文认知”到“英文拼写”的主动输出通路！
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Button
              variant="primary"
              className="flex-1 gap-2 shadow-sm"
              onClick={() => {
                setDictationWordList(queue);
                setIsDictating(true);
              }}
            >
              <PenTool className="w-4 h-4" />
              <span>开始本轮单词默写 ({queue.length} 词)</span>
            </Button>

            {hardWords.length > 0 && (
              <Button
                variant="outline"
                className="gap-2 border-rose-200 hover:bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:text-rose-300"
                onClick={() => {
                  setDictationWordList(hardWords);
                  setIsDictating(true);
                }}
              >
                <span>仅默写困难词 ({hardWords.length} 词)</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setSessionQueue([...wordList].sort((a, b) => (a.interval || 0) - (b.interval || 0)));
              setCurrentIndex(0);
              setIsFlipped(false);
              setSessionRatings([]);
              setIsCompleted(false);
            }}
          >
            再练一轮闪卡
          </Button>
          <Link href="/">
            <Button variant="secondary">返回首页看板</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / queue.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>退出复习</span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Layers className="w-3.5 h-3.5" />
            <span>今日卡片复习 · 精选 20 词</span>
          </span>
        </div>

        {/* Step Navigation & Counter */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDictationWordList(queue);
              setIsDictating(true);
            }}
            className="h-7 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 gap-1 px-2 font-medium"
            title="随时切换至本轮单词默写模式"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">单词默写</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
            title="上一个单词 (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
            {currentIndex + 1} / {queue.length}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
            title="下一个单词 (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* FlashCard */}
      <div className="flex justify-center pt-2">
        <FlashCard
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped((prev) => !prev)}
          accent={accent}
        />
      </div>

      {/* Action Controls */}
      <div className="pt-2">
        {!isFlipped ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-80 shadow-md gap-2"
              onClick={() => setIsFlipped(true)}
            >
              <span>显示答案</span>
              <kbd className="px-2 py-0.5 text-xs bg-indigo-700/80 rounded font-mono">
                空格 Space
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 gap-1"
            >
              <span>直接跳过</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                👉 点击下方评分（或按键盘 1 / 2 / 3），将自动进入下一个单词：
              </p>
              <p className="text-[11px] text-zinc-400">
                困难进入重点攻坚；良好至少10天后刷新；容易至少100天后刷新
              </p>
            </div>

            {/* 3 Tier Rating Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {/* Hard (1) */}
              <button
                type="button"
                onClick={() => handleRate(1)}
                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-300 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm sm:text-base">困难</span>
                  <kbd className="text-[10px] px-1 bg-rose-200/60 dark:bg-rose-900/60 rounded font-mono">
                    1
                  </kbd>
                </div>
                <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">
                  {getIntervalPreview(currentWord, 1)}
                </span>
              </button>

              {/* Good (2) */}
              <button
                type="button"
                onClick={() => handleRate(2)}
                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:text-blue-300 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm sm:text-base">良好</span>
                  <kbd className="text-[10px] px-1 bg-blue-200/60 dark:bg-blue-900/60 rounded font-mono">
                    2
                  </kbd>
                </div>
                <span className="text-[11px] text-blue-500 dark:text-blue-400 mt-1">
                  {getIntervalPreview(currentWord, 2)}
                </span>
              </button>

              {/* Easy (3) */}
              <button
                type="button"
                onClick={() => handleRate(3)}
                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:text-emerald-300 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm sm:text-base">容易</span>
                  <kbd className="text-[10px] px-1 bg-emerald-200/60 dark:bg-emerald-900/60 rounded font-mono">
                    3
                  </kbd>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  {getIntervalPreview(currentWord, 3)}
                </span>
              </button>
            </div>

            {/* Bottom auxiliary controls */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="text-zinc-500 gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>上一个单词</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="text-zinc-500 gap-1"
              >
                <span>直接跳过 / 下一个</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
