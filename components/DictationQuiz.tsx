'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Word } from '@/types';
import { TextToSpeech } from '@/lib/speech';
import { AudioButton } from '@/components/AudioButton';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Volume2, 
  HelpCircle, 
  RotateCcw, 
  ArrowLeft, 
  Award
} from 'lucide-react';

interface DictationQuizProps {
  words: Word[];
  accent?: 'en-US' | 'en-GB';
  onExit: () => void;
  onFinish?: (correctCount: number, totalCount: number) => void;
}

interface QuestionResult {
  word: Word;
  userAnswer: string;
  isCorrect: boolean;
  usedHint: boolean;
}

export function DictationQuiz({
  words,
  accent = 'en-US',
  onExit,
  onFinish,
}: DictationQuizProps) {
  const [quizQueue, setQuizQueue] = useState<Word[]>(words);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [history, setHistory] = useState<QuestionResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

  const currentWord = quizQueue[currentIndex];

  // Focus input on each new question
  useEffect(() => {
    if (!isFinished && !isAnswered) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isAnswered, isFinished]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  // Trigger confetti on finish if good score
  useEffect(() => {
    if (isFinished) {
      const correctNum = history.filter((h) => h.isCorrect).length;
      const ratio = correctNum / (history.length || 1);
      if (ratio >= 0.7) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
      onFinish?.(correctNum, history.length);
    }
  }, [isFinished, history, onFinish]);

  // Generate Cloze context sentence
  const clozeSentence = React.useMemo(() => {
    if (!currentWord || !currentWord.exampleSentence) return null;
    const target = currentWord.word;
    const regex = new RegExp(`\\b${target}\\b`, 'gi');
    return currentWord.exampleSentence.replace(regex, '________');
  }, [currentWord]);

  // Next question
  const advanceToNext = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (currentIndex + 1 >= quizQueue.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setInputVal('');
      setShowHint(false);
      setIsAnswered(false);
    }
  }, [currentIndex, quizQueue.length]);

  // Handle Submit Answer
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered) {
      advanceToNext();
      return;
    }

    if (!currentWord) return;

    const cleanedAnswer = inputVal.trim().toLowerCase();
    const targetWord = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanedAnswer === targetWord;

    setIsAnswered(true);
    setLastCorrect(isCorrect);

    setHistory((prev) => [
      ...prev,
      {
        word: currentWord,
        userAnswer: cleanedAnswer,
        isCorrect,
        usedHint: showHint,
      },
    ]);

    // Play standard pronunciation
    TextToSpeech.speak(currentWord.word, { lang: accent });

    // If correct, auto advance in 1.4s
    if (isCorrect) {
      autoAdvanceTimer.current = setTimeout(() => {
        advanceToNext();
      }, 1400);
    }
  };

  // Give up / Skip
  const handleGiveUp = () => {
    if (isAnswered) {
      advanceToNext();
      return;
    }
    if (!currentWord) return;

    setIsAnswered(true);
    setLastCorrect(false);
    setHistory((prev) => [
      ...prev,
      {
        word: currentWord,
        userAnswer: inputVal.trim() || '（放弃）',
        isCorrect: false,
        usedHint: showHint,
      },
    ]);

    TextToSpeech.speak(currentWord.word, { lang: accent });
  };

  // Restart quiz with wrong words only
  const handleRetryMistakes = () => {
    const wrongWords = history.filter((h) => !h.isCorrect).map((h) => h.word);
    if (wrongWords.length === 0) return;
    setQuizQueue(wrongWords);
    setCurrentIndex(0);
    setInputVal('');
    setShowHint(false);
    setIsAnswered(false);
    setHistory([]);
    setIsFinished(false);
  };

  // Restart all words
  const handleRestartAll = () => {
    setQuizQueue(words);
    setCurrentIndex(0);
    setInputVal('');
    setShowHint(false);
    setIsAnswered(false);
    setHistory([]);
    setIsFinished(false);
  };

  // Finished Screen
  if (isFinished) {
    const correctCount = history.filter((h) => h.isCorrect).length;
    const totalCount = history.length;
    const accuracy = Math.round((correctCount / totalCount) * 100) || 0;
    const wrongItems = history.filter((h) => !h.isCorrect);

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
            默写测验圆满完成！
          </h2>
          <p className="text-xs text-zinc-500">
            根据中文精准反向拼写英文，有效将“被动认知词汇”转化为“主动输出词汇”。
          </p>
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <div>
            <span className="text-[11px] text-zinc-400">测验总词数</span>
            <div className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-200 mt-0.5">
              {totalCount}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400">默写正确</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {correctCount}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400">准确率</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
              {accuracy}%
            </div>
          </div>
        </div>

        {/* Wrong Words Breakdown */}
        {wrongItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>需重测错词清单 ({wrongItems.length} 词)</span>
              <span className="text-[11px] text-zinc-400">点击喇叭可跟读巩固</span>
            </h4>
            <div className="space-y-2">
              {wrongItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20 flex items-center justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        translate="no"
                        className="notranslate font-bold text-sm font-serif text-zinc-900 dark:text-zinc-100"
                      >
                        {item.word.word}
                      </span>
                      <span
                        translate="no"
                        className="notranslate font-mono text-[11px] text-zinc-400"
                      >
                        {item.word.phonetic || item.word.phoneticUs}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 truncate">
                      {item.word.translation || item.word.definition}
                    </p>
                    {item.userAnswer && item.userAnswer !== '（放弃）' && (
                      <p className="text-[11px] text-rose-500">
                        您的拼写: <span className="line-through">{item.userAnswer}</span>
                      </p>
                    )}
                  </div>
                  <AudioButton text={item.word.word} lang={accent} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          {wrongItems.length > 0 && (
            <Button
              variant="primary"
              onClick={handleRetryMistakes}
              className="w-full sm:w-auto gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>专项重测错词 ({wrongItems.length})</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRestartAll}
            className="w-full sm:w-auto"
          >
            全部重默一遍
          </Button>
          <Button
            variant="ghost"
            onClick={onExit}
            className="w-full sm:w-auto text-zinc-500"
          >
            返回完成页
          </Button>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return null;
  }

  const progress = Math.round(((currentIndex + 1) / quizQueue.length) * 100);

  // First letter & length hint
  const hintText = `${currentWord.word.charAt(0).toUpperCase()} ${'_ '.repeat(
    currentWord.word.length - 1
  ).trim()} (共 ${currentWord.word.length} 个字母)`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>退出默写</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
            第 {currentIndex + 1} / {quizQueue.length} 词
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Quiz Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6">
        {/* Chinese Meaning */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              根据中文默写英文
            </span>
            {currentWord.pos && (
              <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {currentWord.pos}
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight pt-1">
            {currentWord.translation || currentWord.definition}
          </h3>

          {currentWord.translation && currentWord.definition && (
            <p
              translate="no"
              className="notranslate text-xs text-zinc-400 max-w-md mx-auto font-sans"
            >
              {currentWord.definition}
            </p>
          )}
        </div>

        {/* Audio helper & Context Cloze */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => TextToSpeech.speak(currentWord.word, { lang: accent })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>听发音 (快捷键 Space)</span>
            </button>

            {!showHint && !isAnswered && (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>提示首字母</span>
              </button>
            )}
          </div>

          {showHint && !isAnswered && (
            <div className="animate-in fade-in py-1 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 font-mono text-xs font-semibold tracking-wider">
              💡 提示: {hintText}
            </div>
          )}

          {clozeSentence && (
            <div className="w-full p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-400 block mb-1">语境填空线索:</span>
              <p
                translate="no"
                className="notranslate text-xs text-zinc-600 dark:text-zinc-300 italic font-serif"
              >
                &ldquo;{clozeSentence}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              disabled={isAnswered}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="在此拼写对应的英文单词..."
              className={`w-full px-4 py-3.5 text-lg font-mono text-center rounded-xl border transition-all focus:outline-none ${
                isAnswered
                  ? lastCorrect
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'border-rose-500 bg-rose-50/50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                  : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
          </div>

          {/* Feedback banner when answered */}
          {isAnswered && (
            <div className={`p-4 rounded-xl border animate-in zoom-in-95 duration-200 ${
              lastCorrect
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lastCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {lastCorrect ? '🎉 拼写完全正确！' : '拼写不符'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        translate="no"
                        className="notranslate font-serif font-bold text-base"
                      >
                        {currentWord.word}
                      </span>
                      <span
                        translate="no"
                        className="notranslate font-mono text-xs opacity-75"
                      >
                        {currentWord.phonetic || currentWord.phoneticUs}
                      </span>
                    </div>
                  </div>
                </div>

                <AudioButton text={currentWord.word} lang={accent} size="sm" />
              </div>

              {!lastCorrect && inputVal.trim() && (
                <div className="mt-2 text-xs pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                  <span className="text-zinc-500">您的拼写: </span>
                  <span className="line-through font-mono font-medium text-rose-600">
                    {inputVal.trim()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!isAnswered ? (
              <>
                <button
                  type="button"
                  onClick={handleGiveUp}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  不会，查看答案 (Skip)
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputVal.trim()}
                  className="gap-1.5 shadow-sm min-w-[120px]"
                >
                  <span>验证 (Enter)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={advanceToNext}
                className="w-full gap-1.5 shadow-sm"
              >
                <span>进入下一个单词 (Enter)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
