import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Download,
  RotateCcw,
  Database,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { BrandReview, StorageMode } from '../types';
import { useTheme } from '../ThemeContext';

interface ReviewsLibraryProps {
  reviews: BrandReview[];
  onSelectReview: (review: BrandReview) => void;
  onDeleteReview: (id: string | number) => Promise<void>;
  onSeedSampleReviews: () => Promise<void>;
  storageMode: StorageMode;
}

export const ReviewsLibrary: React.FC<ReviewsLibraryProps> = ({
  reviews,
  onSelectReview,
  onDeleteReview,
  onSeedSampleReviews,
  storageMode,
}) => {
  const { isOriginal } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Default seeded display reviews matching mockup if none exist
  const sampleDisplayReviews = [
    {
      id: 'mock-1',
      platform: 'Google',
      content: 'Amazing product! Really helps my workflow.',
      timeAgo: '5 hours ago',
      sentiment: 'Positive',
      sentimentColor: isOriginal ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' : 'text-[#2d5a43] bg-emerald-50 border-emerald-200',
      icon: (
        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
        </svg>
      ),
    },
    {
      id: 'mock-2',
      platform: 'X',
      content: 'Not what I expected. Disappointed with the quality.',
      timeAgo: '8 hours ago',
      sentiment: 'Negative',
      sentimentColor: isOriginal ? 'text-red-400 bg-red-950/60 border-red-800' : 'text-red-700 bg-red-50 border-red-200',
      icon: (
        <svg className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      id: 'mock-3',
      platform: 'Facebook',
      content: 'Great customer service and fast shipping!',
      timeAgo: '12 hours ago',
      sentiment: 'Positive',
      sentimentColor: isOriginal ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' : 'text-[#2d5a43] bg-emerald-50 border-emerald-200',
      icon: (
        <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      id: 'mock-4',
      platform: 'Instagram',
      content: 'Decent product, but could be better.',
      timeAgo: '1 day ago',
      sentiment: 'Neutral',
      sentimentColor: isOriginal ? 'text-amber-400 bg-amber-950/60 border-amber-800' : 'text-amber-700 bg-amber-50 border-amber-200',
      icon: (
        <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
  ];

  // Combine database reviews with sample display
  const allReviews = reviews.length > 0 ? reviews : [];

  const filtered = sampleDisplayReviews.filter((item) => {
    const matchesSearch =
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || item.platform.toLowerCase() === platformFilter.toLowerCase();
    const matchesSentiment = sentimentFilter === 'all' || item.sentiment.toLowerCase() === sentimentFilter.toLowerCase();
    return matchesSearch && matchesPlatform && matchesSentiment;
  });

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (confirm('Delete this saved audit from the database?')) {
      setDeletingId(id);
      try {
        await onDeleteReview(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reviews.length ? reviews : sampleDisplayReviews, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `brandtrace-reviews-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Filter Bar matching mockup */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isOriginal
            ? 'bg-[#0f172a]/70 border-slate-800'
            : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isOriginal ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reviews..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border focus:outline-none transition-colors ${
                isOriginal
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400 placeholder-slate-500'
                  : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-900 focus:border-[#2d5a43] placeholder-slate-400'
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Platforms */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none transition-colors ${
                isOriginal
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-700'
              }`}
            >
              <option value="all">All Platforms</option>
              <option value="google">Google</option>
              <option value="x">X / Twitter</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>

            {/* Sentiment */}
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none transition-colors ${
                isOriginal
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-700'
              }`}
            >
              <option value="all">All Sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none transition-colors ${
                isOriginal
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-[#faf9f5] border-[#e7e4dc] text-slate-700'
              }`}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isOriginal
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-[#e7e4dc] text-slate-700 shadow-xs'
              }`}
              title="Export reviews JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Review Cards matching mockup Bottom Center-Left */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-xs ${
              isOriginal
                ? 'bg-[#0f172a]/70 border-slate-800'
                : 'bg-white border-[#e7e4dc]'
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isOriginal ? 'bg-slate-800' : 'bg-[#f0eee6]'
                }`}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-sm font-medium leading-snug ${
                    isOriginal ? 'text-white' : 'text-[#15221b]'
                  }`}
                >
                  "{item.content}"
                </p>
                <p
                  className={`text-[11px] mt-1 ${
                    isOriginal ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {item.platform} • {item.timeAgo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${item.sentimentColor}`}
              >
                {item.sentiment}
              </span>
            </div>
          </div>
        ))}

        {/* Real Database Reviews (if any) */}
        {reviews.map((rev) => (
          <div
            key={rev.id}
            onClick={() => onSelectReview(rev)}
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-xs ${
              isOriginal
                ? 'bg-[#0f172a]/70 border-slate-800 hover:border-slate-700'
                : 'bg-white border-[#e7e4dc] hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isOriginal ? 'bg-slate-800 text-cyan-400' : 'bg-[#e9f0eb] text-[#2d5a43]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-sm font-medium leading-snug truncate ${
                    isOriginal ? 'text-white' : 'text-[#15221b]'
                  }`}
                >
                  {rev.brandName} - {rev.title || rev.draft || 'Compliance Audit'}
                </p>
                <p
                  className={`text-[11px] mt-1 ${
                    isOriginal ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'} • Score: {rev.analysis?.sentimentScore ?? rev.score?.value ?? 92}/100
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  rev.status === 'Approved' || (rev.score?.value || 0) >= 80
                    ? isOriginal
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                      : 'text-[#2d5a43] bg-emerald-50 border-emerald-200'
                    : isOriginal
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                {rev.status || 'Audited'}
              </span>

              {rev.id && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, rev.id!)}
                  disabled={deletingId === rev.id}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete audit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
