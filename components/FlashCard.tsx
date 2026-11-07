'use client';

import React from 'react';
import { Word } from '@/types';
import { AudioButton } from './AudioButton';
import { Clock, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
  accent?: 'en-US' | 'en-GB';
}

export const FlashCard: React.FC<FlashCardProps> = ({
  word,
  isFlipped,
  onFlip,
  accent = 'en-US',
}) => {
  return (
    <div
      onClick={onFlip}
      className="relative w-full max-w-xl h-[400px] sm:h-[440px] cursor-pointer select-none group perspective"
      style={{ perspective: '1200px' }}
    >
      <div
        className={cn(
          'relative w-full h-full duration-500 ease-out transform-gpu transition-transform rounded-2xl shadow-lg border',
          'border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900',
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT FACE */}
        <div
          className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 [backface-visibility:hidden]"
        >
          {/* Top meta */}
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center gap-1.5 flex-wrap">
              {word.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>当前间隔: {word.interval}天</span>
            </div>
          </div>

          {/* Center Word & Phonetics (Strictly marked notranslate) */}
          <div className="flex flex-col items-center justify-center my-auto text-center space-y-4">
            <h2
              translate="no"
              className="notranslate text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif"
            >
              {word.word}
            </h2>

            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
              <span
                translate="no"
                className="notranslate text-sm font-mono text-zinc-500 dark:text-zinc-400"
              >
                {word.phonetic || word.phoneticUs || '/.../'}
              </span>
              <AudioButton text={word.word} lang={accent} size="sm" />
            </div>

            {word.pos && (
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded">
                {word.pos}
              </span>
            )}
          </div>

          {/* Bottom Flip Hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
            <RotateCw className="w-3.5 h-3.5 animate-spin-reverse" />
            <span>点击卡片或按 <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-[10px] border border-zinc-200 dark:border-zinc-700">空格 Space</kbd> 查看释义</span>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0 w-full h-full p-6 sm:p-8 flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 overflow-y-auto [transform:rotateY(180deg)] [backface-visibility:hidden]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span
                translate="no"
                className="notranslate text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100"
              >
                {word.word}
              </span>
              <AudioButton text={word.word} lang={accent} size="sm" />
              {word.pos && (
                <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                  {word.pos}
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-400">已巩固: #{word.repetition} 次</span>
          </div>

          {/* Content Body */}
          <div className="my-auto space-y-4 py-2">
            {/* Translation & Definition */}
            <div>
              {word.translation && (
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {word.translation}
                </div>
              )}
              <p
                translate="no"
                className="notranslate text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans"
              >
                {word.definition}
              </p>
            </div>

            {/* Example sentence */}
            {word.exampleSentence && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p
                      translate="no"
                      className="notranslate text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug font-serif"
                    >
                      {word.exampleSentence}
                    </p>
                    {word.exampleTranslation && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {word.exampleTranslation}
                      </p>
                    )}
                  </div>
                  <AudioButton text={word.exampleSentence} lang={accent} size="sm" />
                </div>
              </div>
            )}

            {/* Notes if any */}
            {word.notes && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                助记/词根: {word.notes}
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
            <span className="font-mono">难度因子 EF: {word.easeFactor}</span>
            <span>复习记录: {word.reviewCount}次</span>
            <span>遗忘重置: {word.lapses}次</span>
          </div>
        </div>
      </div>
    </div>
  );
};
