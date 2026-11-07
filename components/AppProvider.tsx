'use client';

import React, { useEffect, useState } from 'react';
import { initializeDatabase } from '@/lib/db';
import { applyTheme, getStoredTheme, initThemeListener } from '@/lib/theme';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme(getStoredTheme());
    const cleanupTheme = initThemeListener();

    initializeDatabase().finally(() => {
      setIsReady(true);
    });

    // Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW registration failed:', err);
        });
      });
    }

    return () => {
      cleanupTheme();
    };
  }, []);

  // During SSR or before mount, render consistent skeleton to avoid hydration error
  if (!mounted || !isReady) {
    return (
      <div
        suppressHydrationWarning
        translate="no"
        className="notranslate min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            正在加载 ELearn...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
