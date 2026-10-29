import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { ScreenId } from './Sidebar';
import { BrandReview } from '../types';

interface DashboardViewProps {
  onNavigate: (screen: ScreenId) => void;
  onQuickAudit: () => void;
  reviews?: BrandReview[];
}

/** Every number on this screen is computed from the reviews saved in the current workspace. Nothing is simulated. */
export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onQuickAudit, reviews = [] }) => {
  const { isOriginal } = useTheme();
  const [expiring, setExpiring] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/sources/expiring').then((r) => (r.ok ? r.json() : { sources: [] })).then((d) => setExpiring(d.sources || [])).catch(() => setExpiring([]));
  }, []);

  const compliance = useMemo(() => reviews.filter((r) => r.findings && r.score), [reviews]);
  const count = (s: string) => compliance.filter((r) => r.status === s).length;
  const findings = compliance.reduce((n, r) => n + (r.findings?.length || 0), 0);
  const scored = compliance.filter((r) => typeof r.score?.value === 'number');
  const avg = scored.length ? Math.round(scored.reduce((n, r) => n + (r.score!.value as number), 0) / scored.length) : null;
  const series = [...scored].reverse().slice(-20).map((r) => r.score!.value as number); // oldest -> newest
  const recent = compliance.slice(0, 5);

  const card = isOriginal ? 'bg-[#0f172a]/70 border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-[#15221b]';
  const muted = isOriginal ? 'text-slate-400' : 'text-slate-500';
  const stat = (label: string, value: React.ReactNode, icon: React.ReactNode, note?: string) => (
    <div className={`p-5 rounded-2xl border ${card}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${muted}`}>{icon}{label}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {note && <p className={`text-xs mt-1 ${muted}`}>{note}</p>}
    </div>
  );

  const W = 560, H = 140, P = 16;
  const pts = series.map((v, i) => [P + (i * (W - 2 * P)) / Math.max(series.length - 1, 1), H - P - (Math.min(Math.max(v, 0), 100) / 100) * (H - 2 * P)]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className={`text-sm ${muted}`}>Based on the reviews saved in this workspace.</p>
        </div>
        <button onClick={onQuickAudit} className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl font-semibold bg-[#2d5a43] text-white hover:opacity-90">
          <Sparkles className="w-4 h-4" /> New review
        </button>
      </div>

      {compliance.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center ${card}`}>
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-[#2d5a43]" />
          <h2 className="text-lg font-semibold">No reviews yet</h2>
          <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
            Paste a draft in Audit Studio to check it against your Brand Kit. Results and statistics will appear here once you have run a review.
          </p>
          <button onClick={onQuickAudit} className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl font-semibold bg-[#2d5a43] text-white">
            Start your first review <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stat('Reviews', compliance.length, <ShieldCheck className="w-4 h-4" />)}
            {stat('Pending', count('Pending Review'), <Clock className="w-4 h-4" />, 'Waiting for a human decision')}
            {stat('Changes requested', count('Changes Requested'), <AlertTriangle className="w-4 h-4" />)}
            {stat('Approved', count('Approved'), <CheckCircle2 className="w-4 h-4" />, 'Approved by a person')}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 p-5 rounded-2xl border ${card}`}>
              <h2 className="font-semibold">Review score over time</h2>
              <p className={`text-xs ${muted}`}>
                Heuristic score from the checks that ran (not a legal or factual guarantee). {avg !== null && `Average: ${avg}/100 across ${scored.length} review(s).`}
              </p>
              {series.length >= 2 ? (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 mt-3" role="img" aria-label={`Scores of your last ${series.length} reviews, oldest to newest`}>
                  <polyline fill="none" stroke="#2d5a43" strokeWidth="2.5" points={pts.map((p) => p.join(',')).join(' ')} />
                  {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#2d5a43"><title>{series[i]}/100</title></circle>)}
                </svg>
              ) : (
                <p className={`text-sm mt-6 ${muted}`}>Run at least two reviews to see a trend.</p>
              )}
            </div>
            <div className={`p-5 rounded-2xl border ${card}`}>
              <h2 className="font-semibold">Findings</h2>
              <div className="text-3xl font-bold mt-2">{findings}</div>
              <p className={`text-xs mt-1 ${muted}`}>across {compliance.length} review(s)</p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${card}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent reviews</h2>
              <button onClick={() => onNavigate('library')} className="text-sm underline min-h-[44px] px-2">View all</button>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {recent.map((r) => (
                <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm break-words min-w-0 flex-1">{(r.draft || r.content || '').slice(0, 90) || `Review ${r.id}`}</span>
                  <span className={`text-xs ${muted}`}>{r.status} · {r.findings?.length || 0} finding(s) · {r.score?.value ?? 'n/a'}/100</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {expiring.length > 0 && (
        <div className={`p-5 rounded-2xl border ${isOriginal ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
          <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Source dates need attention</h2>
          <ul className="text-sm mt-2 list-disc pl-5">
            {expiring.map((s) => <li key={s.id}>{s.name} {s.section ? `(${s.section})` : ''}: {s.status === 'expired' ? 'expired' : 'expires'} {s.expires_on}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};
