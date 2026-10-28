import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Server,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { BrandTraceConfig, LLMProvider, StorageMode, ConnectionTestResult } from '../types';
import { useTheme } from '../ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BrandTraceConfig | null;
  onSaveConfig: (updated: any) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const { theme, setTheme, isOriginal } = useTheme();

  const [provider, setProvider] = useState<LLMProvider>('openai_compatible');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [model, setModel] = useState<string>('gemini-3.8-flash');
  const [baseUrl, setBaseUrl] = useState<string>('https://generativelanguage.googleapis.com/v1beta/openai/');
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(30);
  const [maxRetries, setMaxRetries] = useState<number>(1);
  const [retryDelay, setRetryDelay] = useState<number>(1);
  const [maxCallsPerHour, setMaxCallsPerHour] = useState<number>(0);
  const [brandtraceDb, setBrandtraceDb] = useState<string>('backend/brandtrace.db');
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);

  // Sync with current config on open
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
      setTimeoutSeconds(config.llm_timeout_seconds ?? 30);
      setMaxRetries(config.llm_max_retries ?? 1);
      setRetryDelay(config.llm_retry_delay_seconds ?? 1);
      setMaxCallsPerHour(config.llm_max_calls_per_hour ?? 0);
      setBrandtraceDb(config.brandtrace_db || 'backend/brandtrace.db');
      setStorageMode(config.storage_mode || 'local');
    }
  }, [config, isOpen]);

  // Model Presets per provider
  const modelPresets: Record<LLMProvider, { label: string; value: string; desc: string }[]> = {
    openai_compatible: [
      {
        label: 'Gemini 3.8 Flash (Google OpenAI Endpoint)',
        value: 'gemini-3.8-flash',
        desc: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      },
      { label: 'GPT-4o (OpenAI)', value: 'gpt-4o', desc: 'Flagship multimodal reasoning' },
      { label: 'GPT-4o mini', value: 'gpt-4o-mini', desc: 'Fast, lightweight and cost-efficient' },
      { label: 'DeepSeek-V3 / Chat', value: 'deepseek-chat', desc: 'OpenAI-compatible DeepSeek API endpoint' },
      { label: 'Llama 3.3 70B (Groq / vLLM)', value: 'llama-3.3-70b-versatile', desc: 'Open weights inference' },
    ],
    anthropic: [
      {
        label: 'Claude 3.5 Sonnet',
        value: 'claude-3-5-sonnet-20241022',
        desc: 'Anthropic Claude reasoning engine',
      },
      { label: 'Claude 3.7 Sonnet', value: 'claude-3-7-sonnet-20250219', desc: 'Cutting-edge reasoning' },
      { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022', desc: 'Fast, cost-effective audits' },
    ],
    gemini: [
      { label: 'Gemini 3.8 Flash (Native GenAI SDK)', value: 'gemini-3.8-flash', desc: 'Native Google GenAI SDK' },
      { label: 'Gemini 4 Argon', value: 'gemini-4-argon', desc: 'Complex reasoning model' },
    ],
    none: [
      { label: 'BrandTrace Heuristic V1', value: 'brandtrace-heuristic-v1', desc: 'Deterministic NLP rule engine (Zero cost)' },
    ],
  };

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setTestResult(null);
    setTestError(null);
    const presets = modelPresets[newProvider];
    if (presets && presets[0]) {
      setModel(presets[0].value);
    }
    if (newProvider === 'anthropic') {
      setBaseUrl('');
    } else if (newProvider === 'openai_compatible') {
      setBaseUrl('https://generativelanguage.googleapis.com/v1beta/openai/');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim() || undefined,
          model,
          baseUrl: baseUrl.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Connection failed');
      }

      setTestResult(data);
    } catch (err: any) {
      setTestError(err.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        llm_provider: provider,
        llm_model: model,
        llm_base_url: baseUrl.trim(),
        llm_timeout_seconds: Number(timeoutSeconds),
        llm_max_retries: Number(maxRetries),
        llm_retry_delay_seconds: Number(retryDelay),
        llm_max_calls_per_hour: Number(maxCallsPerHour),
        brandtrace_db: brandtraceDb.trim(),
        storage_mode: storageMode,
      };

      if (apiKey.trim()) {
        payload.llm_api_key = apiKey.trim();
      }

      const success = await onSaveConfig(payload);
      if (success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const generateEnvSnippet = () => {
    return `# ---- AI analysis (optional) ----
# Supported: none | anthropic | openai_compatible
LLM_PROVIDER=${provider}
LLM_API_KEY=${apiKey ? apiKey : config?.has_api_key ? 'YOUR_EXISTING_KEY' : 'your-api-key-here'}
# Model name is required and is not guessed; use a model id your account can call.
LLM_MODEL=${model}
# Optional. Defaults: anthropic -> https://api.anthropic.com ; openai_compatible -> https://api.openai.com/v1
LLM_BASE_URL=${baseUrl}
LLM_TIMEOUT_SECONDS=${timeoutSeconds}
LLM_MAX_RETRIES=${maxRetries}
LLM_RETRY_DELAY_SECONDS=${retryDelay}
# Cap on AI calls per hour across all visitors (protects your key on a public demo). 0 = unlimited.
LLM_MAX_CALLS_PER_HOUR=${maxCallsPerHour}

# ---- Hosting ----
# SQLite file location. Default: backend/brandtrace.db. On a host use a path on persistent storage.
BRANDTRACE_DB=${brandtraceDb}
# local | ephemeral | persistent. "ephemeral" makes the UI warn that saved reviews are temporary.
STORAGE_MODE=${storageMode}
# Comma-separated exact frontend origins allowed to call the API from a browser (no wildcard).
# Not needed for local development (Vite proxy) .
CORS_ORIGINS=`;
  };

  const copyEnvToClipboard = () => {
    navigator.clipboard.writeText(generateEnvSnippet());
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`rounded-2xl border w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 transition-colors ${
          isOriginal
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isOriginal ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                BrandTrace Settings & LLM Configuration
              </h2>
              <p
                className={`text-xs ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Configure Gemini API, themes, rate limits, and persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isOriginal
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* THEME TOGGLE SELECTOR */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                isOriginal ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Interface Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30'
                    : isOriginal
                    ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      White (Light)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Clean off-white B2B SaaS
                    </span>
                  </div>
                </div>
                {theme === 'light' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTheme('original')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  theme === 'original'
                    ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                    : isOriginal
                    ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-300 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Original (Blue-Black)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Signature dark AI console
                    </span>
                  </div>
                </div>
                {theme === 'original' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Provider Selection Tabs */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                isOriginal ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              LLM Provider (<code>LLM_PROVIDER</code>)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'openai_compatible', label: 'OpenAI Compatible', badge: 'Gemini 3.8 Flash' },
                { id: 'anthropic', label: 'Anthropic Claude', badge: 'Claude 3.5' },
                { id: 'gemini', label: 'Google GenAI SDK', badge: 'Native SDK' },
                { id: 'none', label: 'Simulator / Rules', badge: 'Zero Cost' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleProviderChange(item.id as LLMProvider)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    provider === item.id
                      ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                      : isOriginal
                      ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        provider === item.id
                          ? isOriginal
                            ? 'text-white'
                            : 'text-indigo-900'
                          : isOriginal
                          ? 'text-slate-300'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Provider Context Note */}
            <div
              className={`mt-2.5 text-xs p-3 rounded-xl border ${
                isOriginal
                  ? 'bg-slate-950/80 border-slate-800/80 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {provider === 'openai_compatible' && (
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <span>
                    Configured for <strong>Gemini 3.8 Flash</strong> via Google&apos;s OpenAI-compatible endpoint (
                    <code>https://generativelanguage.googleapis.com/v1beta/openai/</code>). Automatically authenticates with your injected <code>GEMINI_API_KEY</code>.
                  </span>
                </div>
              )}
              {provider === 'anthropic' && (
                <div className="flex items-start gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <span>
                    Anthropic Claude models. Requires an API key from the{' '}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      Anthropic Console <ExternalLink className="w-3 h-3 inline" />
                    </a>
                    .
                  </span>
                </div>
              )}
              {provider === 'gemini' && (
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>Native Google GenAI SDK integration with Gemini 3.8 Flash.</span>
                </div>
              )}
              {provider === 'none' && (
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>Deterministic BrandTrace rule checks and keyword retrieval only.</span>
                </div>
              )}
            </div>
          </div>

          {/* API Key Input */}
          {provider !== 'none' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isOriginal ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  API Key (<code>LLM_API_KEY</code>)
                </label>
                {config?.has_api_key && (
                  <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Key configured on server
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    config?.has_api_key
                      ? `Saved. Leave empty to keep or paste new key.`
                      : 'Enter API key...'
                  }
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 border ${
                    isOriginal
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p
                className={`text-[11px] mt-1 ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Keys are transmitted securely to the server proxy route and never logged or exposed.
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isOriginal ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Model ID (<code>LLM_MODEL</code>)
            </label>
            <div className="space-y-2">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isOriginal
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {modelPresets[provider]?.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label} ({preset.value})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Or specify custom model name (e.g. gemini-3.8-flash)"
                className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isOriginal
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Base URL */}
          {(provider === 'anthropic' || provider === 'openai_compatible') && (
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isOriginal ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Base URL (<code>LLM_BASE_URL</code>)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                className={`w-full rounded-xl px-4 py-2.5 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isOriginal
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          {/* Advanced Accordion */}
          <div
            className={`border rounded-xl overflow-hidden ${
              isOriginal ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold transition-colors ${
                isOriginal
                  ? 'bg-slate-950/60 text-slate-300 hover:text-white'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500" />
                <span>Advanced: Rate Limiter, Timeouts & Hosting Storage</span>
              </div>
              <span className="text-slate-400">{showAdvanced ? '▲ Hide' : '▼ Expand'}</span>
            </button>

            {showAdvanced && (
              <div
                className={`p-4 space-y-4 border-t text-xs ${
                  isOriginal
                    ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">
                      Max Calls Per Hour (<code>LLM_MAX_CALLS_PER_HOUR</code>)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={maxCallsPerHour}
                      onChange={(e) => setMaxCallsPerHour(Number(e.target.value))}
                      className={`w-full rounded-lg px-3 py-2 font-mono border ${
                        isOriginal
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      0 = Unlimited. Protects public instances.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      Timeout Seconds (<code>LLM_TIMEOUT_SECONDS</code>)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={timeoutSeconds}
                      onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                      className={`w-full rounded-lg px-3 py-2 font-mono border ${
                        isOriginal
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block font-semibold mb-1.5 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-500" />
                    Storage Mode (<code>STORAGE_MODE</code>)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['local', 'ephemeral', 'persistent'] as StorageMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setStorageMode(mode)}
                        className={`p-2 rounded-lg border text-center font-medium capitalize transition-all ${
                          storageMode === mode
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isOriginal
                            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{testResult.message}</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Verified Model: <code>{testResult.model}</code> · Latency: {testResult.latencyMs}ms
                </p>
              </div>
            </div>
          )}

          {testError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Connection Check Notice</p>
                <p className="text-[11px] opacity-90 mt-0.5 font-mono">{testError}</p>
              </div>
            </div>
          )}

          {/* .env Generator Box */}
          <div
            className={`p-3.5 rounded-xl border ${
              isOriginal ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                Generated <code>.env</code> Configuration
              </span>
              <button
                type="button"
                onClick={copyEnvToClipboard}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                  isOriginal
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs'
                }`}
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied!' : 'Copy .env'}</span>
              </button>
            </div>
            <pre
              className={`text-[11px] font-mono overflow-x-auto p-2 rounded border max-h-32 ${
                isOriginal
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {generateEnvSnippet()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isOriginal ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 disabled:opacity-50 ${
              isOriginal
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-indigo-500' : ''}`} />
            <span>{testing ? 'Pinging API...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Apply & Save Config'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
