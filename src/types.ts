/**
 * BrandTrace AI - Data Types & Interfaces
 */

export type LLMProvider = 'none' | 'anthropic' | 'openai_compatible' | 'gemini';

export type StorageMode = 'local' | 'ephemeral' | 'persistent';

export type SourceType =
  | 'marketing_copy'
  | 'customer_review'
  | 'ai_chat_response'
  | 'social_mention'
  | 'support_ticket';

export type ReviewStatus = 'Pending Review' | 'Changes Requested' | 'Approved';

export interface BrandTraceConfig {
  llm_configured?: boolean;
  provider?: string;
  model?: string;
  base_url?: string;
  message?: string;
  llm_provider: LLMProvider;
  has_api_key: boolean;
  masked_api_key: string;
  llm_model: string;
  llm_base_url: string;
  llm_timeout_seconds: number;
  llm_max_retries: number;
  llm_retry_delay_seconds: number;
  llm_max_calls_per_hour: number;
  brandtrace_db: string;
  storage_mode: StorageMode;
  cors_origins: string;
  calls_this_hour: number;
  calls_remaining: number | null;
  reset_in_seconds: number;
  gemini_env_available: boolean;
}

export interface ConfigUpdateRequest {
  llm_provider?: LLMProvider;
  llm_api_key?: string;
  llm_model?: string;
  llm_base_url?: string;
  llm_timeout_seconds?: number;
  llm_max_retries?: number;
  llm_retry_delay_seconds?: number;
  llm_max_calls_per_hour?: number;
  brandtrace_db?: string;
  storage_mode?: StorageMode;
}

export interface ConnectionTestResult {
  success: boolean;
  provider: LLMProvider;
  model: string;
  latencyMs: number;
  message: string;
  timestamp: string;
}

export interface BrandSource {
  id: number;
  workspace_id?: string;
  name: string;
  section: string;
  text: string;
  doc_type: string;
  excerpt?: string;
  is_sample?: boolean;
  created_at?: string;
}

export interface BrandRule {
  id: number;
  workspace_id: string;
  kind: 'prohibited_term' | 'price' | 'tone_hype' | 'approved_claim' | 'required_terminology' | string;
  term?: string | null;
  replacement?: string | null;
  approved_value?: string | null;
  keyword?: string | null;
  source_id?: number | null;
  source_name?: string | null;
  source_section?: string | null;
  notes?: string | null;
  is_sample?: boolean;
  created_at?: string;
}

export interface BrandWorkspace {
  id: string;
  name: string;
  is_demo: number | boolean;
  created_at: string;
}

export interface ImportPreviewResult {
  valid: boolean;
  totalRows: number;
  validRowsCount: number;
  preview: any[];
  errors: string[];
  warnings: string[];
}

export interface BrandFinding {
  category: 'Factual Contradiction' | 'Terminology' | 'Tone' | 'Unsupported Claim' | string;
  severity: 'error' | 'warning' | 'info';
  quote: string;
  start?: number;
  end?: number;
  explanation: string;
  suggestion?: string | null;
  source?: BrandSource | null;
  sources?: BrandSource[];
  evidence_status: 'Contradicted' | 'Source-backed' | 'Unverified' | string;
  detected_by: 'rules' | 'llm';
}

export interface ReviewScore {
  value: number;
  label: ReviewStatus;
  errors: number;
  warnings: number;
  notes: number;
  basis: string;
}

export interface HistoryEvent {
  id: number;
  previous_status: string | null;
  new_status: string;
  comment: string | null;
  created_at: string;
}

export interface BrandClaim {
  claim: string;
  status: 'verified' | 'unsubstantiated' | 'disputed' | 'opinion';
  rationale: string;
}

export interface CompetitorMention {
  name: string;
  context: string;
  sentimentVsBrand: 'favorable' | 'neutral' | 'unfavorable';
}

export interface ThemeInsight {
  theme: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  weight: number;
  quotes: string[];
}

export interface BrandAnalysisResult {
  overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentimentScore: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  brandVoiceScore: number | null;
  brandVoiceTone: string;
  brandVoiceTags: string[];
  aiVisibilityScore: number | null;
  aiCitationProbability: 'High' | 'Medium' | 'Low' | 'Not assessed';
  hallucinationRisk: 'Low' | 'Moderate' | 'High' | 'Not assessed';
  executiveSummary: string;
  strengths: string[];
  vulnerabilities: string[];
  keyThemes: ThemeInsight[];
  brandClaims: BrandClaim[];
  competitorMentions: CompetitorMention[];
  actionableRecommendations: string[];
  modelUsed: string;
  provider: LLMProvider;
  latencyMs: number;
  tokensUsed?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  analyzedAt: string;
  isSimulation?: boolean;
}

export interface BrandReview {
  id: string | number;
  title?: string;
  brandName?: string;
  productOrService?: string;
  source?: SourceType;
  draft?: string;
  content: string;
  competitors?: string[];
  tags?: string[];
  status?: ReviewStatus;
  findings?: BrandFinding[];
  score?: ReviewScore;
  engine?: string;
  llm_used?: boolean;
  note?: string;
  analysis?: any;
  retrieved_sources?: BrandSource[];
  history?: HistoryEvent[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
}
