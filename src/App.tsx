/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ScreenId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { AuditStudio } from './components/AuditStudio';
import { AnalysisResults } from './components/AnalysisResults';
import { ReviewsLibrary } from './components/ReviewsLibrary';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { SettingsView } from './components/SettingsView';
import { SettingsModal } from './components/SettingsModal';
import { BrandKitView } from './components/BrandKitView';
import { ThemeProvider, useTheme } from './ThemeContext';
import {
  BrandTraceConfig,
  BrandAnalysisResult,
  BrandReview,
  SourceType,
  BrandFinding,
  ReviewScore,
} from './types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

function BrandTraceMain() {
  const { isOriginal } = useTheme();

  // Navigation state (Defaulting to 'dashboard' as shown in main mockup)
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Workspace scoping state (defaults to 'demo', persisted in localStorage)
  const [workspaceId, setWorkspaceId] = useState<string>(() => {
    return localStorage.getItem('brandtrace_workspace_id') || 'demo';
  });

  const handleWorkspaceChange = (ws: string) => {
    setWorkspaceId(ws);
    localStorage.setItem('brandtrace_workspace_id', ws);
  };

  // Configuration and reviews
  const [config, setConfig] = useState<BrandTraceConfig | null>(null);
  const [reviews, setReviews] = useState<BrandReview[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active analysis results
  const [currentResult, setCurrentResult] = useState<BrandAnalysisResult | null>(null);
  const [currentComplianceReview, setCurrentComplianceReview] = useState<{
    id: number | string;
    draft: string;
    status: string;
    findings: BrandFinding[];
    score: ReviewScore;
    engine: string;
    llm_used: boolean;
    note: string;
    retrieved_sources?: any[];
    history?: any[];
  } | null>(null);

  const [currentBrandName, setCurrentBrandName] = useState<string>('BrandTrace Workspace');
  const [currentProduct, setCurrentProduct] = useState<string>('Standard Tier');
  const [isSavedInSession, setIsSavedInSession] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Failed to load BrandTrace config:', err);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || data || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  useEffect(() => {
    loadConfig();
    loadReviews();
  }, []);

  // 1. Run Copy Compliance Review (POST /api/review)
  const handleRunComplianceReview = async (draft: string) => {
    setIsAnalyzing(true);
    setCurrentResult(null);
    setIsSavedInSession(false);
    setCurrentBrandName('BrandTrace Workspace');
    setCurrentProduct('Standard Tier');

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ draft, workspace_id: workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.detail || 'Compliance check failed');
        return;
      }

      setCurrentComplianceReview(data);
      setCurrentScreen('results');
      showToast('success', `Compliance check completed${typeof data.score?.value === 'number' ? ` (Score: ${data.score.value}/100)` : ''}`);
      loadConfig();
      loadReviews();
    } catch (err: any) {
      showToast('error', err.message || 'Error executing compliance check');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Run Brand Perception Audit (POST /api/analyze)
  const handleRunAudit = async (payload: {
    brandName: string;
    productOrService: string;
    source: SourceType;
    competitors: string[];
    content: string;
  }) => {
    setIsAnalyzing(true);
    setCurrentComplianceReview(null);
    setCurrentBrandName(payload.brandName);
    setCurrentProduct(payload.productOrService);
    setIsSavedInSession(false);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.error || data.message || 'Audit analysis failed');
        return;
      }

      setCurrentResult(data.result);
      setCurrentScreen('results');
      if (data.warning) {
        showToast('info', data.warning);
      } else {
        showToast('success', `Brand audit completed${typeof data.result?.sentimentScore === 'number' ? ` (Score: ${data.result.sentimentScore}/100)` : ''}`);
      }
      loadConfig();
      loadReviews();
    } catch (err: any) {
      showToast('error', err.message || 'Analysis request failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Save to Library (POST /api/reviews)
  const handleSaveToLibrary = async () => {
    if (isSavedInSession) {
      showToast('info', 'This audit is already saved in the library.');
      return;
    }

    try {
      let body: any;
      if (currentComplianceReview) {
        body = {
          title: `Compliance Review - ${new Date().toLocaleDateString()}`,
          brandName: currentBrandName,
          productOrService: currentProduct,
          source: 'marketing_copy',
          draft: currentComplianceReview.draft,
          status: currentComplianceReview.status || 'Pending Review',
          findings: currentComplianceReview.findings,
          score: currentComplianceReview.score,
          engine: currentComplianceReview.engine,
          llm_used: currentComplianceReview.llm_used,
          note: currentComplianceReview.note,
        };
      } else if (currentResult) {
        body = {
          title: `${currentBrandName} Audit`,
          brandName: currentBrandName,
          productOrService: currentProduct,
          source: 'customer_review',
          content: 'Brand perception audit report',
          analysis: currentResult,
          status: 'Pending Review', // a person approves, never the score
        };
      } else {
        return;
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsSavedInSession(true);
        showToast('success', 'Saved to Reviews Library!');
        loadReviews();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to save review');
      }
    } catch (err) {
      showToast('error', 'Error connecting to database');
    }
  };

  // 4. Update Status (PATCH /api/reviews/:id/status)
  const handleUpdateStatus = async (
    status: 'Approved' | 'Changes Requested' | 'Pending Review',
    comment?: string
  ) => {
    if (!currentComplianceReview?.id) {
      showToast('info', 'Status updated for active preview session');
      setCurrentComplianceReview((prev) => (prev ? { ...prev, status } : null));
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${currentComplianceReview.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentComplianceReview((prev) => (prev ? { ...prev, status: data.status, history: data.history } : null));
        showToast('success', `Status updated to ${status}`);
        loadReviews();
      } else {
        const err = await res.json();
        showToast('error', err.detail || 'Failed to update review status');
      }
    } catch (err) {
      showToast('error', 'Error updating status in database');
    }
  };

  // 5. Delete from Library
  const handleDeleteReview = async (id: string | number) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Review deleted from library');
        loadReviews();
        if (currentComplianceReview?.id === id) {
          setCurrentComplianceReview(null);
        }
      } else {
        showToast('error', 'Failed to delete review');
      }
    } catch (err) {
      showToast('error', 'Error deleting record');
    }
  };

  // 6. Select review from library to view in results
  const handleSelectReview = (rev: BrandReview) => {
    if (rev.findings && rev.score) {
      setCurrentComplianceReview({
        id: rev.id,
        draft: rev.draft || rev.content || '',
        status: rev.status || 'Audited',
        findings: rev.findings,
        score: rev.score,
        engine: rev.engine || 'BrandTrace Ground Truth Engine',
        llm_used: rev.llm_used ?? true,
        note: rev.note || '',
      });
      setCurrentResult(null);
    } else if (rev.analysis) {
      setCurrentResult(rev.analysis);
      setCurrentComplianceReview(null);
    }
    setCurrentBrandName(rev.brandName || 'BrandTrace Workspace');
    setCurrentProduct(rev.productOrService || 'Standard Tier');
    setIsSavedInSession(true);
    setCurrentScreen('results');
  };

  // 7. Seed Sample Reviews
  const handleSeedSamples = async () => {
    try {
      const res = await fetch('/api/reviews/seed', { method: 'POST' });
      if (res.ok) {
        showToast('success', 'Sample reviews seeded into SQLite database!');
        loadReviews();
      } else {
        showToast('error', 'Bundled sample reviews were removed. Run an analysis to create your first review.');
      }
    } catch (err) {
      showToast('error', 'Error seeding database');
    }
  };

  // 8. Save Configuration
  const handleSaveConfig = async (updated: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        showToast('success', 'Configuration updated successfully!');
        return true;
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to update configuration');
        return false;
      }
    } catch (err) {
      showToast('error', 'Error updating configuration');
      return false;
    }
  };

  // Landing Page standalone render
  if (currentScreen === 'landing') {
    return (
      <div className="min-h-screen">
        <LandingPage onNavigate={setCurrentScreen} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isOriginal ? 'bg-[#020617] text-slate-100' : 'bg-[#f9f8f5] text-[#15221b]'
      }`}
    >
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-medium border backdrop-blur-md ${
              toast.type === 'success'
                ? isOriginal
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60 shadow-emerald-950/40'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-500/10'
                : toast.type === 'error'
                ? isOriginal
                  ? 'bg-rose-950/90 text-rose-200 border-rose-700/60'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
                : isOriginal
                ? 'bg-cyan-950/90 text-cyan-200 border-cyan-700/60'
                : 'bg-indigo-50 text-indigo-900 border-indigo-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Layout: Fixed/Sticky Left Sidebar + Scrollable Right Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
        {/* Navigation Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          savedCount={reviews.length}
          averageScore={(() => { const v = reviews.map((r) => r.score?.value).filter((x): x is number => typeof x === 'number'); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; })()}
        />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* TopBar with Screen Title, Theme Toggle, User Avatar */}
          <TopBar
            currentScreen={currentScreen}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />

          {/* Screen Content View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentScreen === 'dashboard' && (
              <DashboardView
                reviews={reviews}
                onNavigate={setCurrentScreen}
                onQuickAudit={() => setCurrentScreen('studio')}
              />
            )}

            {currentScreen === 'studio' && (
              <AuditStudio
                config={config}
                onRunAudit={handleRunAudit}
                onRunComplianceReview={handleRunComplianceReview}
                isAnalyzing={isAnalyzing}
                onOpenSettings={() => setCurrentScreen('settings')}
              />
            )}

            {currentScreen === 'brandkit' && (
              <BrandKitView
                workspaceId={workspaceId}
                onWorkspaceChange={handleWorkspaceChange}
                showToast={showToast}
              />
            )}

            {currentScreen === 'results' && (
              <AnalysisResults
                result={currentResult}
                complianceReview={currentComplianceReview}
                brandName={currentBrandName}
                productOrService={currentProduct}
                onSaveToLibrary={handleSaveToLibrary}
                isSaved={isSavedInSession}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {currentScreen === 'library' && (
              <ReviewsLibrary
                reviews={reviews}
                onSelectReview={handleSelectReview}
                onDeleteReview={handleDeleteReview}
                                storageMode={config?.storage_mode || 'local'}
              />
            )}

            {currentScreen === 'diagnostics' && (
              <DiagnosticsPanel
                config={config}
                onRefreshConfig={loadConfig}
                onOpenSettings={() => setCurrentScreen('settings')}
                workspaceId={workspaceId}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsView
                config={config}
                onSaveConfig={handleSaveConfig}
              />
            )}
          </main>
        </div>
      </div>

      {/* Settings Modal (if invoked as overlay) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrandTraceMain />
    </ThemeProvider>
  );
}
