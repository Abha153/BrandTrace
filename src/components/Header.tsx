import React, { useState } from 'react';
import {
  Sliders,
  Database,
  Cpu,
  Menu,
  X,
  FileCheck2,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { BrandTraceConfig } from '../types';
import { useTheme } from '../ThemeContext';

interface HeaderProps {
  config: BrandTraceConfig | null;
  onOpenSettings: () => void;
  activeTab: 'studio' | 'library' | 'diagnostics';
  setActiveTab: (tab: 'studio' | 'library' | 'diagnostics') => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  activeTab,
  setActiveTab,
  savedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme, isOriginal } = useTheme();

  const isKeyActive = config?.has_api_key;
  const modelName = config?.llm_model || 'gemini-3.8-flash';
  const isEphemeral = config?.storage_mode === 'ephemeral';

  const handleNavClick = (tab: 'studio' | 'library' | 'diagnostics') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isOriginal
          ? 'bg-slate-950/85 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('studio')}
              className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 -m-1"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isOriginal
                    ? 'bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                }`}
              >
                {isOriginal ? (
                  <Sparkles className="w-5 h-5 text-cyan-200" />
                ) : (
                  <FileCheck2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold tracking-tight text-base sm:text-lg ${
                      isOriginal ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    BrandTrace
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded font-mono ${
                      isOriginal
                        ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-800/80'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    PRO
                  </span>
                </div>
                <span
                  className={`text-[11px] hidden md:block ${
                    isOriginal ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Brand Compliance & AI Intelligence
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav
            className={`hidden md:flex items-center p-1 rounded-xl border ${
              isOriginal
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-slate-100 border-slate-200/90'
            }`}
          >
            <button
              onClick={() => handleNavClick('studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'studio'
                  ? isOriginal
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isOriginal
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Studio
            </button>
            <button
              onClick={() => handleNavClick('library')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'library'
                  ? isOriginal
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isOriginal
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Library</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  isOriginal
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {savedCount}
              </span>
            </button>
            <button
              onClick={() => handleNavClick('diagnostics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'diagnostics'
                  ? isOriginal
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isOriginal
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diagnostics
            </button>
          </nav>

          {/* Actions & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storage Mode Notice */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                isEphemeral
                  ? isOriginal
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                  : isOriginal
                  ? 'bg-slate-900 text-slate-400 border-slate-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title={
                isEphemeral
                  ? 'Storage mode is ephemeral: saved reviews are kept in RAM.'
                  : `Storage mode: ${config?.storage_mode || 'local'}`
              }
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{config?.storage_mode || 'local'}</span>
            </div>

            {/* Provider Pill (Desktop) */}
            <button
              onClick={onOpenSettings}
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs border transition-colors font-mono ${
                isOriginal
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
              title="Click to change model or provider settings"
            >
              <Cpu
                className={`w-3.5 h-3.5 ${
                  isOriginal ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              />
              <span className="truncate max-w-[130px]">{modelName}</span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isKeyActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </button>

            {/* Theme Toggle Button (Light/White vs Original/Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                isOriginal
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-xs'
              }`}
              aria-label={`Switch theme (currently ${isOriginal ? 'Original Dark' : 'White Light'})`}
              title={`Switch to ${isOriginal ? 'White (Light)' : 'Original (Blue-Black)'} theme`}
            >
              {isOriginal ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Original</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">White</span>
                </>
              )}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                isOriginal
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl border transition-colors ${
                isOriginal
                  ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-900'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-150 ${
              isOriginal ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div
              className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl border ${
                isOriginal
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                onClick={() => handleNavClick('studio')}
                className={`py-2 text-xs font-semibold rounded-lg text-center transition-all ${
                  activeTab === 'studio'
                    ? isOriginal
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isOriginal
                    ? 'text-slate-400'
                    : 'text-slate-600'
                }`}
              >
                Studio
              </button>
              <button
                onClick={() => handleNavClick('library')}
                className={`py-2 text-xs font-semibold rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'library'
                    ? isOriginal
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isOriginal
                    ? 'text-slate-400'
                    : 'text-slate-600'
                }`}
              >
                <span>Library</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isOriginal
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {savedCount}
                </span>
              </button>
              <button
                onClick={() => handleNavClick('diagnostics')}
                className={`py-2 text-xs font-semibold rounded-lg text-center transition-all ${
                  activeTab === 'diagnostics'
                    ? isOriginal
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isOriginal
                    ? 'text-slate-400'
                    : 'text-slate-600'
                }`}
              >
                Diagnostics
              </button>
            </div>

            {/* Mobile Theme Toggle & Status row */}
            <div
              className={`flex items-center justify-between px-2 pt-2 text-xs border-t ${
                isOriginal ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border ${
                    isOriginal
                      ? 'bg-slate-900 text-amber-300 border-slate-800'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {isOriginal ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  <span>Theme: {isOriginal ? 'Original' : 'White'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className={`font-semibold flex items-center gap-1 ${
                  isOriginal ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              >
                <span>Settings</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
