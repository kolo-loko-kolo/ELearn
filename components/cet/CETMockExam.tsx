'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { CETPaper, CETExamRecord } from '@/types';
import { TextToSpeech } from '@/lib/speech';
import { db } from '@/lib/db';
import { getISOWeekKey } from '@/lib/cetData';
import { Button } from '@/components/ui/Button';
import { 
  Clock, 
  Volume2, 
  VolumeX, 
  Award, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  RotateCcw, 
  Layers, 
  HelpCircle,
  Pause,
  Play
} from 'lucide-react';

interface CETMockExamProps {
  paper: CETPaper;
  accentPreference?: 'en-US' | 'en-GB';
  onExit: () => void;
  onCompleted?: (record: CETExamRecord) => void;
  isReviewOnly?: boolean;
  initialAnswers?: Record<string, string>;
  initialRecord?: CETExamRecord;
}

export function CETMockExam({
  paper,
  accentPreference = 'en-US',
  onExit,
  onCompleted,
  isReviewOnly = false,
  initialAnswers,
  initialRecord,
}: CETMockExamProps) {
  // State
  const [timeLeft, setTimeLeft] = useState<number>(paper.durationMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialAnswers || initialRecord?.answers || {}
  );
  const [isSubmitted, setIsSubmitted] = useState(isReviewOnly);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [examRecord, setExamRecord] = useState<CETExamRecord | null>(initialRecord || null);
  const [filterReview, setFilterReview] = useState<'all' | 'wrong' | 'correct'>('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSubmitRef = useRef<() => void>(() => {});

  // All questions flattened for index mapping
  const allQuestions = React.useMemo(() => {
    return paper.sections.flatMap((s) =>
      s.questions.map((q) => ({
        ...q,
        sectionId: s.id,
        sectionType: s.type,
        sectionTitle: s.title,
        passage: s.passage,
        audioTranscript: s.audioTranscript,
        keyTerms: s.keyTerms,
        sampleTranslation: s.sampleTranslation,
      }))
    );
  }, [paper]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  // Handle Play/Stop Audio for Listening section
  const handleToggleAudio = (text: string, id: string) => {
    if (isPlayingAudio && activeAudioId === id) {
      TextToSpeech.stop();
      setIsPlayingAudio(false);
      setActiveAudioId(null);
    } else {
      TextToSpeech.stop();
      setIsPlayingAudio(true);
      setActiveAudioId(id);
      TextToSpeech.speak(text, {
        lang: accentPreference,
        rate: 0.95, // realistic CET test pace
        onEnd: () => {
          setIsPlayingAudio(false);
          setActiveAudioId(null);
        },
      });
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      TextToSpeech.stop();
    };
  }, []);

  // Answer selection
  const handleSelectOption = (questionId: string, optionLetter: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  // Text input for translation
  const handleTranslationChange = (questionId: string, text: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  // Calculate CET 710 Scaled Score
  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;
    TextToSpeech.stop();
    setIsPlayingAudio(false);

    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    let translationScoreRatio = 0; // 0 to 1

    allQuestions.forEach((q) => {
      const userAns = answers[q.id]?.trim() || '';
      if (q.sectionType === 'listening') {
        listeningTotal += 1;
        if (userAns.toUpperCase() === q.correctAnswer.toUpperCase()) {
          listeningCorrect += 1;
        }
      } else if (q.sectionType === 'reading' || q.sectionType === 'cloze') {
        readingTotal += 1;
        if (userAns.toUpperCase() === q.correctAnswer.toUpperCase()) {
          readingCorrect += 1;
        }
      } else if (q.sectionType === 'translation') {
        // Translation scoring: evaluate word count and key terms coverage
        const wordCount = userAns.split(/\s+/).filter(Boolean).length;
        let hits = 0;
        if (q.keyTerms && q.keyTerms.length > 0) {
          const lowerAns = userAns.toLowerCase();
          q.keyTerms.forEach((term) => {
            const root = term.en.split('/')[0].trim().toLowerCase();
            if (lowerAns.includes(root)) hits += 1;
          });
          const termRatio = hits / q.keyTerms.length;
          const lengthRatio = Math.min(1, wordCount / 50);
          translationScoreRatio = Number((termRatio * 0.7 + lengthRatio * 0.3).toFixed(2));
        } else {
          translationScoreRatio = userAns.length > 20 ? 0.8 : userAns.length > 0 ? 0.4 : 0;
        }
      }
    });

    // CET Scaled score conversion (Total 710)
    // Standard CET weights: Listening 248.5 pts, Reading 248.5 pts, Writing & Translation 213 pts
    const listeningScore = listeningTotal > 0
      ? Math.round((listeningCorrect / listeningTotal) * 248.5)
      : 0;

    const readingScore = readingTotal > 0
      ? Math.round((readingCorrect / readingTotal) * 248.5)
      : 0;

    const translationScore = Math.round(translationScoreRatio * 213);

    const totalScaled = Math.min(710, listeningScore + readingScore + translationScore);
    const passed = totalScaled >= 425; // CET-4/6 standard passing threshold

    const timeSpent = paper.durationMinutes * 60 - timeLeft;

    const currentWeekKey = getISOWeekKey();
    const record: CETExamRecord = {
      paperId: paper.id,
      paperTitle: paper.title,
      level: paper.level,
      weekKey: currentWeekKey,
      scaledScore: totalScaled,
      sectionScores: {
        listening: listeningScore,
        reading: readingScore,
        translation: translationScore,
      },
      passed,
      timeSpentSeconds: timeSpent,
      answers,
      completedAt: Date.now(),
    };

    // Save into Dexie database
    try {
      await db.examRecords.add(record);
    } catch (err) {
      console.warn('Failed to save exam record to db:', err);
    }

    setExamRecord(record);
    setIsSubmitted(true);
    onCompleted?.(record);

    if (passed) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [allQuestions, answers, paper, timeLeft, onCompleted, isSubmitted]);

  handleSubmitRef.current = handleSubmit;

  // Exam Countdown Timer
  useEffect(() => {
    if (isSubmitted || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, isPaused]);

  // Jump to Question smoothly
  const scrollToQuestion = (qId: string) => {
    const el = document.getElementById(`q-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const answeredCount = Object.keys(answers).filter((k) => !!answers[k]?.trim()).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Sticky Top Control Header */}
      <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>退出</span>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
                {paper.level}
              </span>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-md">
                {paper.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          {!isSubmitted && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold">
              <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span className={timeLeft < 300 ? 'text-rose-600 font-bold' : 'text-zinc-700 dark:text-zinc-300'}>
                {formatTime(timeLeft)}
              </span>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title={isPaused ? '继续考试' : '暂停计时'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Submit Exam Button */}
          {!isSubmitted ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (answeredCount < allQuestions.length) {
                  if (confirm(`您还有 ${allQuestions.length - answeredCount} 道题目未作答，确定现在提前交卷吗？`)) {
                    handleSubmit();
                  }
                } else {
                  if (confirm('已完成所有作答，确定提交试卷吗？')) {
                    handleSubmit();
                  }
                }
              }}
              className="shadow-sm font-semibold gap-1.5"
            >
              <span>交卷评分</span>
              <span className="text-xs opacity-75 font-mono">
                ({answeredCount}/{allQuestions.length})
              </span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onExit}
              className="gap-1.5"
            >
              <span>返回试卷列表</span>
            </Button>
          )}
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && !isSubmitted && (
        <div className="p-8 rounded-2xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/40 text-center space-y-3 animate-in fade-in">
          <Pause className="w-10 h-10 mx-auto text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
            考试已暂停
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            倒计时已挂起，稍事休息后点击下方按钮继续答题。
          </p>
          <Button
            variant="primary"
            onClick={() => setIsPaused(false)}
            className="gap-1.5"
          >
            <Play className="w-4 h-4" />
            <span>继续作答</span>
          </Button>
        </div>
      )}

      {/* POST-EXAM SCORE REPORT CARD */}
      {isSubmitted && examRecord && (
        <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-lg space-y-6 animate-in zoom-in-95 duration-300">
          <div className="text-center space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner ${
              examRecord.passed
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            }`}>
              <Award className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                全国大学英语四六级考试委员会换算模型
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-5xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                  {examRecord.scaledScore}
                </span>
                <span className="text-xl text-zinc-400 font-mono">/ 710分</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold">
              {examRecord.passed ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  🎉 考分达标！超越 425 分合格及格线
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  需再加把劲：距 425 分及格线还差 {425 - examRecord.scaledScore} 分
                </span>
              )}
            </div>
          </div>

          {/* Section Breakdown 3-col */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center space-y-1">
              <span className="text-xs text-zinc-500 font-medium">听力理解部分 (248.5)</span>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {examRecord.sectionScores.listening}
              </div>
              <span className="text-[11px] text-zinc-400">
                得分率: {Math.round((examRecord.sectionScores.listening / 248.5) * 100)}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center space-y-1">
              <span className="text-xs text-zinc-500 font-medium">仔细阅读理解 (248.5)</span>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {examRecord.sectionScores.reading}
              </div>
              <span className="text-[11px] text-zinc-400">
                得分率: {Math.round((examRecord.sectionScores.reading / 248.5) * 100)}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center space-y-1">
              <span className="text-xs text-zinc-500 font-medium">汉译英深度翻译 (213)</span>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {examRecord.sectionScores.translation}
              </div>
              <span className="text-[11px] text-zinc-400">
                得分率: {Math.round((examRecord.sectionScores.translation / 213) * 100)}%
              </span>
            </div>
          </div>

          {/* Actions & Filter buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-400 mr-1">试卷回顾筛选:</span>
              <button
                type="button"
                onClick={() => setFilterReview('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterReview === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                全部试题 ({allQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterReview('wrong')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterReview === 'wrong'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-rose-600 dark:text-rose-400'
                }`}
              >
                仅看错题
              </button>
              <button
                type="button"
                onClick={() => setFilterReview('correct')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterReview === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                仅看正确
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSubmitted(false);
                setTimeLeft(paper.durationMinutes * 60);
                setAnswers({});
                setExamRecord(null);
              }}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新模考此卷</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Layout: 2 Columns (Left: Test Paper Content; Right: Sticky Question Sheet) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: Exam Paper Sections */}
        <div className="lg:col-span-3 space-y-8">
          {paper.sections.map((section) => (
            <div
              key={section.id}
              className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6"
            >
              {/* Section Header */}
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                    {section.title}
                  </h3>
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {section.type}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {section.instruction}
                </p>
              </div>

              {/* Section Audio Player (For Listening Comprehension) */}
              {section.type === 'listening' && section.audioTranscript && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {section.speakerRole || 'CET 听力原声录音播音'}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        使用 Web Speech API 原生逼真合成朗读（标准四六级语速）
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={isPlayingAudio && activeAudioId === section.id ? 'secondary' : 'primary'}
                    onClick={() => handleToggleAudio(section.audioTranscript!, section.id)}
                    className="gap-2 shrink-0 shadow-sm"
                  >
                    {isPlayingAudio && activeAudioId === section.id ? (
                      <>
                        <VolumeX className="w-4 h-4 text-rose-500" />
                        <span>停止播放</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>播放录音材料</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Listening Transcript (Revealed only after submission) */}
              {isSubmitted && section.audioTranscript && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    🎧 听力录音全文对照 (Transcript)
                  </span>
                  <p
                    translate="no"
                    className="notranslate text-xs text-zinc-700 dark:text-zinc-300 font-serif leading-relaxed whitespace-pre-line"
                  >
                    {section.audioTranscript}
                  </p>
                </div>
              )}

              {/* Reading Passage */}
              {section.type === 'reading' && section.passage && (
                <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
                    阅读短文 (Passage)
                  </span>
                  <article
                    translate="no"
                    className="notranslate text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed space-y-3"
                  >
                    {section.passage.split('\n\n').map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </article>
                </div>
              )}

              {/* Translation Source Text */}
              {section.type === 'translation' && section.passage && (
                <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 space-y-2">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                    中文待译段落
                  </span>
                  <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans font-medium">
                    {section.passage}
                  </p>
                </div>
              )}

              {/* Section Questions */}
              <div className="space-y-6 pt-2">
                {section.questions.map((q) => {
                  const userAns = answers[q.id] || '';
                  const isCorrect = userAns.toUpperCase() === q.correctAnswer.toUpperCase();

                  // Filter logic when reviewing
                  if (isSubmitted) {
                    if (filterReview === 'wrong' && isCorrect && q.options) return null;
                    if (filterReview === 'correct' && !isCorrect && q.options) return null;
                  }

                  return (
                    <div
                      key={q.id}
                      id={`q-${q.id}`}
                      className={`p-5 rounded-2xl border transition-all ${
                        isSubmitted && q.options
                          ? isCorrect
                            ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                            : 'border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10'
                          : 'border-zinc-200/70 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/50'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {q.questionNumber}
                          </span>
                          <span
                            translate="no"
                            className="notranslate text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                          >
                            {q.questionText}
                          </span>
                        </div>

                        {isSubmitted && q.options && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>回答正确</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs font-bold text-rose-500">
                                <XCircle className="w-4 h-4" />
                                <span>错误</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Multiple Choice Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt) => {
                            const letter = opt.charAt(0);
                            const isSelected = userAns.toUpperCase() === letter;
                            const isAnswerKey = q.correctAnswer.toUpperCase() === letter;

                            let optClass = 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300';
                            if (isSubmitted) {
                              if (isAnswerKey) {
                                optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                              } else if (isSelected && !isAnswerKey) {
                                optClass = 'border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 line-through';
                              }
                            } else if (isSelected) {
                              optClass = 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 dark:border-indigo-500 text-indigo-950 dark:text-indigo-100 font-medium ring-2 ring-indigo-500/30';
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleSelectOption(q.id, letter)}
                                className={`text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${optClass}`}
                              >
                                <span
                                  translate="no"
                                  className="notranslate leading-relaxed"
                                >
                                  {opt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Translation Text Area */}
                      {section.type === 'translation' && (
                        <div className="space-y-3 pt-2">
                          <textarea
                            rows={6}
                            disabled={isSubmitted}
                            placeholder="在此输入您的英文翻译..."
                            value={userAns}
                            onChange={(e) => handleTranslationChange(q.id, e.target.value)}
                            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-serif text-sm sm:text-base leading-relaxed resize-none"
                          />
                          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                            <span>输入单词数: {userAns.split(/\s+/).filter(Boolean).length} 词</span>
                            <span>建议字数: 100 - 140 词</span>
                          </div>

                          {/* Post-submit: Key Points & Sample Translation */}
                          {isSubmitted && (
                            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                              {section.keyTerms && section.keyTerms.length > 0 && (
                                <div>
                                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                                    🎯 核心考点词汇匹配检测:
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {section.keyTerms.map((term, idx) => {
                                      const matched = userAns.toLowerCase().includes(term.en.split('/')[0].trim().toLowerCase());
                                      return (
                                        <span
                                          key={idx}
                                          className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                                            matched
                                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                                              : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                                          }`}
                                        >
                                          {matched ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-zinc-400" />}
                                          <span>{term.en} ({term.zh})</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {section.sampleTranslation && (
                                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
                                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">
                                    🌟 官方高分示范译文:
                                  </span>
                                  <p
                                    translate="no"
                                    className="notranslate text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed"
                                  >
                                    {section.sampleTranslation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation Panel after Submission */}
                      {isSubmitted && q.explanation && (
                        <div className="mt-3.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1.5">
                          <div className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>标准答案: {q.correctAnswer}</span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                            {q.explanation}
                          </p>
                          {q.targetSentence && (
                            <div className="pt-1 text-[11px] text-zinc-400">
                              <span>定位线索句: </span>
                              <em
                                translate="no"
                                className="notranslate text-zinc-600 dark:text-zinc-300"
                              >
                                &ldquo;{q.targetSentence}&rdquo;
                              </em>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right 1 col: Sticky Question Palette / Answer Sheet */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>答题卡导航</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {answeredCount}/{allQuestions.length}
              </span>
            </div>

            {/* Status Legend */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span>已作答</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 inline-block" />
                <span>未作答</span>
              </span>
            </div>

            {/* Question Buttons Matrix */}
            <div className="grid grid-cols-4 gap-2">
              {allQuestions.map((q) => {
                const isAnswered = !!answers[q.id]?.trim();
                const isCorrect = answers[q.id]?.trim().toUpperCase() === q.correctAnswer.toUpperCase();

                let btnClass = 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800';
                if (isSubmitted && q.options) {
                  btnClass = isCorrect
                    ? 'bg-emerald-500 text-white border-emerald-600 font-bold'
                    : 'bg-rose-500 text-white border-rose-600 font-bold';
                } else if (isAnswered) {
                  btnClass = 'bg-indigo-600 text-white border-indigo-700 font-semibold shadow-sm';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => scrollToQuestion(q.id)}
                    className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center ${btnClass}`}
                  >
                    {q.questionNumber}
                  </button>
                );
              })}
            </div>

            {/* Quick Action in Sheet */}
            <div className="pt-2">
              {!isSubmitted ? (
                <Button
                  variant="primary"
                  className="w-full shadow-sm text-xs"
                  onClick={handleSubmit}
                >
                  提前交卷评分
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={onExit}
                >
                  退出试卷
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
