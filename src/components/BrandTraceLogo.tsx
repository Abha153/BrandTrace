import React from 'react';
import { useTheme } from '../ThemeContext';

interface BrandTraceLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandTraceLogo: React.FC<BrandTraceLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const { isOriginal } = useTheme();

  // Dimension scaling
  const dim = {
    sm: { icon: 'w-6 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-7 h-8', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-9 h-10', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-12 h-14', text: 'text-2xl', sub: 'text-sm' },
  }[size];

  // Dynamic stroke color based on active theme
  const strokeColor = isOriginal ? '#ffffff' : '#15221b';
  const textColor = isOriginal ? 'text-white' : 'text-[#15221b]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* BrandTrace Mark - Isometric Checkmark Cube */}
      <div className={`relative shrink-0 ${dim.icon} flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 115"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Outer cube outline with checkmark trace on top-left */}
          <path
            d="M 50 8
               L 92 32
               L 92 82
               L 50 106
               L 8 82
               L 8 46"
            stroke={strokeColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Top apex towards left edge */}
          <path
            d="M 50 8
               L 26 22"
            stroke={strokeColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Checkmark tick on top-left facet */}
          <path
            d="M 14 38
               L 24 44"
            stroke={strokeColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Center Seam Y: vertical down & up-right, with trace to center */}
          <path
            d="M 50 57
               L 50 106"
            stroke={strokeColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 50 57
               L 92 32"
            stroke={strokeColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 32 46
               L 50 57"
            stroke={strokeColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className={`font-semibold tracking-tight ${dim.text} ${textColor}`}>
              BrandTrace
            </span>
            <span className={`font-light tracking-wide ${dim.text} ${isOriginal ? 'text-sky-400' : 'text-[#2d5a43]'}`}>
              AI
            </span>
          </div>
          <span className={`uppercase tracking-widest font-mono text-[9px] ${isOriginal ? 'text-slate-400' : 'text-stone-500'}`}>
            Compliance & Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
