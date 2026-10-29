import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  ArrowRight,
  TrendingUp,
  Cpu,
  BarChart2,
  FileText,
  Users,
  Play,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../ThemeContext';
import { ScreenId } from './Sidebar';
import { BrandTraceLogo } from './BrandTraceLogo';

interface LandingPageProps {
  onNavigate: (screen: ScreenId) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { isOriginal } = useTheme();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isOriginal ? 'bg-[#020617] text-slate-100' : 'bg-[#f9f8f5] text-[#15221b]'
      }`}
    >
      {/* Landing Navbar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isOriginal
            ? 'bg-[#020617]/90 border-slate-800'
            : 'bg-[#f9f8f5]/90 border-[#e7e4dc]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <BrandTraceLogo size="sm" showText={true} />
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold">
            <button
              onClick={() => onNavigate('landing')}
              className={isOriginal ? 'text-white font-bold' : 'text-[#15221b] font-bold'}
            >
              Home
            </button>
            <a
              href="#features"
              className={isOriginal ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-[#15221b]'}
            >
              Features
            </a>
            <a
              href="#pricing"
              className={isOriginal ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-[#15221b]'}
            >
              Pricing
            </a>
            <button
              onClick={() => onNavigate('dashboard')}
              className={isOriginal ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-[#15221b]'}
            >
              Dashboard
            </button>
          </nav>

          {/* Right: Theme Toggle & Get Started CTA */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs active:scale-95 ${
                isOriginal
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95'
                  : 'bg-[#2d5a43] hover:bg-[#224734]'
              }`}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
                Protect Your Brand.{' '}
                <span
                  className={
                    isOriginal
                      ? 'bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent block'
                      : 'text-[#2d5a43] block'
                  }
                >
                  Stay Compliant.
                </span>
              </h1>

              <p
                className={`text-base sm:text-lg leading-relaxed max-w-xl ${
                  isOriginal ? 'text-slate-300' : 'text-[#3e4c43]'
                }`}
              >
                AI-powered brand compliance analysis for safer, stronger and more trusted brands.
                Spot policy violations, pricing contradictions, and tone discrepancies instantly.
              </p>

              {/* Three Checkmarks (exact from mockup!) */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isOriginal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Monitor Reviews</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isOriginal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Detect Risks</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isOriginal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Get Actionable Insights</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('studio')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95 ${
                    isOriginal
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 shadow-indigo-500/20'
                      : 'bg-[#2d5a43] hover:bg-[#224734] shadow-[#2d5a43]/20'
                  }`}
                >
                  <span>Start Free Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    isOriginal
                      ? 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                      : 'border-[#e7e4dc] bg-white text-[#15221b] hover:bg-[#f3f1eb] shadow-xs'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Visual Card (exact match to mockup!) */}
            <div className="lg:col-span-5 relative">
              <div
                className={`p-6 rounded-3xl border shadow-xl transition-all ${
                  isOriginal
                    ? 'bg-[#0f172a] border-slate-800 text-white shadow-cyan-950/20'
                    : 'bg-white border-[#e7e4dc] text-[#15221b] shadow-2xl shadow-[#2d5a43]/5'
                }`}
              >
                {/* Top of Card: Score & Wave */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {/* 92% Progress Ring */}
                    <div className="relative w-16 h-16 shrink-0">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          className={isOriginal ? 'stroke-slate-800' : 'stroke-[#f3f1eb]'}
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
                          strokeDashoffset="7"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-extrabold text-sm">
                        92%
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Compliance Score
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-cyan-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Illustrative example
                      </span>
                    </div>
                  </div>

                  {/* Wave Graph preview */}
                  <div className="h-14 flex items-end">
                    <svg className="w-full h-12 overflow-visible" viewBox="0 0 120 40">
                      <path
                        d="M 0 30 Q 30 10 60 25 T 120 15"
                        fill="none"
                        className={isOriginal ? 'stroke-cyan-400' : 'stroke-[#2d5a43]'}
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>

                {/* Bottom of Card: Recent Findings List (matches mockup) */}
                <div className="pt-4 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Example findings (illustration, not live data)
                  </span>

                  {/* Finding 1: High */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isOriginal ? 'bg-[#080d1a] border-slate-800' : 'bg-[#fcfbf9] border-[#e7e4dc]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-semibold">Possible policy violation</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      High
                    </span>
                  </div>

                  {/* Finding 2: Medium */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isOriginal ? 'bg-[#080d1a] border-slate-800' : 'bg-[#fcfbf9] border-[#e7e4dc]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-semibold">Inappropriate content</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Medium
                    </span>
                  </div>

                  {/* Finding 3: Low */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isOriginal ? 'bg-[#080d1a] border-slate-800' : 'bg-[#fcfbf9] border-[#e7e4dc]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-semibold">Brand mention (positive)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Low
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars (exact mockup match!) */}
      <section
        id="features"
        className={`py-12 border-y transition-colors ${
          isOriginal ? 'bg-[#090f1f]/50 border-slate-800' : 'bg-white border-[#e7e4dc]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="space-y-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isOriginal ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'bg-[#2d5a43]/10 text-[#2d5a43]'
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm tracking-tight">AI Analysis</h3>
              <p className={`text-xs leading-relaxed ${isOriginal ? 'text-slate-400' : 'text-slate-600'}`}>
                Advanced AI spots risks, sentiment and policy issues instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isOriginal ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/60' : 'bg-[#2d5a43]/10 text-[#2d5a43]'
                }`}
              >
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm tracking-tight">Real-time Monitoring</h3>
              <p className={`text-xs leading-relaxed ${isOriginal ? 'text-slate-400' : 'text-slate-600'}`}>
                Track your brand across reviews, social media and more.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isOriginal ? 'bg-purple-950 text-purple-400 border border-purple-800/60' : 'bg-[#2d5a43]/10 text-[#2d5a43]'
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm tracking-tight">Detailed Reports</h3>
              <p className={`text-xs leading-relaxed ${isOriginal ? 'text-slate-400' : 'text-slate-600'}`}>
                Clear insights with actionable recommendations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="space-y-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isOriginal ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-[#2d5a43]/10 text-[#2d5a43]'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm tracking-tight">Built for Teams</h3>
              <p className={`text-xs leading-relaxed ${isOriginal ? 'text-slate-400' : 'text-slate-600'}`}>
                Collaborate and manage brand safety together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner (exact mockup match!) */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div
            className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
              isOriginal ? 'bg-indigo-600/20 text-cyan-400' : 'bg-[#2d5a43]/10 text-[#2d5a43]'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your brand deserves better protection.
          </h2>

          <p
            className={`text-sm max-w-lg mx-auto ${
              isOriginal ? 'text-slate-400' : 'text-[#3e4c43]'
            }`}
          >
            BrandTrace combines the power of AI with real-time insights to keep your brand safe,
            compliant and trusted.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className={`px-7 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95 ${
                isOriginal
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95'
                  : 'bg-[#2d5a43] hover:bg-[#224734]'
              }`}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isOriginal ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">BrandTrace Platform Tour</h3>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              BrandTrace scans marketing drafts and customer reviews against 5 approved company guidelines
              (Pricing, Naming, Voice, Claims Register, Terminology) using Google Gemini 3.8 Flash via OpenAI-compatible endpoints.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDemoModalOpen(false);
                  onNavigate('studio');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2d5a43] text-white"
              >
                Open Audit Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
