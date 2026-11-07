import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Background Gradient */}
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="45%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* Accent Spark Gradient */}
        <linearGradient id="logoSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>

        {/* Subtle Inner Highlight */}
        <linearGradient id="logoRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Background Squircle with subtle rim */}
      <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#logoBgGrad)" />
      <rect x="16" y="16" width="480" height="480" rx="112" fill="none" stroke="url(#logoRimGrad)" strokeWidth="6" />

      {/* Main Symbol: Iconic 'E' + Book & Speech Cadence */}
      <g>
        {/* Vertical Book Spine / Pillar of 'E' */}
        <rect x="120" y="128" width="56" height="256" rx="28" fill="#FFFFFF" />

        {/* Top Shelf (Book Cover / 'E' Top arm) */}
        <path d="M148 128 h172 c15.464 0 28 12.536 28 28 v0 c0 15.464 -12.536 28 -28 28 h-172 c-15.464 0 -28 -12.536 -28 -28 v0 c0 -15.464 12.536 -28 28 -28 z" fill="#FFFFFF" />

        {/* Middle Shelf (Speech / Turning Page) */}
        <path d="M148 228 h136 c15.464 0 28 12.536 28 28 v0 c0 15.464 -12.536 28 -28 28 h-136 c-15.464 0 -28 -12.536 -28 -28 v0 c0 -15.464 12.536 -28 28 -28 z" fill="#FFFFFF" fillOpacity="0.92" />

        {/* Bottom Shelf ('E' Base) */}
        <path d="M148 328 h184 c15.464 0 28 12.536 28 28 v0 c0 15.464 -12.536 28 -28 28 h-184 c-15.464 0 -28 -12.536 -28 -28 v0 c0 -15.464 12.536 -28 28 -28 z" fill="#FFFFFF" />

        {/* Soundwave & Intuition Accent: 2 Dynamic Speech Bars */}
        <rect x="368" y="210" width="22" height="92" rx="11" fill="url(#logoSparkGrad)" />
        <rect x="404" y="232" width="22" height="48" rx="11" fill="url(#logoSparkGrad)" opacity="0.85" />
      </g>

      {/* Spark of Epiphany / Fluency Star */}
      <g transform="translate(372, 124)">
        <circle cx="0" cy="0" r="14" fill="#38BDF8" opacity="0.5" />
        <path d="M 0 -24 Q 0 0 24 0 Q 0 0 0 24 Q 0 0 -24 0 Q 0 0 0 -24 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
};
