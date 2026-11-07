'use client';

import React, { useState } from 'react';
import { getDailyPracticeSuite } from '@/lib/cetData';
import { TextToSpeech } from '@/lib/speech';
import { db } from '@/lib/db';
import { getTodayDateString } from '@/lib/srs';
import { Word } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Plus, 
  Check, 
  Sparkles,
  Calendar,
  Headphones,
  Languages,
  Eye,
  EyeOff
} from 'lucide-react';

interface CETPracticeViewProps {
  initialLevel?: 'CET4' | 'CET6';
  accentPreference?: 'en-US' | 'en-GB';
}

export function CETPracticeView({
  initialLevel = 'CET4',
  accentPreference = 'en-US',
}: CETPracticeViewProps) {
  const [level, setLevel] = useState<'CET4' | 'CET6'>(initialLevel);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [translationInput, setTranslationInput] = useState('');
  const [showTranslationSample, setShowTranslationSample] = useState(false);
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});

  const suite = getDailyPracticeSuite(level);

  // All MC questions in the suite
  const allQuestions = [
    ...suite.listening.questions,
    ...suite.readings[0].questions,
    ...suite.readings[1].questions,
  ];

  // Number of questions answered
  const answeredMCQuestions = allQuestions.filter((q) => !!userAnswers[q.id]).length;
  const totalItems = allQuestions.length + 1; // +1 for translation
  const completedTotal = answeredMCQuestions + (showTranslationSample ? 1 : 0);

  const handleSelectOption = (questionId: string, letter: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: letter }));
    setShowResults((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      TextToSpeech.stop();
      setIsPlayingAudio(false);
    } else {
      TextToSpeech.stop();
      setIsPlayingAudio(true);
      TextToSpeech.speak(suite.listening.transcript, {
        lang: accentPreference,
        rate: 0.95,
        onEnd: () => setIsPlayingAudio(false),
      });
    }
  };

  const handleSaveWord = async (rawWord: string) => {
    const today = getTodayDateString();
    // Parse word and translation from format "word (translation)" or just "word"
    let word = rawWord;
    let translation = '四六级重点专练词汇';
    const match = rawWord.match(/^([^()]+)\s*\(([^()]+)\)/);
    if (match) {
      word = match[1].trim();
      translation = match[2].trim();
    }

    const newWord: Word = {
      word: word.toLowerCase().trim(),
      definition: translation,
      translation,
      tags: ['#四六级', `#${level}`, '#真题考点'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      reviewCount: 0,
      lapses: 0,
    };
    await db.words.add(newWord);
    setSavedWords((prev) => ({ ...prev, [rawWord]: true }));
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner & Level Selector */}
      <div className="p-6 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              今日四六级专项精炼（每日更新）
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            精炼组合：🎧 1段完整听力 (4小题) + 📖 2篇仔细阅读 (4小题) + ✍️ 1篇汉译英专练 · 每天 00:00 自动轮换
          </p>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => {
                setLevel('CET4');
                setUserAnswers({});
                setShowResults({});
                setShowTranscript(false);
                setShowTranslationSample(false);
                TextToSpeech.stop();
                setIsPlayingAudio(false);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                level === 'CET4'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              四级专项 (CET-4)
            </button>
            <button
              type="button"
              onClick={() => {
                setLevel('CET6');
                setUserAnswers({});
                setShowResults({});
                setShowTranscript(false);
                setShowTranslationSample(false);
                TextToSpeech.stop();
                setIsPlayingAudio(false);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                level === 'CET6'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              六级专项 (CET-6)
            </button>
          </div>
        </div>
      </div>

      {/* Progress Status Bar */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            今日特训完成进度:
          </span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {completedTotal} / {totalItems} 题
          </span>
        </div>
        <div className="w-32 sm:w-48 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(completedTotal / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* MODULE 1: LISTENING SECTION (1 FULL PASSAGE + 4 QUESTIONS) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
                  {level} 听力突破 (4小题)
                </span>
                <span className="text-xs text-zinc-400">
                  {suite.listening.speakerRole}
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {suite.listening.title}
              </h3>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlayingAudio ? 'secondary' : 'primary'}
              onClick={handleToggleAudio}
              className="gap-2 shadow-sm font-semibold"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>停止播放</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>播放原声听力</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTranscript(!showTranscript)}
              className="gap-1.5 text-xs"
            >
              {showTranscript ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>隐藏原文</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>听力原文</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Transcript */}
        {showTranscript && (
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2 animate-in fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              听力材料听写原文 (Audio Transcript)
            </span>
            <p
              translate="no"
              className="notranslate text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed whitespace-pre-line"
            >
              {suite.listening.transcript}
            </p>
          </div>
        )}

        {/* 4 Listening Questions */}
        <div className="space-y-6 pt-2">
          {suite.listening.questions.map((q) => {
            const userAns = userAnswers[q.id] || '';
            const isAnswered = !!showResults[q.id];
            const isCorrect = userAns.toUpperCase() === q.correctAnswer.toUpperCase();

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/80 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
                    {q.questionNumber}
                  </span>
                  <p
                    translate="no"
                    className="notranslate text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-serif leading-snug pt-0.5"
                  >
                    {q.questionText}
                  </p>
                </div>

                {/* Options (A, B, C, D) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-9">
                  {q.options.map((opt) => {
                    const letter = opt.trim().charAt(0).toUpperCase();
                    const isSelected = userAns === letter;
                    const isRightOption = letter === q.correctAnswer;

                    let btnStyle = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200';
                    if (isAnswered) {
                      if (isRightOption) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                      } else if (isSelected && !isRightOption) {
                        btnStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-semibold';
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(q.id, letter)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                      >
                        <span translate="no" className="notranslate leading-relaxed">
                          {opt}
                        </span>
                        {isAnswered && isRightOption && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isRightOption && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Answer Feedback & Explanation */}
                {isAnswered && (
                  <div className="pl-9 pt-2">
                    <div className={`p-3.5 rounded-xl text-xs space-y-1 ${
                      isCorrect 
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>回答正确！正确选项是 {q.correctAnswer}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>回答错误。正确答案是 {q.correctAnswer}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed pt-1 opacity-90">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODULE 2: READING PASSAGE 1 */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
              仔细阅读精解 (篇章一)
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {suite.readings[0].title}
            </h3>
          </div>
        </div>

        {/* Passage 1 Text */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-200/70 dark:border-zinc-800 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            阅读文章正文 (Passage)
          </span>
          <p
            translate="no"
            className="notranslate text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed whitespace-pre-line"
          >
            {suite.readings[0].passage}
          </p>
        </div>

        {/* Questions for Passage 1 */}
        <div className="space-y-6">
          {suite.readings[0].questions.map((q) => {
            const userAns = userAnswers[q.id] || '';
            const isAnswered = !!showResults[q.id];
            const isCorrect = userAns.toUpperCase() === q.correctAnswer.toUpperCase();

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/80 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-xs font-bold font-mono">
                    {q.questionNumber}
                  </span>
                  <p
                    translate="no"
                    className="notranslate text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-serif leading-snug pt-0.5"
                  >
                    {q.questionText}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-9">
                  {q.options.map((opt) => {
                    const letter = opt.trim().charAt(0).toUpperCase();
                    const isSelected = userAns === letter;
                    const isRightOption = letter === q.correctAnswer;

                    let btnStyle = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200';
                    if (isAnswered) {
                      if (isRightOption) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                      } else if (isSelected && !isRightOption) {
                        btnStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold';
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(q.id, letter)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                      >
                        <span translate="no" className="notranslate leading-relaxed">
                          {opt}
                        </span>
                        {isAnswered && isRightOption && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isRightOption && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="pl-9 pt-2">
                    <div className={`p-3.5 rounded-xl text-xs space-y-1 ${
                      isCorrect 
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>回答正确！正确选项是 {q.correctAnswer}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>回答错误。正确答案是 {q.correctAnswer}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed pt-1 opacity-90">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODULE 3: READING PASSAGE 2 */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-mono">
              仔细阅读精解 (篇章二)
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {suite.readings[1].title}
            </h3>
          </div>
        </div>

        {/* Passage 2 Text */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-200/70 dark:border-zinc-800 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            阅读文章正文 (Passage)
          </span>
          <p
            translate="no"
            className="notranslate text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed whitespace-pre-line"
          >
            {suite.readings[1].passage}
          </p>
        </div>

        {/* Questions for Passage 2 */}
        <div className="space-y-6">
          {suite.readings[1].questions.map((q) => {
            const userAns = userAnswers[q.id] || '';
            const isAnswered = !!showResults[q.id];
            const isCorrect = userAns.toUpperCase() === q.correctAnswer.toUpperCase();

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/80 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center text-xs font-bold font-mono">
                    {q.questionNumber}
                  </span>
                  <p
                    translate="no"
                    className="notranslate text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-serif leading-snug pt-0.5"
                  >
                    {q.questionText}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-9">
                  {q.options.map((opt) => {
                    const letter = opt.trim().charAt(0).toUpperCase();
                    const isSelected = userAns === letter;
                    const isRightOption = letter === q.correctAnswer;

                    let btnStyle = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200';
                    if (isAnswered) {
                      if (isRightOption) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                      } else if (isSelected && !isRightOption) {
                        btnStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 font-semibold';
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(q.id, letter)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                      >
                        <span translate="no" className="notranslate leading-relaxed">
                          {opt}
                        </span>
                        {isAnswered && isRightOption && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isRightOption && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="pl-9 pt-2">
                    <div className={`p-3.5 rounded-xl text-xs space-y-1 ${
                      isCorrect 
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>回答正确！正确选项是 {q.correctAnswer}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>回答错误。正确答案是 {q.correctAnswer}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed pt-1 opacity-90">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODULE 4: TRANSLATION SECTION (保留汉译英专练) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
              汉译英核心专练 (保留)
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {suite.translation.title}
            </h3>
          </div>
        </div>

        {/* Chinese Source Passage */}
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/40 dark:bg-zinc-800/40 border border-amber-200/50 dark:border-zinc-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            中文翻译源文 (Chinese Source)
          </span>
          <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-serif">
            {suite.translation.passage}
          </p>
        </div>

        {/* User Input Textarea */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            你的英文译文 (Your English Translation):
          </label>
          <textarea
            rows={4}
            value={translationInput}
            onChange={(e) => setTranslationInput(e.target.value)}
            placeholder="在此键入你的英文翻译草稿，随后点击下方按钮对照权威参考范文与语法考点..."
            translate="no"
            className="notranslate w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-serif focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-zinc-400"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">
              已输入 {translationInput.trim().split(/\s+/).filter(Boolean).length} 个英文单词
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTranslationSample(true)}
              className="gap-1.5 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>提交并查看参考译文与得分要点</span>
            </Button>
          </div>
        </div>

        {/* Translation Key Points & Sample Reveal */}
        {showTranslationSample && (
          <div className="space-y-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in">
            {/* Core Vocabulary / Key Points */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>四六级高分核心采分点词组 (点击一键收录至生词库):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {suite.translation.keyPoints.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSaveWord(term)}
                    disabled={savedWords[term]}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      savedWords[term]
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-zinc-100 hover:bg-indigo-50 text-zinc-800 hover:text-indigo-700 border-zinc-200 hover:border-indigo-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-indigo-950'
                    }`}
                  >
                    {savedWords[term] ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span translate="no" className="notranslate font-mono">
                      {term}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Official Sample Translation */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-zinc-800/40 border border-emerald-200 dark:border-zinc-700 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                官方参考高分范文 (Sample Translation)
              </span>
              <p
                translate="no"
                className="notranslate text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed"
              >
                {suite.translation.sampleTranslation}
              </p>
            </div>

            {/* Translation Structure Explanation */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {suite.translation.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
