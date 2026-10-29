import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  BookmarkPlus,
  Share2,
  Copy,
  Check,
  Clock,
  Cpu,
  Layers,
  FileCheck2,
  BookOpen,
  ArrowRight,
  AlertCircle,
  FileText,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Download,
} from 'lucide-react';
import { BrandAnalysisResult, BrandFinding, BrandSource, ReviewScore } from '../types';
import { useTheme } from '../ThemeContext';

interface AnalysisResultsProps {
  result?: BrandAnalysisResult | null;
  complianceReview?: {
    id: number | string;
    draft: string;
    status: string;
    findings: BrandFinding[];
    score: ReviewScore;
    engine: string;
    llm_used: boolean;
    note: string;
    retrieved_sources?: BrandSource[];
    history?: any[];
  } | null;
  brandName?: string;
  productOrService?: string;
  onSaveToLibrary: () => void;
  isSaved?: boolean;
  onUpdateStatus?: (status: 'Approved' | 'Changes Requested' | 'Pending Review', comment?: string) => Promise<void>;
  onExportMarkdown?: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  complianceReview,
  brandName = 'BrandTrace Workspace',
  productOrService = 'Standard Tier',
  onSaveToLibrary,
  isSaved = false,
  onUpdateStatus,
  onExportMarkdown,
}) => {
  const { isOriginal } = useTheme();

  const [activeTab, setActiveTab] = useState<'findings' | 'recommendations' | 'evidence'>('findings');
  const [expandedItem, setExpandedItem] = useState<string | null>('policy-violation');
  const [selectedModalItem, setSelectedModalItem] = useState<any | null>(null);

  // Compute or extract metrics
  const rawScore = complianceReview?.score?.value ?? result?.sentimentScore;
  const hasScore = typeof rawScore === 'number';
  const scoreValue: number = hasScore ? rawScore : 0;
  const scoreStatus = complianceReview?.status || (hasScore ? (scoreValue >= 80 ? 'Good' : 'Needs Review') : 'Not scored');
  const findingsCount = complianceReview?.findings?.length ?? null;
  const sentiment = result?.sentimentBreakdown;
  const positiveCount: number | null = typeof sentiment?.positive === 'number' ? sentiment.positive : null;
  const neutralCount: number | null = typeof sentiment?.neutral === 'number' ? sentiment.neutral : null;
  const negativeCount: number | null = typeof sentiment?.negative === 'number' ? sentiment.negative : null;

  // No placeholder findings: when a review has none, the list is simply empty.
  type FindingCard = { id: string; title: string; subtitle: string; severity: string; count: string; examples: string[]; recommendation: string };
  const displayFindings: FindingCard[] = [];

  // Map real findings from complianceReview if available
  const activeFindings = complianceReview?.findings && complianceReview.findings.length > 0
    ? complianceReview.findings.map((f: any, idx) => ({
        id: `finding-${idx}`,
        title: f.category || f.title || 'Compliance Notice',
        subtitle: f.explanation || f.description || 'Rule compliance observation',
        severity: f.severity === 'error' || f.severity === 'high' ? 'High' : f.severity === 'warning' || f.severity === 'medium' ? 'Medium' : 'Low',
        count: '1 example',
        examples: [f.quote || f.snippet, f.source?.text ? `Approved Ground Truth: ${f.source.text}` : null].filter(Boolean) as string[],
        recommendation: f.suggestion || f.recommendation || 'Align copy with approved brand guidelines.',
      }))
    : displayFindings;

  const handleDownloadReport = () => {
    if (onExportMarkdown) {
      onExportMarkdown();
      return;
    }
    const reportData = {
      brand: brandName,
      score: scoreValue,
      timestamp: new Date().toISOString(),
      findings: activeFindings,
      complianceReview,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `brandtrace-audit-report-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top URL Bar with Timestamp & Download Button matching Mockup */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          isOriginal
            ? 'bg-[#0f172a]/70 border-slate-800'
            : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* URL Pill */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isOriginal
                ? 'bg-slate-900 border-slate-700 text-cyan-300'
                : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>www.example.com</span>
          </div>

          {/* Timestamp */}
          <span
            className={`text-xs ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Apr 28, 2025 • 2:34 PM
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveToLibrary}
            disabled={isSaved}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isSaved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600'
                : isOriginal
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-white border-[#e7e4dc] text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isOriginal
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:brightness-110'
                : 'bg-[#2d5a43] text-white hover:bg-[#234735]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Top Metric Bar matching Bottom-Left Mockup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Compliance Score */}
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className={isOriginal ? 'text-slate-800' : 'text-[#f0eee6]'}
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isOriginal ? 'text-cyan-400' : 'text-[#2d5a43]'}
                strokeDasharray={`${scoreValue}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-xs font-bold ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                {hasScore ? `${scoreValue}%` : 'n/a'}
              </span>
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
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span
                className={`text-xs font-bold ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                {scoreStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Mentions */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider block ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Findings
          </span>
          <div
            className={`text-xl font-bold mt-1 tracking-tight ${
              isOriginal ? 'text-white' : 'text-[#15221b]'
            }`}
          >
            {findingsCount === null ? '—' : findingsCount.toLocaleString()}
          </div>
        </div>

        {/* Metric 3: Positive */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider block ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Positive
          </span>
          <div
            className={`text-xl font-bold mt-1 tracking-tight text-emerald-600`}
          >
            {positiveCount === null ? '—' : positiveCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">89%</span>
        </div>

        {/* Metric 4: Neutral */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider block ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Neutral
          </span>
          <div
            className={`text-xl font-bold mt-1 tracking-tight text-amber-500`}
          >
            {neutralCount ?? '—'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">8%</span>
        </div>

        {/* Metric 5: Negative */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider block ${
              isOriginal ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Negative
          </span>
          <div
            className={`text-xl font-bold mt-1 tracking-tight text-red-500`}
          >
            {negativeCount ?? '—'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">3%</span>
        </div>
      </div>

      {/* Tabs: Findings / Recommendations / Evidence matching mockup */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border ${
          isOriginal
            ? 'bg-[#0f172a]/70 border-slate-800'
            : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-6 border-b pb-3 mb-5 border-slate-200 dark:border-slate-800">
          {(['findings', 'recommendations', 'evidence'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs sm:text-sm font-semibold capitalize relative transition-colors ${
                activeTab === tab
                  ? isOriginal
                    ? 'text-cyan-400'
                    : 'text-[#2d5a43]'
                  : isOriginal
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div
                  className={`absolute -bottom-3.5 left-0 right-0 h-0.5 rounded-full ${
                    isOriginal ? 'bg-cyan-400' : 'bg-[#2d5a43]'
                  }`}
                />
              )}
            </button>
          ))}
        </div>

        {/* Findings Tab Content */}
        {activeTab === 'findings' && (
          <div className="space-y-3">
            {activeFindings.map((item) => {
              const isHigh = item.severity === 'High';
              const isMed = item.severity === 'Medium';
              const isLow = item.severity === 'Low';
              const isExpanded = expandedItem === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isOriginal
                      ? 'bg-slate-900/50 border-slate-800'
                      : 'bg-[#faf9f5] border-[#e7e4dc]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Severity indicator badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                          isHigh
                            ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                            : isMed
                            ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        }`}
                      >
                        {item.severity}
                      </span>

                      <div>
                        <h4
                          className={`text-xs sm:text-sm font-bold tracking-tight ${
                            isOriginal ? 'text-white' : 'text-[#15221b]'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <p
                          className={`text-xs mt-0.5 ${
                            isOriginal ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className={`text-xs font-medium flex items-center gap-1 ${
                          isOriginal ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <span>{item.count}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedModalItem(item)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                          isOriginal
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-[#e7e4dc] shadow-xs'
                        }`}
                      >
                        View
                      </button>
                    </div>
                  </div>

                  {/* Expandable Examples */}
                  {isExpanded && (
                    <div
                      className={`mt-3.5 pt-3 border-t text-xs space-y-2 ${
                        isOriginal ? 'border-slate-800 text-slate-300' : 'border-[#e7e4dc] text-slate-600'
                      }`}
                    >
                      {item.examples.map((ex, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          <p className="leading-relaxed font-mono text-[11px]">{ex}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Recommendations Tab Content */}
        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {activeFindings.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isOriginal ? 'bg-slate-900/50 border-slate-800' : 'bg-[#faf9f5] border-[#e7e4dc]'
                }`}
              >
                <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${isOriginal ? 'text-cyan-400' : 'text-[#2d5a43]'}`} />
                <div>
                  <h5 className={`text-xs font-bold ${isOriginal ? 'text-white' : 'text-[#15221b]'}`}>
                    For: {item.title}
                  </h5>
                  <p className={`text-xs mt-1 ${isOriginal ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Evidence Tab Content */}
        {activeTab === 'evidence' && (
          <div
            className={`p-4 rounded-xl border font-mono text-xs overflow-x-auto ${
              isOriginal ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-[#faf9f5] text-slate-700 border-[#e7e4dc]'
            }`}
          >
            <p className="font-sans font-semibold mb-2">Audited Draft & Ground Truth Matches:</p>
            <pre className="whitespace-pre-wrap leading-relaxed">
              {complianceReview?.draft || 'BrandTrace Workspace compliance analysis record.'}
            </pre>
          </div>
        )}
      </div>

      {/* Modal for View button inspection */}
      {selectedModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl ${
              isOriginal ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedModalItem.severity === 'High'
                      ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                      : selectedModalItem.severity === 'Medium'
                      ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                  }`}
                >
                  {selectedModalItem.severity}
                </span>
                <h3 className="text-base font-bold">{selectedModalItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {selectedModalItem.subtitle}
            </p>

            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Identified Instances & Context
              </h4>
              {selectedModalItem.examples.map((ex: string, i: number) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${
                    isOriginal ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-800'
                  }`}
                >
                  {ex}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedModalItem(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isOriginal ? 'bg-cyan-500 text-white' : 'bg-[#2d5a43] text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
