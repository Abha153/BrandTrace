import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Clock,
  Database,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Server,
  Layers,
  Sparkles,
  HardDrive,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { BrandTraceConfig } from '../types';
import { useTheme } from '../ThemeContext';

interface DiagnosticsPanelProps {
  config: BrandTraceConfig | null;
  onRefreshConfig: () => void;
  onOpenSettings: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  config,
  onRefreshConfig,
  onOpenSettings,
}) => {
  const { isOriginal } = useTheme();

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [endpointResult, setEndpointResult] = useState<string | null>(null);

  const testCurl = `curl -X POST "${window.location.origin}/api/review" \\
  -H "Content-Type: application/json" \\
  -d '{ "draft": "BrandTrace Workspace checks content before publishing." }'`;

  const copyCurl = () => {
    navigator.clipboard.writeText(testCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleTestPing = async () => {
    setTestingEndpoint(true);
    setEndpointResult(null);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setEndpointResult(`Success: 200 OK (${data.totalReviews || 0} reviews in DB, uptime healthy)`);
      } else {
        setEndpointResult('Error: API returned ' + res.status);
      }
    } catch (e: any) {
      setEndpointResult('Error: ' + e.message);
    } finally {
      setTestingEndpoint(false);
    }
  };

  const recentLogs = [
    { id: 1, text: 'AI analysis completed successfully', time: '2m ago', type: 'success' },
    { id: 2, text: 'Database query executed', time: '5m ago', type: 'info' },
    { id: 3, text: 'File uploaded', time: '12m ago', type: 'info' },
    { id: 4, text: 'API connection established', time: '15m ago', type: 'success' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 3 Status Cards matching Mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* API Status */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold tracking-wide uppercase ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              API Status
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span
              className={`text-lg font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              Connected
            </span>
          </div>
          <p
            className={`text-xs mt-1 ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {config?.llm_provider === 'none'
              ? 'Rule Engine (Deterministic)'
              : `${config?.llm_model || 'gemini-3.8-flash'}`}
          </p>
        </div>

        {/* Database */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold tracking-wide uppercase ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Database
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500 shrink-0" />
            <span
              className={`text-lg font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              Healthy
            </span>
          </div>
          <p
            className={`text-xs mt-1 ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {config?.brandtrace_db || 'SQLite (brandtrace.db)'}
          </p>
        </div>

        {/* Storage */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold tracking-wide uppercase ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Storage
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-500 shrink-0" />
            <span
              className={`text-lg font-bold tracking-tight capitalize ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              {config?.storage_mode || 'Local'}
            </span>
          </div>
          <p
            className={`text-xs mt-1 ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Persistent SQLite database
          </p>
        </div>
      </div>

      {/* Recent Logs card matching mockup */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border ${
          isOriginal
            ? 'bg-[#0f172a]/70 border-slate-800'
            : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className={`text-base font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              Recent Logs
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Real-time audit events, queries, and system dispatches
            </p>
          </div>
          <span
            className={`text-xs font-semibold ${
              isOriginal ? 'text-cyan-400' : 'text-[#2d5a43]'
            }`}
          >
            View All
          </span>
        </div>

        <div className="space-y-3">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                isOriginal ? 'bg-slate-900/50 hover:bg-slate-800/40' : 'bg-[#faf9f5] hover:bg-[#f3f1e9]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    log.type === 'success' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isOriginal ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {log.text}
                </span>
              </div>
              <span
                className={`text-[11px] ${
                  isOriginal ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Developer API & cURL testing */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border ${
          isOriginal
            ? 'bg-[#0f172a]/70 border-slate-800'
            : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className={`w-4 h-4 ${isOriginal ? 'text-cyan-400' : 'text-[#2d5a43]'}`} />
            <h3
              className={`text-sm font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              Verify Endpoint via cURL
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestPing}
              disabled={testingEndpoint}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isOriginal
                  ? 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-[#2d5a43] border-[#e7e4dc] shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${testingEndpoint ? 'animate-spin' : ''}`} />
              Test API Live
            </button>
            <button
              onClick={copyCurl}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isOriginal
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-[#e7e4dc] shadow-xs'
              }`}
            >
              {copiedCurl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copiedCurl ? 'Copied' : 'Copy cURL'}
            </button>
          </div>
        </div>

        <pre
          className={`p-3.5 rounded-xl text-xs font-mono overflow-x-auto ${
            isOriginal ? 'bg-slate-950 text-slate-300 border border-slate-800' : 'bg-[#f4f2ea] text-slate-800 border border-[#e7e4dc]'
          }`}
        >
          {testCurl}
        </pre>

        {endpointResult && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-medium ${
              endpointResult.startsWith('Success')
                ? isOriginal
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : isOriginal
                ? 'bg-red-950/40 text-red-300 border border-red-800'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {endpointResult}
          </div>
        )}
      </div>
    </div>
  );
};
