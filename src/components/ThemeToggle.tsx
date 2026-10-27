import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme, isOriginal } = useTheme();

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-full border transition-all ${
        isOriginal
          ? 'bg-slate-900 border-slate-800 text-slate-300'
          : 'bg-[#f1efe9] border-[#e2dfd7] text-slate-700'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          !isOriginal
            ? 'bg-white text-[#2d5a43] shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Switch to Light Theme (Warm white & forest green)"
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('original')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          isOriginal
            ? 'bg-slate-800 text-cyan-300 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Switch to Original Theme (Blue-black & cyan)"
      >
        <Moon className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[11px]">Original</span>
      </button>
    </div>
  );
};
