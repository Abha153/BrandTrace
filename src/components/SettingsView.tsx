import React, { useState, useEffect } from 'react';
import {
  Check,
  Cpu,
  Database,
  HardDrive,
  Key,
  Save,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Layers,
  Settings,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { BrandTraceConfig, LLMProvider, StorageMode } from '../types';

interface SettingsViewProps {
  config: BrandTraceConfig | null;
  onSaveConfig: (updated: any) => Promise<boolean>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
}) => {
  const { theme, setTheme, isOriginal } = useTheme();

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'integrations'>('appearance');

  // Form states
  const [provider, setProvider] = useState<LLMProvider>('openai_compatible');
  const [model, setModel] = useState<string>('gemini-3.8-flash');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('https://generativelanguage.googleapis.com/v1beta/openai/');
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [brandtraceDb, setBrandtraceDb] = useState<string>('backend/brandtrace.db');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.llm_provider || 'openai_compatible');
      setModel(config.llm_model || 'gemini-3.8-flash');
      setBaseUrl(
        config.llm_base_url ||
          (config.llm_provider === 'openai_compatible'
            ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
            : '')
      );
      setStorageMode(config.storage_mode || 'local');
      setBrandtraceDb(config.brandtrace_db || 'backend/brandtrace.db');
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload: any = {
        llm_provider: provider,
        llm_model: model,
        llm_base_url: baseUrl,
        storage_mode: storageMode,
        brandtrace_db: brandtraceDb,
      };

      if (apiKey.trim()) {
        payload.llm_api_key = apiKey.trim();
      }

      const ok = await onSaveConfig(payload);
      if (ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Tabs matching mockup */}
      <div
        className={`p-1.5 rounded-2xl border inline-flex ${
          isOriginal ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        {(['general', 'appearance', 'integrations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? isOriginal
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-[#2d5a43] text-white shadow-xs'
                : isOriginal
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Settings Card */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border space-y-8 ${
          isOriginal
            ? 'bg-[#0f172a]/70 border-slate-800'
            : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        {/* Theme Selection Section matching Mockup */}
        {(activeTab === 'appearance' || activeTab === 'general') && (
          <div className="space-y-4">
            <div>
              <h3
                className={`text-base font-bold tracking-tight ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                Theme
              </h3>
              <p
                className={`text-xs mt-0.5 ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Choose your preferred theme.
              </p>
            </div>

            {/* 2 Theme Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              {/* Light Theme Card */}
              <div
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  theme === 'light'
                    ? 'border-[#2d5a43] ring-2 ring-[#2d5a43]/20 shadow-md bg-[#faf9f5]'
                    : isOriginal
                    ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-[#e7e4dc] hover:border-slate-300'
                }`}
              >
                {/* Mini UI Representation */}
                <div className="rounded-xl border border-slate-200 bg-[#f9f8f5] p-2.5 space-y-2 mb-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2d5a43]" />
                      <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="w-4 h-1.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-6 rounded bg-white border border-slate-200/60 p-1">
                      <div className="w-3 h-1 bg-[#2d5a43] rounded" />
                    </div>
                    <div className="h-6 rounded bg-white border border-slate-200/60 p-1">
                      <div className="w-3 h-1 bg-amber-400 rounded" />
                    </div>
                    <div className="h-6 rounded bg-white border border-slate-200/60 p-1">
                      <div className="w-3 h-1 bg-red-400 rounded" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isOriginal ? 'text-white' : 'text-[#15221b]'
                      }`}
                    >
                      Light
                    </h4>
                    <p className="text-[11px] text-slate-400">Clean & bright</p>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      theme === 'light'
                        ? 'border-[#2d5a43] bg-[#2d5a43] text-white'
                        : 'border-slate-400'
                    }`}
                  >
                    {theme === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Original Theme Card */}
              <div
                onClick={() => setTheme('original')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  theme === 'original'
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md bg-slate-900'
                    : isOriginal
                    ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-[#e7e4dc] hover:border-slate-300'
                }`}
              >
                {/* Mini UI Representation */}
                <div className="rounded-xl border border-slate-800 bg-[#020617] p-2.5 space-y-2 mb-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <div className="w-10 h-1.5 rounded-full bg-slate-700" />
                    </div>
                    <div className="w-4 h-1.5 rounded-full bg-slate-800" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-6 rounded bg-slate-900 border border-slate-800 p-1">
                      <div className="w-3 h-1 bg-cyan-400 rounded" />
                    </div>
                    <div className="h-6 rounded bg-slate-900 border border-slate-800 p-1">
                      <div className="w-3 h-1 bg-indigo-400 rounded" />
                    </div>
                    <div className="h-6 rounded bg-slate-900 border border-slate-800 p-1">
                      <div className="w-3 h-1 bg-red-400 rounded" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isOriginal ? 'text-white' : 'text-[#15221b]'
                      }`}
                    >
                      Original
                    </h4>
                    <p className="text-[11px] text-slate-400">Dark & bold</p>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      theme === 'original'
                        ? 'border-cyan-400 bg-cyan-400 text-slate-900'
                        : 'border-slate-500'
                    }`}
                  >
                    {theme === 'original' && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Configuration Section matching Mockup */}
        <form onSubmit={handleSave} className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <h3
              className={`text-base font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              AI Configuration
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Configure LLM provider and inference endpoints for brand intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {/* LLM Provider */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isOriginal ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                LLM Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as LLMProvider)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none transition-colors ${
                  isOriginal
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                    : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-900 focus:border-[#2d5a43]'
                }`}
              >
                <option value="openai_compatible">OpenAI Compatible (Gemini / Groq / Ollama)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="none">None (Deterministic Heuristic Engine)</option>
              </select>
            </div>

            {/* Model */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isOriginal ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gemini-3.8-flash"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none transition-colors ${
                  isOriginal
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                    : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-900 focus:border-[#2d5a43]'
                }`}
              />
            </div>
          </div>

          {/* Base URL */}
          <div className="max-w-2xl">
            <label
              className={`block text-xs font-semibold mb-1.5 ${
                isOriginal ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Endpoint Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border focus:outline-none transition-colors ${
                isOriginal
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                  : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-900 focus:border-[#2d5a43]'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
                saving
                  ? 'opacity-60 cursor-not-allowed bg-slate-400 text-white'
                  : isOriginal
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:brightness-110'
                  : 'bg-[#2d5a43] text-white hover:bg-[#234735]'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>

            {savedSuccess && (
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
