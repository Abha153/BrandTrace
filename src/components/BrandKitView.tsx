import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Shield,
  DollarSign,
  AlertOctagon,
  Sparkles,
  Upload,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCode,
  Layers,
  Info,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { BrandSource, BrandRule, ImportPreviewResult } from '../types';

interface BrandKitViewProps {
  workspaceId: string;
  onWorkspaceChange: (ws: string) => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const BrandKitView: React.FC<BrandKitViewProps> = ({
  workspaceId,
  onWorkspaceChange,
  showToast,
}) => {
  const { isOriginal } = useTheme();

  const [activeTab, setActiveTab] = useState<'rules' | 'sources'>('rules');
  const [rules, setRules] = useState<BrandRule[]>([]);
  const [sources, setSources] = useState<BrandSource[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BrandRule | null>(null);

  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<BrandSource | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('json');
  const [importTarget, setImportTarget] = useState<'rules' | 'sources'>('rules');
  const [importContent, setImportContent] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreviewResult | null>(null);
  const [importing, setImporting] = useState(false);

  const [deleteDataModalOpen, setDeleteDataModalOpen] = useState(false);

  // Rule Form state
  const [ruleKind, setRuleKind] = useState<string>('prohibited_term');
  const [ruleTerm, setRuleTerm] = useState('');
  const [ruleReplacement, setRuleReplacement] = useState('');
  const [ruleApprovedValue, setRuleApprovedValue] = useState('');
  const [ruleKeyword, setRuleKeyword] = useState('standard');
  const [ruleSourceId, setRuleSourceId] = useState<number | ''>('');
  const [ruleNotes, setRuleNotes] = useState('');

  // Source Form state
  const [sourceName, setSourceName] = useState('');
  const [sourceSection, setSourceSection] = useState('Section 1');
  const [sourceDocType, setSourceDocType] = useState('terminology');
  const [sourceText, setSourceText] = useState('');

  // Fetch Data
  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'x-workspace-id': workspaceId };
      const [rRes, sRes] = await Promise.all([
        fetch(`/api/rules?workspace_id=${encodeURIComponent(workspaceId)}`, { headers }),
        fetch(`/api/sources?workspace_id=${encodeURIComponent(workspaceId)}`, { headers }),
      ]);

      if (rRes.ok) {
        const rData = await rRes.json();
        setRules(rData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSources(sData);
      }
    } catch {
      showToast('error', 'Failed to load Brand Kit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  // Reset to Demo
  const handleResetDemo = async () => {
    if (!confirm('Reset demo workspace to pristine initial rules and approved sources?')) return;
    try {
      const res = await fetch('/api/workspaces/reset-demo', { method: 'POST' });
      if (res.ok) {
        showToast('success', 'Reset demo workspace to pristine brand kit');
        loadData();
      } else {
        showToast('error', 'Failed to reset demo workspace');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Rule Save
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        kind: ruleKind,
        term: ruleTerm,
        replacement: ruleReplacement || null,
        approved_value: ruleApprovedValue || null,
        keyword: ruleKeyword || 'standard',
        source_id: ruleSourceId !== '' ? Number(ruleSourceId) : null,
        notes: ruleNotes || null,
        workspace_id: workspaceId,
      };

      const headers = {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
      };

      let res;
      if (editingRule) {
        res = await fetch(`/api/rules/${editingRule.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/rules', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed saving rule');
        return;
      }

      showToast('success', editingRule ? 'Rule updated successfully' : 'Rule added to Brand Kit');
      setRuleModalOpen(false);
      setEditingRule(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Rule Delete
  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed deleting rule');
        return;
      }
      showToast('success', 'Rule deleted');
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Source Save
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: sourceName,
        section: sourceSection,
        doc_type: sourceDocType,
        text: sourceText,
        workspace_id: workspaceId,
      };

      const headers = {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
      };

      let res;
      if (editingSource) {
        res = await fetch(`/api/sources/${editingSource.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/sources', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed saving source');
        return;
      }

      showToast('success', editingSource ? 'Source updated' : 'Source document registered');
      setSourceModalOpen(false);
      setEditingSource(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Source Delete
  const handleDeleteSource = async (id: number) => {
    if (!confirm('Delete this approved source? Rules citing this source will be unlinked.')) return;
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed deleting source');
        return;
      }
      showToast('success', 'Source removed');
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Import Preview Check
  const handleCheckImportPreview = async () => {
    if (!importContent.trim()) {
      showToast('error', 'Please paste CSV or JSON content first');
      return;
    }

    try {
      const res = await fetch('/api/brandkit/import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          format: importFormat,
          targetType: importTarget,
          content: importContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Validation failed');
        return;
      }
      setImportPreview(data);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Execute Import Transaction
  const handleExecuteImport = async () => {
    if (!importPreview || !importPreview.valid) return;
    setImporting(true);
    try {
      const res = await fetch('/api/brandkit/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          targetType: importTarget,
          items: importPreview.preview,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Import transaction failed');
        return;
      }

      showToast('success', data.message || 'Import completed successfully');
      setImportModalOpen(false);
      setImportPreview(null);
      setImportContent('');
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setImporting(false);
    }
  };

  // Export Brand Kit
  const handleExport = () => {
    window.location.href = `/api/brandkit/export?workspace_id=${encodeURIComponent(workspaceId)}`;
  };

  // Delete My Data action
  const handleDeleteMyData = async () => {
    try {
      const res = await fetch('/api/workspace/delete-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Deletion failed');
        return;
      }
      showToast('success', data.message || 'Workspace data deleted');
      setDeleteDataModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Controls: Workspace Switcher & Demo Notice */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isOriginal ? 'bg-[#0f172a]/70 border-slate-800' : 'bg-white border-[#e7e4dc] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isOriginal ? 'bg-cyan-500/20 text-cyan-300' : 'bg-[#2d5a43]/15 text-[#2d5a43]'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className={`text-base font-bold tracking-tight ${
                  isOriginal ? 'text-white' : 'text-[#15221b]'
                }`}
              >
                Brand Kit & Guidelines
              </h2>
              <span
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                  workspaceId === 'demo'
                    ? isOriginal
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                    : isOriginal
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {workspaceId === 'demo' ? 'Fictional Demo Workspace' : `Workspace: ${workspaceId}`}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isOriginal ? 'text-slate-400' : 'text-slate-500'}`}>
              Configure brand rules and approved reference sources. Changes instantly update the review engine.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {workspaceId === 'demo' ? (
            <button
              onClick={handleResetDemo}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isOriginal
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-stone-50 border-[#e7e4dc] text-slate-700 hover:bg-stone-100'
              }`}
              title="Reset sample data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          ) : (
            <button
              onClick={() => onWorkspaceChange('demo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isOriginal
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-stone-50 border-[#e7e4dc] text-slate-700 hover:bg-stone-100'
              }`}
            >
              Switch to Demo
            </button>
          )}

          <button
            onClick={() => setImportModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isOriginal
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-stone-50 border-[#e7e4dc] text-slate-700 hover:bg-stone-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV/JSON
          </button>

          <button
            onClick={handleExport}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isOriginal
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-stone-50 border-[#e7e4dc] text-slate-700 hover:bg-stone-100'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={() => setDeleteDataModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all text-red-600 dark:text-red-400 ${
              isOriginal ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete My Data
          </button>
        </div>
      </div>

      {/* Demo Isolation Notice */}
      <div
        className={`px-4 py-3 rounded-xl border text-xs flex items-center gap-2.5 ${
          isOriginal
            ? 'bg-slate-900/40 border-slate-800 text-slate-400'
            : 'bg-[#faf9f5] border-[#e7e4dc] text-stone-600'
        }`}
      >
        <Info className="w-4 h-4 text-emerald-600 dark:text-cyan-400 shrink-0" />
        <span>
          <strong>Demo Isolation Architecture:</strong> Data is scoped to your workspace ID for private demonstration testing without requiring a user login. For production multi-tenant environments, configure authenticated user accounts.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? isOriginal
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-[#2d5a43] text-white shadow-xs'
                : isOriginal
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Brand Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sources'
                ? isOriginal
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-[#2d5a43] text-white shadow-xs'
                : isOriginal
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Approved Sources ({sources.length})
          </button>
        </div>

        {/* Add button */}
        {activeTab === 'rules' ? (
          <button
            onClick={() => {
              setEditingRule(null);
              setRuleKind('prohibited_term');
              setRuleTerm('');
              setRuleReplacement('');
              setRuleApprovedValue('');
              setRuleKeyword('standard');
              setRuleSourceId(sources[0]?.id || '');
              setRuleNotes('');
              setRuleModalOpen(true);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isOriginal
                ? 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-sm'
                : 'bg-[#2d5a43] text-white hover:bg-[#234735] shadow-xs'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingSource(null);
              setSourceName('');
              setSourceSection('Section 1');
              setSourceDocType('terminology');
              setSourceText('');
              setSourceModalOpen(true);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isOriginal
                ? 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-sm'
                : 'bg-[#2d5a43] text-white hover:bg-[#234735] shadow-xs'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Source Document
          </button>
        )}
      </div>

      {/* Rules Table / Cards */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div
              className={`p-12 text-center rounded-2xl border ${
                isOriginal ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-[#e7e4dc]'
              }`}
            >
              <Shield className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <h3 className="font-bold text-sm">No rules defined in this workspace</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add prohibited product names, pricing requirements, or approved claims to guide compliance checks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => {
                const isProhibited = rule.kind === 'prohibited_term';
                const isPrice = rule.kind === 'price';
                const isHype = rule.kind === 'tone_hype';
                const isClaim = rule.kind === 'approved_claim';

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isOriginal
                        ? 'bg-[#0f172a]/70 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-[#e7e4dc] hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Kind Badge & Source ref */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            isProhibited
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                              : isPrice
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                              : isClaim
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40'
                          }`}
                        >
                          {rule.kind.replace('_', ' ')}
                        </span>

                        {rule.source_name && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {rule.source_name} ({rule.source_section})
                          </span>
                        )}
                      </div>

                      {/* Rule details */}
                      <div className="space-y-1.5 my-2">
                        {isProhibited && (
                          <>
                            <div className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                              <AlertOctagon className="w-4 h-4 shrink-0" />
                              Prohibited: "{rule.term}"
                            </div>
                            {rule.replacement && (
                              <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                Suggests: "{rule.replacement}"
                              </div>
                            )}
                          </>
                        )}

                        {isPrice && (
                          <>
                            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4 shrink-0" />
                              Approved {rule.keyword || 'standard'} price: {rule.replacement || rule.approved_value}
                            </div>
                            <div className="text-xs text-slate-500">
                              Flags any non-{rule.approved_value} quote referencing tier keyword "{rule.keyword || 'standard'}".
                            </div>
                          </>
                        )}

                        {isHype && (
                          <>
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              Disallowed Hype Term: "{rule.term}"
                            </div>
                            {rule.replacement && (
                              <div className="text-xs text-slate-500">
                                Suggests: "{rule.replacement}"
                              </div>
                            )}
                          </>
                        )}

                        {isClaim && (
                          <>
                            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              Autonomous Publishing Restriction
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              Mandates human in the loop: "{rule.replacement}"
                            </div>
                          </>
                        )}

                        {rule.notes && (
                          <p className="text-[11px] text-slate-400 italic pt-1">
                            Note: {rule.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                      <span className="text-[10px] text-slate-400">
                        {rule.is_sample ? 'Sample Rule' : 'Custom Rule'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleKind(rule.kind);
                            setRuleTerm(rule.term || '');
                            setRuleReplacement(rule.replacement || '');
                            setRuleApprovedValue(rule.approved_value || '');
                            setRuleKeyword(rule.keyword || 'standard');
                            setRuleSourceId(rule.source_id || '');
                            setRuleNotes(rule.notes || '');
                            setRuleModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sources Table / Cards */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          {sources.length === 0 ? (
            <div
              className={`p-12 text-center rounded-2xl border ${
                isOriginal ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-[#e7e4dc]'
              }`}
            >
              <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <h3 className="font-bold text-sm">No approved sources in this workspace</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add company guideline documents, pricing sheets, or claim registers as reference evidence.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    isOriginal
                      ? 'bg-[#0f172a]/70 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-[#e7e4dc] hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-bold text-sm tracking-tight ${
                          isOriginal ? 'text-white' : 'text-[#15221b]'
                        }`}
                      >
                        {src.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {src.section}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        {src.doc_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-stone-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 font-mono">
                      "{src.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setEditingSource(src);
                        setSourceName(src.name);
                        setSourceSection(src.section);
                        setSourceDocType(src.doc_type);
                        setSourceText(src.text);
                        setSourceModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit source"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSource(src.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD/EDIT RULE */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-xl ${
              isOriginal ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-[#15221b]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingRule ? 'Edit Brand Rule' : 'Add Brand Compliance Rule'}
              </h3>
              <button
                onClick={() => setRuleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                  Rule Kind
                </label>
                <select
                  value={ruleKind}
                  onChange={(e) => setRuleKind(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="prohibited_term">Prohibited Product Name / Term</option>
                  <option value="price">Plan Pricing Rule (USD / INR)</option>
                  <option value="tone_hype">Disallowed Tone / Hype Word</option>
                  <option value="approved_claim">Approved Claim Requirement</option>
                </select>
              </div>

              {ruleKind === 'prohibited_term' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                      Prohibited Term (e.g. "BrandTrace Suite")
                    </label>
                    <input
                      type="text"
                      required
                      value={ruleTerm}
                      onChange={(e) => setRuleTerm(e.target.value)}
                      placeholder="e.g. BrandTrace Suite"
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                      Approved Replacement
                    </label>
                    <input
                      type="text"
                      value={ruleReplacement}
                      onChange={(e) => setRuleReplacement(e.target.value)}
                      placeholder="e.g. BrandTrace Workspace"
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              )}

              {ruleKind === 'price' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                        Tier Keyword
                      </label>
                      <input
                        type="text"
                        value={ruleKeyword}
                        onChange={(e) => setRuleKeyword(e.target.value)}
                        placeholder="e.g. standard"
                        className={`w-full px-3 py-2 rounded-xl text-xs border ${
                          isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                        Numeric Value (e.g. 49 or 3200)
                      </label>
                      <input
                        type="text"
                        required
                        value={ruleApprovedValue}
                        onChange={(e) => setRuleApprovedValue(e.target.value)}
                        placeholder="49"
                        className={`w-full px-3 py-2 rounded-xl text-xs border ${
                          isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                      Display Replacement Formatted
                    </label>
                    <input
                      type="text"
                      value={ruleReplacement}
                      onChange={(e) => setRuleReplacement(e.target.value)}
                      placeholder="e.g. $49/month or ₹3,200/month"
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              )}

              {ruleKind === 'tone_hype' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                      Disallowed Hype Term
                    </label>
                    <input
                      type="text"
                      required
                      value={ruleTerm}
                      onChange={(e) => setRuleTerm(e.target.value)}
                      placeholder="e.g. revolutionary"
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                      Preferred Alternative
                    </label>
                    <input
                      type="text"
                      value={ruleReplacement}
                      onChange={(e) => setRuleReplacement(e.target.value)}
                      placeholder="e.g. innovative"
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              )}

              {ruleKind === 'approved_claim' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                    Required Claim / Policy Text
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={ruleReplacement}
                    onChange={(e) => setRuleReplacement(e.target.value)}
                    placeholder="e.g. A human reviewer makes the final publishing decision."
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                  Connect Stored Reference Source
                </label>
                <select
                  value={ruleSourceId}
                  onChange={(e) => setRuleSourceId(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- No Source Connected --</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                  Internal Compliance Notes (Optional)
                </label>
                <input
                  type="text"
                  value={ruleNotes}
                  onChange={(e) => setRuleNotes(e.target.value)}
                  placeholder="e.g. Retired product branding per 2026 guidelines."
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                    isOriginal ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-[#2d5a43] hover:bg-[#234735]'
                  }`}
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT SOURCE */}
      {sourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-xl ${
              isOriginal ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-[#15221b]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingSource ? 'Edit Source Document' : 'Register Approved Source Document'}
              </h3>
              <button
                onClick={() => setSourceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. 2026 Pricing Sheet"
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    value={sourceSection}
                    onChange={(e) => setSourceSection(e.target.value)}
                    placeholder="Section 1"
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                    Doc Type
                  </label>
                  <select
                    value={sourceDocType}
                    onChange={(e) => setSourceDocType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="terminology">Terminology</option>
                    <option value="pricing">Pricing</option>
                    <option value="brand_voice">Brand Voice</option>
                    <option value="approved_claims">Approved Claims</option>
                    <option value="legal">Legal & Compliance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                  Approved Excerpt / Policy Text
                </label>
                <textarea
                  rows={4}
                  required
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="BrandTrace Workspace standard tier is priced at $49/month..."
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSourceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                    isOriginal ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-[#2d5a43] hover:bg-[#234735]'
                  }`}
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CSV/JSON IMPORT WITH PREVIEW & TRANSACTIONS */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col ${
              isOriginal ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-[#15221b]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-cyan-400" />
                <h3 className="font-bold text-base">Import Brand Kit Data</h3>
              </div>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportPreview(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                  Target Dataset
                </label>
                <select
                  value={importTarget}
                  onChange={(e) => {
                    setImportTarget(e.target.value as any);
                    setImportPreview(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="rules">Brand Rules (Prohibited terms, pricing, hype)</option>
                  <option value="sources">Approved Reference Sources</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                  Data Format
                </label>
                <select
                  value={importFormat}
                  onChange={(e) => {
                    setImportFormat(e.target.value as any);
                    setImportPreview(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="json">JSON Array</option>
                  <option value="csv">CSV (Comma-separated)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Paste {importFormat.toUpperCase()} Content (Max 100 rows)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (importTarget === 'rules') {
                      if (importFormat === 'json') {
                        setImportContent(
                          JSON.stringify(
                            [
                              {
                                kind: 'prohibited_term',
                                term: 'Legacy Brand',
                                replacement: 'Modern Brand',
                                notes: 'Deprecated product name',
                              },
                            ],
                            null,
                            2
                          )
                        );
                      } else {
                        setImportContent('kind,term,replacement,approved_value,keyword,notes\nprohibited_term,Legacy Brand,Modern Brand,,,Deprecated product name');
                      }
                    } else {
                      if (importFormat === 'json') {
                        setImportContent(
                          JSON.stringify(
                            [
                              {
                                name: 'Legal Disclaimer Guide',
                                section: 'Section 4',
                                text: 'Approved disclaimer text required on footer.',
                                doc_type: 'legal',
                              },
                            ],
                            null,
                            2
                          )
                        );
                      } else {
                        setImportContent('name,section,text,doc_type\nLegal Disclaimer Guide,Section 4,Approved disclaimer text required on footer.,legal');
                      }
                    }
                  }}
                  className="text-[11px] text-emerald-600 dark:text-cyan-400 hover:underline"
                >
                  Load Sample Template
                </button>
              </div>

              <textarea
                rows={5}
                value={importContent}
                onChange={(e) => {
                  setImportContent(e.target.value);
                  setImportPreview(null);
                }}
                placeholder={
                  importFormat === 'json'
                    ? '[{"kind": "prohibited_term", "term": "...", "replacement": "..."}]'
                    : 'kind,term,replacement,approved_value,keyword,notes\nprohibited_term,Term,Replacement,,,'
                }
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                  isOriginal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Validate Preview Button */}
            {!importPreview && (
              <button
                type="button"
                onClick={handleCheckImportPreview}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  isOriginal
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-stone-100 hover:bg-stone-200 text-slate-800 border-slate-300'
                }`}
              >
                Validate & Preview Rows
              </button>
            )}

            {/* Validation & Preview Output */}
            {importPreview && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-48">
                {importPreview.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Validation Errors ({importPreview.errors.length}):
                    </div>
                    {importPreview.errors.map((err, i) => (
                      <div key={i} className="pl-5">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}

                {importPreview.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Duplicate / Overwrite Warnings:
                    </div>
                    {importPreview.warnings.map((w, i) => (
                      <div key={i} className="pl-5">
                        • {w}
                      </div>
                    ))}
                  </div>
                )}

                {importPreview.valid && (
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready for Atomic Import ({importPreview.validRowsCount} rows verified)
                    </div>
                    <p className="mt-1 text-[11px] opacity-90">
                      Imports run within a database transaction. If any row fails, the entire transaction rolls back.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportPreview(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              {importPreview?.valid && (
                <button
                  type="button"
                  disabled={importing}
                  onClick={handleExecuteImport}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                    isOriginal ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-[#2d5a43] hover:bg-[#234735]'
                  }`}
                >
                  {importing ? 'Importing Transaction...' : `Confirm Import (${importPreview.validRowsCount} items)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE MY DATA CONFIRMATION */}
      {deleteDataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl ${
              isOriginal ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-[#e7e4dc] text-[#15221b]'
            }`}
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Delete My Data</h3>
                <p className="text-xs text-slate-500">Workspace: {workspaceId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {workspaceId === 'demo'
                ? 'Resetting demo workspace will restore sample seed records and delete all added custom reviews and history.'
                : `Are you sure you want to permanently delete all custom rules, reference sources, reviews, and audit history for workspace "${workspaceId}"? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteDataModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMyData}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
