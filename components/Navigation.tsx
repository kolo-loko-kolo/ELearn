'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Library, 
  BookOpenText, 
  Mic, 
  Settings,
  GraduationCap,
  Sun,
  Moon
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { applyTheme, getStoredTheme, ThemeMode } from '@/lib/theme';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: ThemeMode }>;
      if (customEvent.detail?.mode) {
        setCurrentTheme(customEvent.detail.mode);
      }
    };
    window.addEventListener('elearn-theme-change', handleThemeChange);
    return () => window.removeEventListener('elearn-theme-change', handleThemeChange);
  }, []);

  const toggleQuickTheme = () => {
    const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const navItems = [
    { label: '首页看板', href: '/', icon: LayoutDashboard },
    { label: '卡片复习', href: '/vocab/review', icon: Layers },
    { label: '单词词库', href: '/vocab', icon: Library },
    { label: '四六级模考', href: '/cet', icon: GraduationCap },
    { label: '短文阅读', href: '/reader', icon: BookOpenText },
    { label: '影子跟读', href: '/practice', icon: Mic },
    { label: '设置备份', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 hidden md:block">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo className="w-8 h-8 rounded-xl shadow-sm transition-transform group-hover:scale-105" />
              <span translate="no" className="notranslate font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
                ELearn
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : item.href === '/vocab'
                    ? pathname === '/vocab'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleQuickTheme}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={currentTheme === 'dark' ? '切换为浅色明亮模式' : '切换为深色暗夜模式'}
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            <Link
              href="/vocab/review"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>每日复习</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200/80 bg-white/95 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/95 md:hidden">
        <nav className="grid grid-cols-7 h-16 max-w-lg mx-auto px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : item.href === '/vocab'
                ? pathname === '/vocab'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-[9px] font-medium transition-colors',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                )}
              >
                <div
                  className={cn(
                    'p-1 rounded-md transition-colors',
                    isActive && 'bg-indigo-50 dark:bg-indigo-950/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate max-w-[48px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};
