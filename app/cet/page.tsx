'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CETPaper, CETExamRecord, UserSettings } from '@/types';
import { 
  CET_PAPERS, 
  getISOWeekKey, 
  getTimeUntilNextWeeklyRefresh, 
  getWeeklyMockPaper 
} from '@/lib/cetData';
import { CETPracticeView } from '@/components/cet/CETPracticeView';
import { Button } from '@/components/ui/Button';

// Dynamic lazy imports for instant page load & lightweight chunking
const CETMockExam = dynamic(
  () => import('@/components/cet/CETMockExam').then((mod) => mod.CETMockExam),
  {
    ssr: false,
    loading: () => (
      <div className="py-24 text-center space-y-3 animate-in fade-in">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500">正在进入四六级全真考场环境...</p>
      </div>
    ),
  }
);

const CETHistoryView = dynamic(
  () => import('@/components/cet/CETHistoryView').then((mod) => mod.CETHistoryView),
  {
    ssr: false,
    loading: () => (
      <div className="py-16 text-center text-xs text-zinc-400 animate-in fade-in">
        正在读取模考战绩档案...
      </div>
    ),
  }
);
import { 
  GraduationCap, 
  Sparkles, 
  Target, 
  Award, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function CETPage() {
  const settingsDoc = useLiveQuery(() => db.settings.get('userSettings'));
  const settings = settingsDoc?.value as UserSettings | undefined;
  const accentPreference = settings?.accentPreference || 'en-US';
  const examRecords = useLiveQuery(() => db.examRecords.toArray());

  // State
  const [level, setLevel] = useState<'CET4' | 'CET6'>('CET4');
  const [activeTab, setActiveTab] = useState<'mock' | 'practice' | 'history'>('mock');
  const [activeExamPaper, setActiveExamPaper] = useState<CETPaper | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [reviewRecord, setReviewRecord] = useState<CETExamRecord | undefined>(undefined);

  // Weekly mock exam calculations
  const currentWeekKey = getISOWeekKey();
  const refreshTime = getTimeUntilNextWeeklyRefresh();
  const weeklyPaper = getWeeklyMockPaper(level);

  // Check if user already took this week's exam for this level
  const thisWeekRecord = useMemo(() => {
    return examRecords?.find((r) => r.weekKey === currentWeekKey && r.level === level);
  }, [examRecords, currentWeekKey, level]);

  const filteredPapers = CET_PAPERS.filter((p) => p.level === level);

  // If currently taking or reviewing an exam
  if (activeExamPaper) {
    return (
      <CETMockExam
        paper={activeExamPaper}
        accentPreference={accentPreference}
        isReviewOnly={isReviewMode}
        initialAnswers={reviewRecord?.answers}
        initialRecord={reviewRecord}
        onExit={() => {
          setActiveExamPaper(null);
          setIsReviewMode(false);
          setReviewRecord(undefined);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-in fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6 sm:p-8 dark:border-indigo-900/60 dark:bg-zinc-900/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <GraduationCap className="w-4 h-4" />
              <span>全国大学英语四六级考试 (CET-4 / CET-6) 特训模块</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
              四六级全真模拟考场与专项突破
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              严格参照 CET-4 与 CET-6 考试大纲。支持原生真实听力播音合成、长篇仔细阅读精解、汉译英核心得分点比对及 710 分全真换算模型，全面助你稳操胜券！
            </p>
          </div>

          {/* Level Switcher (CET-4 vs CET-6) */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-xs font-semibold text-zinc-400">选择备考等级:</span>
            <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => setLevel('CET4')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  level === 'CET4'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <span>大学英语四级 (CET-4)</span>
              </button>

              <button
                type="button"
                onClick={() => setLevel('CET6')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  level === 'CET6'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <span>大学英语六级 (CET-6)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('mock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'mock'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-500" />
          <span>全真模拟考试</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'practice'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Target className="w-4 h-4 text-purple-500" />
          <span>专项精练刷题</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>模考战绩档案</span>
        </button>
      </div>

      {/* Tab 1: Mock Exams */}
      {activeTab === 'mock' && (
        <div className="space-y-8">
          {/* FEATURED: WEEKLY OFFICIAL MOCK EXAM SECTION */}
          <div className="p-6 sm:p-8 rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:border-indigo-500/20 dark:bg-zinc-900/90 shadow-md space-y-6">
            {/* Top Bar of the Weekly Exam */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      第 {currentWeekKey.split('-W')[1]} 周官方定期全真模考
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-300">
                      每周刷新 · 限考 1 次
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    近20年历年真题精编（无作文版）· 710分标准换算
                  </span>
                </div>
              </div>

              {/* Countdown to next weekly refresh */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-mono text-zinc-600 dark:text-zinc-300 self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span>距下周一 00:00 刷新: {refreshTime.days}天 {refreshTime.hours}小时 {refreshTime.minutes}分</span>
              </div>
            </div>

            {/* Weekly Exam Status & Card */}
            {thisWeekRecord ? (
              /* State A: User Already Completed This Week's Exam */
              <div className="p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-zinc-800/60 border border-emerald-200 dark:border-emerald-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        本周模考已顺利交卷！
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        thisWeekRecord.passed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {thisWeekRecord.passed ? '及格达标' : '未达及格线'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      试卷：{thisWeekRecord.paperTitle} · 考评成绩已正式记入档案
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 bg-zinc-50 dark:bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700">
                    <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                      {thisWeekRecord.scaledScore}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">/ 710分</span>
                  </div>
                </div>

                {/* Section breakdown mini */}
                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">听力得分</span>
                    <span className="text-sm font-bold font-mono text-zinc-700 dark:text-zinc-300">
                      {thisWeekRecord.sectionScores.listening} / 248.5
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">阅读得分</span>
                    <span className="text-sm font-bold font-mono text-zinc-700 dark:text-zinc-300">
                      {thisWeekRecord.sectionScores.reading} / 248.5
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">翻译得分</span>
                    <span className="text-sm font-bold font-mono text-zinc-700 dark:text-zinc-300">
                      {thisWeekRecord.sectionScores.translation} / 213
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>本周成绩已锁定，下周一 00:00 开放下一场正式模考</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveExamPaper(weeklyPaper);
                      setIsReviewMode(true);
                      setReviewRecord(thisWeekRecord);
                    }}
                    className="gap-1.5 font-semibold"
                  >
                    <span>回顾本周试卷与考点精解</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* State B: User Has NOT Taken This Week's Exam Yet */
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-zinc-800/80 border border-indigo-200 dark:border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-3 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                      🔥 本周待考
                    </span>
                    <span className="text-xs font-semibold text-zinc-500">
                      {weeklyPaper.yearSession}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
                    {weeklyPaper.title}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    本套真题涵盖 1 段完整听力报道与长对话、2 篇仔细阅读长文及 1 篇传统文化主题汉译英。严格计时 65 分钟，完成后生成 710 分官方标准成绩单及错题解析。
                  </p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      标准时长: {weeklyPaper.durationMinutes} 分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      每周限交卷 1 次
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      setActiveExamPaper(weeklyPaper);
                      setIsReviewMode(false);
                      setReviewRecord(undefined);
                    }}
                    className="gap-2 shadow-md font-bold px-6 py-3 text-sm w-full sm:w-auto"
                  >
                    <span>开始本周模拟考试</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <span className="text-[11px] text-zinc-400">
                    中途可暂停 · 交卷后生成成绩单
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PAST PAPERS ARCHIVE / PRACTICE MODE */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  近20年历年真题精编卷库（自由刷卷模式）
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  已收录近年官方四六级真题精选（已去除作文板块），可随时进入自测练习
                </p>
              </div>
              <span className="text-xs text-zinc-400">
                共 {filteredPapers.length} 套标准化试卷
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPapers.map((paper) => {
                const totalQuestions = paper.sections.reduce((acc, s) => acc + s.questions.length, 0);
                const pastRecord = examRecords?.find((r) => r.paperId === paper.id);

                return (
                  <div
                    key={paper.id}
                    className="p-6 rounded-3xl border border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-zinc-700 shadow-sm flex flex-col justify-between gap-6 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          paper.level === 'CET4'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {paper.level} 710分标准制
                        </span>
                        <span className="text-xs font-semibold text-zinc-400">
                          {paper.yearSession}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {paper.title}
                      </h4>

                      {/* Features list */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">标准考试时长</span>
                          <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300">
                            {paper.durationMinutes} 分钟
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">涵盖核心题型</span>
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            听力/阅读/翻译
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">试题总题量</span>
                          <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300">
                            {totalQuestions} 题
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      {pastRecord ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>曾测成绩: {pastRecord.scaledScore}分</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span>全真模拟训练</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {pastRecord && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActiveExamPaper(paper);
                              setIsReviewMode(true);
                              setReviewRecord(pastRecord);
                            }}
                            className="text-xs text-zinc-500"
                          >
                            <span>查阅解析</span>
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setActiveExamPaper(paper);
                            setIsReviewMode(false);
                            setReviewRecord(undefined);
                          }}
                          className="gap-1.5 shadow-sm font-semibold"
                        >
                          <span>{pastRecord ? '再次练习' : '进入考场'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sectional Practice */}
      {activeTab === 'practice' && (
        <CETPracticeView
          initialLevel={level}
          accentPreference={accentPreference}
        />
      )}

      {/* Tab 3: History & Score Tracker */}
      {activeTab === 'history' && (
        <CETHistoryView
          onStartExam={() => setActiveTab('mock')}
        />
      )}
    </div>
  );
}
