'use client';

import React, { useMemo } from 'react';

interface HeatmapProps {
  logs: { reviewDate: string }[];
  weeksCount?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ logs, weeksCount = 16 }) => {
  const { grid, totalReviewsThisPeriod } = useMemo(() => {
    // Count reviews per date
    const counts: Record<string, number> = {};
    for (const log of logs) {
      counts[log.reviewDate] = (counts[log.reviewDate] || 0) + 1;
    }

    const today = new Date();
    const daysToShow = weeksCount * 7;
    
    // Align with Sunday or Monday as first row
    const days: { dateStr: string; count: number; dayOfWeek: number }[] = [];
    let total = 0;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const count = counts[dateStr] || 0;
      total += count;
      days.push({
        dateStr,
        count,
        dayOfWeek: d.getDay(),
      });
    }

    // Group into columns of 7 days (weeks)
    const weeks: (typeof days)[] = [];
    let currentWeek: typeof days = [];

    for (const d of days) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { grid: weeks, totalReviewsThisPeriod: total };
  }, [logs, weeksCount]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-zinc-100 dark:bg-zinc-800/80 hover:ring-1 hover:ring-zinc-400';
    if (count < 5) return 'bg-emerald-200 dark:bg-emerald-900/80 hover:ring-1 hover:ring-emerald-400';
    if (count < 10) return 'bg-emerald-400 dark:bg-emerald-700 hover:ring-1 hover:ring-emerald-300';
    if (count < 20) return 'bg-emerald-500 dark:bg-emerald-500 hover:ring-1 hover:ring-emerald-200';
    return 'bg-emerald-600 dark:bg-emerald-400 hover:ring-1 hover:ring-emerald-100';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-xs text-zinc-500">
        <span>打卡频次（过去 {weeksCount} 周共复习 {totalReviewsThisPeriod} 次）</span>
        <div className="flex items-center gap-1.5">
          <span>较少</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 inline-block" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900 inline-block" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-700 inline-block" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-500 inline-block" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-400 inline-block" />
          <span>较多</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-flex gap-1.5">
          {grid.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((item) => (
                <div
                  key={item.dateStr}
                  title={`${item.dateStr}: 复习了 ${item.count} 次`}
                  className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer ${getColorClass(item.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
