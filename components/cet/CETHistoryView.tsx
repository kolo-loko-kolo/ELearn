'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  TrendingUp, 
  BookOpen 
} from 'lucide-react';

export function CETHistoryView({ onStartExam }: { onStartExam: () => void }) {
  const records = useLiveQuery(() =>
    db.examRecords.reverse().toArray()
  ) || [];

  const handleClearHistory = async () => {
    if (confirm('确定要清空所有的四六级模考历史记录吗？')) {
      await db.examRecords.clear();
    }
  };

  const totalExams = records.length;
  const passedExams = records.filter((r) => r.passed).length;
  const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;
  const averageScore = totalExams > 0
    ? Math.round(records.reduce((acc, r) => acc + r.scaledScore, 0) / totalExams)
    : 0;
  const highestScore = totalExams > 0
    ? Math.max(...records.map((r) => r.scaledScore))
    : 0;

  if (totalExams === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            暂无模拟考试记录
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            进入“全真模拟考试”模式完成一套真题模拟卷，系统将自动记录并在此生成 710 分成绩档案与走势。
          </p>
        </div>
        <Button onClick={onStartExam} variant="primary" size="sm">
          前往开启首次模考
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm text-center">
          <span className="text-xs text-zinc-400 font-medium">参加模考场次</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
            {totalExams}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm text-center">
          <span className="text-xs text-zinc-400 font-medium">及格率 (≥425分)</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${passRate >= 60 ? 'text-emerald-600' : 'text-amber-500'}`}>
            {passRate}%
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm text-center">
          <span className="text-xs text-zinc-400 font-medium">历次平均考分</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {averageScore}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm text-center">
          <span className="text-xs text-zinc-400 font-medium">历史最高纪录</span>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
            {highestScore}
          </div>
        </div>
      </div>

      {/* Record List */}
      <div className="p-6 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              历次模考全真档案明细
            </h3>
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空记录</span>
          </button>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {records.map((r) => {
            const dateStr = new Date(r.completedAt).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const minutes = Math.round(r.timeSpentSeconds / 60);

            return (
              <div
                key={r.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      r.level === 'CET4'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {r.level}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {r.paperTitle}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>做题用时 {minutes} 分钟</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
                    <span>听力: <strong className="text-zinc-800 dark:text-zinc-200">{r.sectionScores.listening}</strong></span>
                    <span>阅读: <strong className="text-zinc-800 dark:text-zinc-200">{r.sectionScores.reading}</strong></span>
                    <span>翻译: <strong className="text-zinc-800 dark:text-zinc-200">{r.sectionScores.translation}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {r.scaledScore}
                      <span className="text-xs text-zinc-400 font-normal ml-0.5">/ 710</span>
                    </div>
                    <div>
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>及格达标</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>未达425分</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
