import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  Globe,
  UploadCloud,
  Share2,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileText,
  AlertCircle,
  Lightbulb,
  Check,
  ExternalLink,
} from 'lucide-react';
import { BrandTraceConfig, SourceType } from '../types';
import { useTheme } from '../ThemeContext';

interface AuditStudioProps {
  config: BrandTraceConfig | null;
  onRunAudit: (payload: {
    brandName: string;
    productOrService: string;
    source: SourceType;
    competitors: string[];
    content: string;
  }) => Promise<void>;
  onRunComplianceReview: (draft: string) => Promise<void>;
  isAnalyzing: boolean;
  onOpenSettings: () => void;
}

type SourceCategory = 'url' | 'upload' | 'social' | 'manual';

const SAMPLE_TEMPLATES = [
  {
    id: 'price-violation',
    title: 'Brand Naming & Price Error',
    source: 'marketing_copy' as SourceType,
    url: 'https://brandtrace.io/pricing-update',
    draft: 'Our BrandTrace Suite standard tier is now available at $39/month.',
    desc: 'Violates naming rule ("BrandTrace Suite") and pricing ($49/month).',
  },
  {
    id: 'hype-tone',
    title: 'Hype Words & Tone Violation',
    source: 'marketing_copy' as SourceType,
    url: 'https://brandtrace.io/features/revolutionary',
    draft: 'Meet BrandTrace Workspace: a revolutionary, best-in-class tool. Our standard tier costs $49/month.',
    desc: 'Violates Brand Voice Guide: avoid hype words such as "revolutionary".',
  },
  {
    id: 'clean-draft',
    title: 'Clean Approved Copy',
    source: 'marketing_copy' as SourceType,
    url: 'https://brandtrace.io/compliance-overview',
    draft: 'BrandTrace Workspace checks content against approved company information before publication. A human reviewer makes the final publishing decision.',
    desc: 'Fully compliant draft matching ground-truth company standards.',
  },
];

export const AuditStudio: React.FC<AuditStudioProps> = ({
  config,
  onRunAudit,
  onRunComplianceReview,
  isAnalyzing,
  onOpenSettings,
}) => {
  const { isOriginal } = useTheme();

  // Stepper state (1: Add Source, 2: Configure, 3: Analyze, 4: Results)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected Source Category
  const [selectedSource, setSelectedSource] = useState<SourceCategory>('url');

  // Input fields
  const [urlInput, setUrlInput] = useState<string>('https://example.com');
  const [textInput, setTextInput] = useState<string>(
    'BrandTrace Workspace checks content against approved company information before publication. A human reviewer makes the final publishing decision.'
  );
  const [brandName, setBrandName] = useState<string>('BrandTrace Workspace');
  const [selectedSocial, setSelectedSocial] = useState<'twitter' | 'google' | 'facebook' | 'instagram'>('twitter');

  // Document upload state (Stage 6)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractError(null);

    // Size limit check (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setExtractError('File exceeds 5MB size limit.');
      return;
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'txt' || ext === 'md' || ext === 'csv' || ext === 'json') {
        const text = await file.text();
        setTextInput(text.trim());
        setUploadedFileName(file.name);
      } else if (ext === 'docx' || ext === 'pdf') {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const res = await fetch('/api/extract-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileBase64: base64, filename: file.name }),
            });
            const data = await res.json();
            if (res.ok && data.extractedText) {
              setTextInput(data.extractedText);
              setUploadedFileName(file.name);
            } else {
              setExtractError(data.error || 'Could not extract text from document.');
            }
          } catch (err: any) {
            setExtractError(err.message || 'Failed processing document.');
          }
        };
        reader.readAsDataURL(file);
      } else {
        setExtractError(`Unsupported file format .${ext}. Please upload a .txt, .docx, or text-based .pdf.`);
      }
    } catch (err: any) {
      setExtractError(`Failed reading file: ${err.message}`);
    }
  };

  const sourceCards = [
    {
      id: 'url' as SourceCategory,
      title: 'Website URL',
      subtitle: 'Scan your website',
      icon: Globe,
    },
    {
      id: 'upload' as SourceCategory,
      title: 'Upload File',
      subtitle: 'Upload reviews or data',
      icon: UploadCloud,
    },
    {
      id: 'social' as SourceCategory,
      title: 'Social Media',
      subtitle: 'Connect platforms',
      icon: Share2,
    },
    {
      id: 'manual' as SourceCategory,
      title: 'Manual Input',
      subtitle: 'Paste text content',
      icon: FileEdit,
    },
  ];

  const handleSourceSelect = (id: SourceCategory) => {
    setSelectedSource(id);
  };

  const handleExecute = () => {
    setCurrentStep(3);
    if (selectedSource === 'manual' || selectedSource === 'upload') {
      onRunComplianceReview(textInput.trim() || 'BrandTrace Workspace compliance draft');
    } else if (selectedSource === 'url') {
      // For URL analysis, analyze against compliance guidelines or perception
      onRunComplianceReview(`Auditing URL domain: ${urlInput}. ${textInput}`);
    } else {
      // Social media analysis
      onRunComplianceReview(`Auditing social media channels (${selectedSocial.toUpperCase()}) for ${brandName}. Content: ${textInput}`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 4-Step Stepper matching mockup */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isOriginal
            ? 'bg-[#0f172a]/70 border-slate-800'
            : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between relative">
          {/* Background Connecting Line */}
          <div
            className={`absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 -z-0 ${
              isOriginal ? 'bg-slate-800' : 'bg-[#e7e4dc]'
            }`}
          />

          {/* Steps */}
          {[
            { num: 1, label: 'Add Source' },
            { num: 2, label: 'Configure' },
            { num: 3, label: 'Analyze' },
            { num: 4, label: 'Results' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <div
                key={s.num}
                className="relative z-10 flex flex-col items-center cursor-pointer"
                onClick={() => {
                  if (s.num <= 2 || !isAnalyzing) {
                    setCurrentStep(s.num as any);
                  }
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? isOriginal
                        ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/20'
                        : 'bg-[#2d5a43] text-white ring-4 ring-[#2d5a43]/15'
                      : isDone
                      ? isOriginal
                        ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                        : 'bg-[#f0eee6] text-[#2d5a43] border border-[#2d5a43]/30'
                      : isOriginal
                      ? 'bg-slate-900 text-slate-500 border border-slate-800'
                      : 'bg-white text-slate-400 border border-[#e7e4dc]'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs mt-2 font-medium tracking-tight whitespace-nowrap ${
                    isActive
                      ? isOriginal
                        ? 'text-cyan-400 font-semibold'
                        : 'text-[#2d5a43] font-semibold'
                      : isOriginal
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid: Left Form (Add Source) & Right Sidebar (Quick Tips) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg) */}
        <div
          className={`lg:col-span-2 p-5 sm:p-7 rounded-2xl border space-y-6 ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          {/* Header */}
          <div>
            <h2
              className={`text-lg font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              Add Your Source
            </h2>
            <p
              className={`text-xs mt-1 ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Enter a URL, upload a file, or connect a platform to start the audit.
            </p>
          </div>

          {/* 4 Source Cards matching Mid-Right mockup */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sourceCards.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedSource === sc.id;

              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSourceSelect(sc.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col items-center sm:items-start transition-all ${
                    isSelected
                      ? isOriginal
                        ? 'bg-cyan-950/30 border-cyan-500 shadow-sm'
                        : 'bg-[#f4f7f4] border-[#2d5a43] ring-1 ring-[#2d5a43]/20 shadow-xs'
                      : isOriginal
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-[#e7e4dc] hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                      isSelected
                        ? isOriginal
                          ? 'bg-cyan-500 text-white'
                          : 'bg-[#2d5a43] text-white'
                        : isOriginal
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-[#f0eee6] text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-semibold tracking-tight ${
                      isSelected
                        ? isOriginal
                          ? 'text-white'
                          : 'text-[#15221b]'
                        : isOriginal
                        ? 'text-slate-300'
                        : 'text-slate-700'
                    }`}
                  >
                    {sc.title}
                  </span>
                  <span
                    className={`text-[11px] mt-0.5 text-center sm:text-left ${
                      isOriginal ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {sc.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Input based on Selected Source */}
          <div className="space-y-4 pt-2">
            {selectedSource === 'url' && (
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isOriginal ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Globe className={`w-4 h-4 ${isOriginal ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors ${
                      isOriginal
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                        : 'bg-white border-[#e7e4dc] text-slate-900 focus:border-[#2d5a43]'
                    }`}
                  />
                </div>
              </div>
            )}

            {selectedSource === 'upload' && (
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isOriginal ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Upload Document (.txt, .docx, .pdf, .md)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.docx,.pdf,.md,.csv,.json"
                  className="hidden"
                />
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isOriginal
                      ? 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/40'
                      : 'border-[#e7e4dc] hover:border-[#2d5a43]/50 bg-[#faf9f5]'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-emerald-600 dark:text-cyan-400 mb-2" />
                  <p
                    className={`text-xs font-medium ${
                      isOriginal ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Click to select a file from your computer (.txt, .docx, .pdf)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Safe document extraction (max 5MB). Content is extracted and displayed below before audit.
                  </p>
                </div>

                {uploadedFileName && (
                  <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span className="font-medium">Loaded: {uploadedFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFileName(null);
                        setTextInput('');
                      }}
                      className="text-xs hover:underline text-slate-500"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {extractError && (
                  <div className="mt-2.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                    {extractError}
                  </div>
                )}
              </div>
            )}

            {selectedSource === 'social' && (
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isOriginal ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Select Social Platform
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['twitter', 'google', 'facebook', 'instagram'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSelectedSocial(plat)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        selectedSocial === plat
                          ? isOriginal
                            ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300'
                            : 'bg-emerald-50 border-[#2d5a43] text-[#2d5a43]'
                          : isOriginal
                          ? 'bg-slate-900 border-slate-800 text-slate-400'
                          : 'bg-white border-[#e7e4dc] text-slate-600'
                      }`}
                    >
                      {plat === 'twitter' ? 'X / Twitter' : plat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content / Copy to Audit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold ${
                    isOriginal ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Copy / Draft Content to Verify
                </label>
                <span className="text-[11px] text-slate-400">
                  {textInput.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste marketing copy, press draft, or customer statements here..."
                className={`w-full p-3 rounded-xl text-sm border focus:outline-none transition-colors leading-relaxed ${
                  isOriginal
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                    : 'bg-white border-[#e7e4dc] text-slate-900 focus:border-[#2d5a43]'
                }`}
              />
            </div>

            {/* Quick Test Presets */}
            <div>
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider block mb-2 ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                1-Click Preset Test Drafts:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setTextInput(tmpl.draft);
                      setUrlInput(tmpl.url);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      textInput === tmpl.draft
                        ? isOriginal
                          ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300'
                          : 'bg-emerald-50 border-[#2d5a43] text-[#2d5a43] font-medium'
                        : isOriginal
                        ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-[#e7e4dc] text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div
            className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isOriginal ? 'border-slate-800' : 'border-[#e7e4dc]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Engine: <strong className="font-semibold text-slate-600 dark:text-slate-300">{config?.llm_model || 'gemini-3.8-flash'}</strong>
              </span>
            </div>

            <button
              type="button"
              disabled={isAnalyzing || !textInput.trim()}
              onClick={handleExecute}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                isAnalyzing
                  ? 'opacity-60 cursor-not-allowed bg-slate-400 text-white'
                  : isOriginal
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:brightness-110'
                  : 'bg-[#2d5a43] text-white hover:bg-[#234735]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running AI Audit...
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Quick Tips & Visual Card matching mockup */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div
            className={`p-5 rounded-2xl border ${
              isOriginal
                ? 'bg-[#0f172a]/70 border-slate-800'
                : 'bg-white border-[#e7e4dc] shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className={`w-4 h-4 ${isOriginal ? 'text-cyan-400' : 'text-[#2d5a43]'}`} />
              <h3
                className={`text-xs font-bold uppercase tracking-wider ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                Quick Tips
              </h3>
            </div>

            <ul className="space-y-2.5">
              {[
                'Use official brand channels',
                'Include multiple sources',
                'For best results, use recent data',
              ].map((tip, idx) => (
                <li
                  key={idx}
                  className={`text-xs flex items-center gap-2.5 ${
                    isOriginal ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isOriginal ? 'bg-cyan-400' : 'bg-[#2d5a43]'
                    }`}
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Card: Better data. Stronger insights. */}
          <div
            className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center relative overflow-hidden ${
              isOriginal
                ? 'bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-900 border-slate-800'
                : 'bg-[#faf9f5] border-[#e7e4dc] shadow-xs'
            }`}
          >
            {/* Illustrated graphic badge matching mockup */}
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105 ${
                isOriginal
                  ? 'bg-slate-800/80 text-cyan-400 shadow-md border border-slate-700'
                  : 'bg-[#e9f0eb] text-[#2d5a43] shadow-xs border border-[#d2ded5]'
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <ShieldCheck className="w-9 h-9" />
              </div>
            </div>

            <h4
              className={`text-sm font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              Better data. Stronger insights.
            </h4>
            <p
              className={`text-xs mt-1.5 max-w-xs leading-relaxed ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Connecting direct sources ensures compliance checks match true company policy and eliminate false positives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
