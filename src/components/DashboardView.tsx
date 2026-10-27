import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { ScreenId } from './Sidebar';

interface DashboardViewProps {
  onNavigate: (screen: ScreenId) => void;
  onQuickAudit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickAudit,
}) => {
  const { isOriginal } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Compliance Trend spline chart data (Apr 20 - Apr 26)
  const trendData = [
    { day: 'Apr 20', positive: 72, neutral: 20, negative: 8 },
    { day: 'Apr 21', positive: 68, neutral: 22, negative: 10 },
    { day: 'Apr 22', positive: 75, neutral: 18, negative: 7 },
    { day: 'Apr 23', positive: 70, neutral: 24, negative: 6 },
    { day: 'Apr 24', positive: 82, neutral: 14, negative: 4 },
    { day: 'Apr 25', positive: 78, neutral: 17, negative: 5 },
    { day: 'Apr 26', positive: 88, neutral: 9, negative: 3 },
  ];

  // Activities from the visual mockup
  const recentActivities = [
    {
      id: 1,
      title: 'Brand mention detected',
      source: 'Twitter',
      time: '2h ago',
      type: 'mention',
      color: isOriginal ? 'text-cyan-400 bg-cyan-950/40' : 'text-blue-600 bg-blue-50',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Policy violation found',
      source: 'Facebook',
      time: '4h ago',
      type: 'violation',
      color: isOriginal ? 'text-red-400 bg-red-950/40' : 'text-red-600 bg-red-50',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    {
      id: 3,
      title: 'Positive review',
      source: 'Google',
      time: '6h ago',
      type: 'positive',
      color: isOriginal ? 'text-emerald-400 bg-emerald-950/40' : 'text-[#2d5a43] bg-emerald-50',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
        </svg>
      ),
    },
    {
      id: 4,
      title: 'Audit completed',
      source: 'System',
      time: '2h ago',
      type: 'system',
      color: isOriginal ? 'text-indigo-400 bg-indigo-950/40' : 'text-indigo-600 bg-indigo-50',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  ];

  // SVG dimensions for trend chart
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Path generator for cubic bezier spline
  const makeSplinePath = (vals: number[]) => {
    const points = vals.map((v, i) => {
      const x = paddingX + (i / (vals.length - 1)) * chartW;
      const y = paddingY + chartH - (v / 100) * chartH;
      return { x, y };
    });

    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const positivePath = makeSplinePath(trendData.map((d) => d.positive));
  const neutralPath = makeSplinePath(trendData.map((d) => d.neutral));
  const negativePath = makeSplinePath(trendData.map((d) => d.negative));

  // Area under positive curve
  const positiveArea = `${positivePath} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 4 Metric Cards matching top mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Compliance Score */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
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
              Compliance Score
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                isOriginal
                  ? 'bg-emerald-950/60 text-emerald-400'
                  : 'bg-emerald-50 text-[#2d5a43]'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              +4%
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {/* Circular Gauge 92% */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
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
                  strokeDasharray="92, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-base font-bold tracking-tight ${
                    isOriginal ? 'text-white' : 'text-[#15221b]'
                  }`}
                >
                  92%
                </span>
              </div>
            </div>

            <div>
              <div
                className={`text-2xl font-bold tracking-tight ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                92%
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                +4% from last week
              </p>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Reviews */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
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
              Total Reviews
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                isOriginal
                  ? 'bg-emerald-950/60 text-emerald-400'
                  : 'bg-emerald-50 text-[#2d5a43]'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              +12%
            </span>
          </div>

          <div className="mt-4">
            <div
              className={`text-3xl font-bold tracking-tight ${
                isOriginal ? 'text-white' : 'text-[#15221b]'
              }`}
            >
              1,248
            </div>
            <p
              className={`text-xs mt-1 ${
                isOriginal ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              +12% from last week
            </p>
          </div>
        </div>

        {/* Metric 3: Risks Detected */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
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
              Risks Detected
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                isOriginal
                  ? 'bg-emerald-950/60 text-emerald-400'
                  : 'bg-emerald-50 text-[#2d5a43]'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              -42%
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div
                className={`text-3xl font-bold tracking-tight text-red-500`}
              >
                18
              </div>
              <p
                className={`text-xs mt-1 ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                -42% from last week
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOriginal ? 'bg-red-950/40 text-red-400' : 'bg-red-50 text-red-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 4: Last Audit */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
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
              Last Audit
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isOriginal ? 'bg-cyan-400 animate-pulse' : 'bg-[#2d5a43]'
              }`}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div
                className={`text-3xl font-bold tracking-tight ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                2h ago
              </div>
              <p
                className={`text-xs mt-1 flex items-center gap-1 ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Auto scan completed
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOriginal ? 'bg-slate-800 text-cyan-400' : 'bg-[#f0eee6] text-[#2d5a43]'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Compliance Trend (Left 2/3) & Recent Activity (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend Chart */}
        <div
          className={`lg:col-span-2 p-5 sm:p-6 rounded-2xl border ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2
                className={`text-base font-bold tracking-tight ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                Compliance Trend
              </h2>
              <p
                className={`text-xs mt-0.5 ${
                  isOriginal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                7-day rolling sentiment and policy adherence
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOriginal ? 'bg-cyan-400' : 'bg-[#2d5a43]'
                  }`}
                />
                <span className={isOriginal ? 'text-slate-300' : 'text-slate-600'}>
                  Positive
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className={isOriginal ? 'text-slate-300' : 'text-slate-600'}>
                  Neutral
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className={isOriginal ? 'text-slate-300' : 'text-slate-600'}>
                  Negative
                </span>
              </div>
            </div>
          </div>

          {/* SVG Wave Spline Chart */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-56 select-none"
              >
                <defs>
                  <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isOriginal ? '#06b6d4' : '#2d5a43'}
                      stopOpacity={isOriginal ? '0.35' : '0.18'}
                    />
                    <stop
                      offset="100%"
                      stopColor={isOriginal ? '#06b6d4' : '#2d5a43'}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines & labels */}
                {[0, 20, 40, 60, 80, 100].map((val) => {
                  const y = paddingY + chartH - (val / 100) * chartH;
                  return (
                    <g key={val}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke={isOriginal ? '#1e293b' : '#f0eee6'}
                        strokeDasharray={val === 0 ? '' : '3 3'}
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        className={`text-[10px] ${
                          isOriginal ? 'fill-slate-500' : 'fill-slate-400'
                        }`}
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area under positive curve */}
                <path d={positiveArea} fill="url(#posGrad)" />

                {/* Lines */}
                <path
                  d={positivePath}
                  fill="none"
                  stroke={isOriginal ? '#06b6d4' : '#2d5a43'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={neutralPath}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d={negativePath}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* X-axis dates & interactive hover nodes */}
                {trendData.map((d, i) => {
                  const x = paddingX + (i / (trendData.length - 1)) * chartW;
                  const yPos = paddingY + chartH - (d.positive / 100) * chartH;
                  const isHover = hoveredPoint === i;

                  return (
                    <g
                      key={d.day}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="cursor-pointer"
                    >
                      {/* Vertical highlight line on hover */}
                      {isHover && (
                        <line
                          x1={x}
                          y1={paddingY}
                          x2={x}
                          y2={height - paddingY}
                          stroke={isOriginal ? '#38bdf8' : '#2d5a43'}
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Positive Point */}
                      <circle
                        cx={x}
                        cy={yPos}
                        r={isHover ? 6 : 4}
                        fill={isOriginal ? '#0f172a' : '#ffffff'}
                        stroke={isOriginal ? '#06b6d4' : '#2d5a43'}
                        strokeWidth={isHover ? 3 : 2}
                        className="transition-all"
                      />

                      {/* X label */}
                      <text
                        x={x}
                        y={height - 6}
                        textAnchor="middle"
                        className={`text-[10px] ${
                          isHover
                            ? isOriginal
                              ? 'fill-cyan-300 font-bold'
                              : 'fill-[#2d5a43] font-bold'
                            : isOriginal
                            ? 'fill-slate-500'
                            : 'fill-slate-400'
                        }`}
                      >
                        {d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Active Hover Detail Bar */}
          <div
            className={`mt-3 py-2 px-3 rounded-xl flex items-center justify-between text-xs transition-colors ${
              isOriginal ? 'bg-slate-900/60 text-slate-300' : 'bg-[#f7f5ee] text-slate-700'
            }`}
          >
            <span className="font-medium">
              {hoveredPoint !== null
                ? `${trendData[hoveredPoint].day} Overview:`
                : 'Latest (Apr 26):'}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-emerald-500 font-semibold">
                {hoveredPoint !== null
                  ? `${trendData[hoveredPoint].positive}% Positive`
                  : '88% Positive'}
              </span>
              <span className="text-amber-500 font-semibold">
                {hoveredPoint !== null
                  ? `${trendData[hoveredPoint].neutral}% Neutral`
                  : '9% Neutral'}
              </span>
              <span className="text-red-500 font-semibold">
                {hoveredPoint !== null
                  ? `${trendData[hoveredPoint].negative}% Negative`
                  : '3% Negative'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between ${
            isOriginal
              ? 'bg-[#0f172a]/70 border-slate-800'
              : 'bg-white border-[#e7e4dc] shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-base font-bold tracking-tight ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                Recent Activity
              </h2>
              <button
                onClick={() => onNavigate('library')}
                className={`text-xs font-medium hover:underline ${
                  isOriginal ? 'text-cyan-400' : 'text-[#2d5a43]'
                }`}
              >
                View all
              </button>
            </div>

            {/* List */}
            <div className="space-y-3.5">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all hover:translate-x-1 ${
                    isOriginal ? 'hover:bg-slate-800/40' : 'hover:bg-[#f9f8f5]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}
                  >
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isOriginal ? 'text-white' : 'text-[#15221b]'
                      }`}
                    >
                      {act.title}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isOriginal ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {act.source} • {act.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick CTA to start audit */}
          <div
            className={`mt-5 pt-4 border-t ${
              isOriginal ? 'border-slate-800' : 'border-[#e7e4dc]'
            }`}
          >
            <button
              onClick={() => onNavigate('studio')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                isOriginal
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:brightness-110'
                  : 'bg-[#2d5a43] text-white hover:bg-[#234735]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Launch New Audit
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
