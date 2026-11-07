'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { TextToSpeech } from '@/lib/speech';
import { cn } from '@/lib/utils';

interface AudioButtonProps {
  text: string;
  lang?: 'en-US' | 'en-GB';
  rate?: number;
  size?: 'sm' | 'md' | 'icon';
  className?: string;
  variant?: 'ghost' | 'secondary' | 'outline';
  label?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  lang = 'en-US',
  rate = 0.95,
  size = 'icon',
  className,
  variant = 'ghost',
  label,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      TextToSpeech.stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    TextToSpeech.speak(text, {
      lang,
      rate,
      onEnd: () => setIsPlaying(false),
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Listen to pronunciation (${lang === 'en-US' ? 'US' : 'UK'})`}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-95',
        variant === 'ghost' && 'text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50/50 dark:text-zinc-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/30',
        variant === 'secondary' && 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
        variant === 'outline' && 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
        size === 'icon' && 'h-8 w-8 p-1.5',
        size === 'sm' && 'h-7 px-2.5 text-xs gap-1',
        size === 'md' && 'h-9 px-3 text-sm gap-1.5',
        isPlaying && 'text-indigo-600 ring-2 ring-indigo-400/50 bg-indigo-50/80 dark:text-indigo-400 dark:bg-indigo-950/50',
        className
      )}
    >
      <Volume2 className={cn('h-4 w-4 shrink-0 transition-transform', isPlaying && 'animate-pulse scale-110 text-indigo-600 dark:text-indigo-400')} />
      {label && <span>{label}</span>}
    </button>
  );
};
