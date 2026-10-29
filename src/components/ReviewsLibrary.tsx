import React, { useMemo, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { BrandReview } from '../types';

type StorageMode = string;
interface ReviewsLibraryProps {
  reviews: BrandReview[];
  onSelectReview: (review: BrandReview) => void;
  onDeleteReview: (id: string | number) => Promise<void>;
  onSeedSampleReviews?: () => Promise<void>; // sample reviews were removed; kept so existing callers still compile
  storageMode: StorageMode;
}

const STATUSES = ['all', 'Pending Review', 'Changes Requested', 'Approved'];

/** Lists the reviews actually saved in this workspace. There is no placeholder data. */
export const ReviewsLibrary: React.FC<ReviewsLibraryProps> = ({ reviews, onSelectReview, onDeleteReview, storageMode }) => {
  const { isOriginal } = useTheme();
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [deleting, setDeleting] = useState<string | number | null>(null);

  const text = (r: BrandReview) => r.draft || r.title || r.content || '';
  const filtered = useMemo(
    () => reviews.filter((r) => (status === 'all' || r.status === status) && text(r).toLowerCase().includes(term.toLowerCase())),
    [reviews, term, status],
  );

  const card = isOriginal ? 'bg-[#0f172a]/70 border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-[#15221b]';
  const muted = isOriginal ? 'text-slate-400' : 'text-slate-500';
  const field = isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#e7e4dc]';

  const remove = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (!confirm('Delete this saved review?')) return;
    setDeleting(id);
    try { await onDeleteReview(id); } finally { setDeleting(null); }
  };
  const exportJson = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reviews, null, 2));
    a.download = `brandtrace-reviews-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Saved reviews</h1>
          <p className={`text-sm ${muted}`}>{reviews.length} saved in this workspace.</p>
        </div>
        <button onClick={exportJson} disabled={!reviews.length} className={`inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border disabled:opacity-50 ${card}`}>
          <Download className="w-4 h-4" /> Export JSON
        </button>
      </div>

      {storageMode === 'ephemeral' && (
        <p className={`text-sm p-3 rounded-xl border ${isOriginal ? 'border-amber-800 bg-amber-950/30 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          This server uses temporary storage: saved reviews are lost when it restarts or spins down. Export anything you need to keep.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Search reviews</span>
          <Search className={`absolute left-3 top-3.5 w-4 h-4 ${muted}`} />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search drafts" className={`w-full min-h-[44px] pl-9 pr-3 rounded-xl border ${field}`} />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`w-full sm:w-auto min-h-[44px] px-3 rounded-xl border ${field}`}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
          </select>
        </label>
      </div>

      {reviews.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center ${card}`}>
          <h2 className="font-semibold">No saved reviews yet</h2>
          <p className={`text-sm mt-1 ${muted}`}>Reviews you run in Audit Studio are saved here automatically.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className={`text-sm ${muted}`}>No reviews match your search or filter.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <div role="button" tabIndex={0} onClick={() => onSelectReview(r)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectReview(r)}
                className={`p-4 rounded-2xl border cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d5a43] ${card}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm break-words min-w-0">{text(r).slice(0, 160) || `Review ${r.id}`}</p>
                  <button aria-label="Delete review" onClick={(e) => remove(e, r.id)} disabled={deleting === r.id} className="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className={`text-xs mt-2 ${muted}`}>
                  {r.status || 'Saved'} · {r.findings ? `${r.findings.length} finding(s)` : 'AI brand audit'}
                  {typeof r.score?.value === 'number' ? ` · score ${r.score.value}/100` : ''}
                  {(r.created_at || r.createdAt) ? ` · ${new Date((r.created_at || r.createdAt) as string).toLocaleString()}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
