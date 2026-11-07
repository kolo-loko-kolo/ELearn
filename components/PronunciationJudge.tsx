'use client';

import React from 'react';
import { PronunciationResult } from '@/types';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PronunciationJudgeProps {
  result: PronunciationResult | null;
}

export const PronunciationJudge: React.FC<PronunciationJudgeProps> = ({
  result,
}) => {
  if (!result) return null;

  const getScoreBadge = (score: number) => {
    if (score >= 90) {
      return {
        label: '发音纯正！',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        icon: Sparkles,
      };
    }
    if (score >= 75) {
      return {
        label: '表现很棒！',
        color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
        icon: CheckCircle2,
      };
    }
    if (score >= 50) {
      return {
        label: '继续加油',
        color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        icon: AlertCircle,
      };
    }
    return {
      label: '还需练习',
      color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      icon: AlertCircle,
    };
  };

  const badge = getScoreBadge(result.score);
  const BadgeIcon = badge.icon;

  return (
    <div className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4 animate-in fade-in">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-zinc-400">
            发音准确度评分
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border',
              badge.color
            )}
          >
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{badge.label}</span>
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
            {result.score}%
          </span>
        </div>
      </div>

      {/* Word-by-Word Visual Breakdown */}
      <div className="space-y-1.5">
        <span className="text-xs text-zinc-400">逐词准确度对比分析（绿色准确，红色缺失/发音偏差）：</span>
        <div className="flex flex-wrap gap-1.5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-base font-serif">
          {result.words.map((w, idx) => (
            <span
              key={idx}
              translate="no"
              className={cn(
                'notranslate px-1.5 py-0.5 rounded transition-all',
                w.matched
                  ? 'bg-emerald-100 text-emerald-800 font-semibold dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 line-through decoration-rose-500 font-medium dark:bg-rose-950/70 dark:text-rose-300'
              )}
              title={w.matched ? '发音准确' : '未识别或有发音偏差'}
            >
              {w.original}
            </span>
          ))}
        </div>
      </div>

      {/* Recognized Speech String */}
      <div className="text-xs text-zinc-500 space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <span className="font-medium text-zinc-400">麦克风识别到的语音：</span>
        <p
          translate="no"
          className="notranslate italic font-mono bg-zinc-100/50 dark:bg-zinc-800/30 p-2 rounded-lg text-zinc-700 dark:text-zinc-300"
        >
          &ldquo;{result.transcript || '(未检测到清晰语音)'}&rdquo;
        </p>
      </div>
    </div>
  );
};
