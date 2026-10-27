import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../ThemeContext';
import { ScreenId } from './Sidebar';

interface TopBarProps {
  currentScreen: ScreenId;
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentScreen,
  onOpenMobileSidebar,
}) => {
  const { isOriginal } = useTheme();

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard':
        return {
          title: 'Good morning, Yash',
          subtitle: "Here's what's happening with your brand today.",
        };
      case 'studio':
        return {
          title: 'Audit Studio',
          subtitle: 'Run a comprehensive brand compliance analysis.',
        };
      case 'brandkit':
        return {
          title: 'Brand Kit',
          subtitle: 'Manage brand guidelines, pricing rules, and approved reference sources.',
        };
      case 'results':
        return {
          title: 'Analysis Results',
          subtitle: 'Detailed analysis of your brand compliance audit.',
        };
      case 'library':
        return {
          title: 'Reviews Library',
          subtitle: 'Browse and manage your brand reviews.',
        };
      case 'diagnostics':
        return {
          title: 'Diagnostics',
          subtitle: 'Check system status and troubleshoot issues.',
        };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'Manage your preferences and configuration.',
        };
      default:
        return {
          title: 'BrandTrace Workspace',
          subtitle: 'AI-powered brand safety and intelligence.',
        };
    }
  };

  const { title, subtitle } = getScreenTitle();

  return (
    <div
      className={`px-4 sm:px-8 py-5 border-b transition-colors ${
        isOriginal
          ? 'bg-[#090f1f]/80 border-slate-800 backdrop-blur-md'
          : 'bg-white/80 border-[#e7e4dc] backdrop-blur-md'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Screen Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className={`lg:hidden p-2 rounded-xl border transition-colors ${
              isOriginal
                ? 'bg-slate-900 border-slate-800 text-slate-300'
                : 'bg-white border-[#e7e4dc] text-slate-700 shadow-xs'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1
              className={`text-lg sm:text-xl font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              {title}
            </h1>
            <p
              className={`text-xs mt-0.5 hidden sm:block ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle matching mockup */}
          <ThemeToggle />

          {/* User Profile Avatar with Yash · Pro Plan */}
          <div
            className={`flex items-center gap-2 pl-2 border-l ${
              isOriginal ? 'border-slate-800' : 'border-[#e7e4dc]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#2d5a43] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              Y
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <span
                className={`font-semibold block ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                Yash
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-cyan-400 font-medium">
                Pro Plan
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
