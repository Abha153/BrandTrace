import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  BarChart3,
  Activity,
  Settings,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Globe,
  X,
  BookOpen,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { BrandTraceLogo } from './BrandTraceLogo';

export type ScreenId =
  | 'landing'
  | 'dashboard'
  | 'studio'
  | 'brandkit'
  | 'results'
  | 'library'
  | 'diagnostics'
  | 'settings';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  savedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  savedCount,
}) => {
  const { isOriginal } = useTheme();

  const navItems = [
    { id: 'dashboard' as ScreenId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio' as ScreenId, label: 'Audit Studio', icon: Sparkles },
    { id: 'brandkit' as ScreenId, label: 'Brand Kit', icon: BookOpen },
    { id: 'library' as ScreenId, label: 'Reviews Library', icon: FolderOpen, count: savedCount },
    { id: 'results' as ScreenId, label: 'Analysis Results', icon: BarChart3 },
    { id: 'diagnostics' as ScreenId, label: 'Diagnostics', icon: Activity },
    { id: 'settings' as ScreenId, label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (id: ScreenId) => {
    onNavigate(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5">
      {/* Top: Brand Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleItemClick('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <BrandTraceLogo size="sm" showText={true} />
          </button>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className={`lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? isOriginal
                      ? 'bg-indigo-600/20 text-cyan-300 border border-indigo-500/30 font-bold'
                      : 'bg-[#2d5a43]/10 text-[#2d5a43] border border-[#2d5a43]/20 font-bold'
                    : isOriginal
                    ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                    : 'text-slate-600 hover:text-[#15221b] hover:bg-[#f3f1eb]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active
                        ? isOriginal
                          ? 'text-cyan-400'
                          : 'text-[#2d5a43]'
                        : isOriginal
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isOriginal
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-[#e7e4dc] text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Landing link & Mini Compliance Score Widget */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        {/* Switch to Landing Page button */}
        <button
          onClick={() => handleItemClick('landing')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            isOriginal
              ? 'text-slate-400 hover:text-white hover:bg-slate-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#f3f1eb]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Public Landing Page</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>

        {/* Mini Compliance Score Widget (matches bottom-left sidebar widget in mockup!) */}
        <div
          className={`p-3.5 rounded-2xl border transition-colors ${
            isOriginal
              ? 'bg-[#080d1a] border-slate-800 text-slate-100'
              : 'bg-[#fcfbf9] border-[#e7e4dc] text-[#15221b] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-11 h-11 shrink-0">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className={isOriginal ? 'stroke-slate-800' : 'stroke-[#e7e4dc]'}
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className={isOriginal ? 'stroke-cyan-400' : 'stroke-[#2d5a43]'}
                  strokeWidth="3.5"
                  strokeDasharray="88"
                  strokeDashoffset="7" // ~92%
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-[11px]">
                92%
              </div>
            </div>

            <div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider block ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Compliance Score
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+4% from last week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block w-64 shrink-0 border-r min-h-screen transition-colors ${
          isOriginal
            ? 'bg-[#090f1f] border-slate-800'
            : 'bg-white border-[#e7e4dc]'
        }`}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div
            className={`relative w-72 max-w-[85%] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 transition-colors ${
              isOriginal
                ? 'bg-[#090f1f] border-r border-slate-800 text-white'
                : 'bg-white border-r border-[#e7e4dc] text-slate-900'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
