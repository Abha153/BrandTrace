import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { getDatabase, seedDemoWorkspace } from './src/server/db.ts';
import { runDynamicRules } from './src/server/checker.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_DEV = process.env.NODE_ENV !== 'production';

// ---- Runtime Configuration (initialized from environment variables) ----
interface RuntimeConfig {
  llm_provider: 'none' | 'anthropic' | 'openai_compatible' | 'gemini';
  llm_api_key: string;
  llm_model: string;
  llm_base_url: string;
  llm_timeout_seconds: number;
  llm_max_retries: number;
  llm_retry_delay_seconds: number;
  llm_max_calls_per_hour: number;
  brandtrace_db: string;
  storage_mode: 'local' | 'ephemeral' | 'persistent';
  cors_origins: string;
}

// Initial resolution: default to openai_compatible with Gemini 3.8 Flash
const defaultProvider = (process.env.LLM_PROVIDER as any) || 'openai_compatible';
const defaultModel = process.env.LLM_MODEL || 'gemini-3.8-flash';
const defaultBaseUrl =
  process.env.LLM_BASE_URL ||
  (defaultProvider === 'openai_compatible'
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
    : defaultProvider === 'anthropic'
    ? 'https://api.anthropic.com'
    : '');

const runtimeConfig: RuntimeConfig = {
  llm_provider: defaultProvider,
  llm_api_key: process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || '',
  llm_model: defaultModel,
  llm_base_url: defaultBaseUrl,
  llm_timeout_seconds: Number(process.env.LLM_TIMEOUT_SECONDS || 30),
  llm_max_retries: Number(process.env.LLM_MAX_RETRIES || 1),
  llm_retry_delay_seconds: Number(process.env.LLM_RETRY_DELAY_SECONDS || 1),
  llm_max_calls_per_hour: Number(process.env.LLM_MAX_CALLS_PER_HOUR || 0),
  brandtrace_db: process.env.BRANDTRACE_DB || 'backend/brandtrace.db',
  storage_mode: (process.env.STORAGE_MODE as any) || 'local',
  cors_origins: process.env.CORS_ORIGINS || '',
};

// Rate limiting: Hourly sliding or tumbling window
let hourlyCallCount = 0;
let hourWindowStart = Date.now();

function checkRateLimit(): { allowed: boolean; remaining: number | null; resetIn: number } {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  if (now - hourWindowStart >= ONE_HOUR) {
    hourWindowStart = now;
    hourlyCallCount = 0;
  }

  const limit = runtimeConfig.llm_max_calls_per_hour;
  const resetIn = Math.max(0, Math.ceil((hourWindowStart + ONE_HOUR - now) / 1000));

  if (limit <= 0) {
    return { allowed: true, remaining: null, resetIn };
  }

  if (hourlyCallCount >= limit) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: limit - hourlyCallCount, resetIn };
}

function incrementRateLimit() {
  hourlyCallCount++;
}

// Storage management for reviews
const DB_FILE_PATH = path.resolve(__dirname, runtimeConfig.brandtrace_db.endsWith('.json') || runtimeConfig.brandtrace_db.endsWith('.db') ? runtimeConfig.brandtrace_db : `${runtimeConfig.brandtrace_db}.json`);

function getDbStoragePath(): string {
  // Use a reliable JSON storage path for structured data
  return path.resolve(__dirname, 'brandtrace-data.json');
}

let inMemoryReviews: any[] = [];

function loadReviews(): any[] {
  if (runtimeConfig.storage_mode === 'ephemeral') {
    return inMemoryReviews;
  }
  try {
    const filePath = getDbStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed reading reviews storage:', err);
  }
  return inMemoryReviews;
}

function saveReviews(reviews: any[]) {
  inMemoryReviews = reviews;
  if (runtimeConfig.storage_mode === 'ephemeral') {
    return;
  }
  try {
    const filePath = getDbStoragePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed saving reviews storage:', err);
  }
}

// Seed initial default reviews if empty
function initializeSeedData() {
  const current = loadReviews();
  if (current.length === 0) {
    const initialReviews = [
      {
        id: 'rev-001',
        title: 'Notion 3.0 AI Workspace Real-world Review',
        brandName: 'Notion',
        productOrService: 'Notion AI & Team Workspace',
        source: 'customer_review',
        content: `I have been using Notion for our 45-person engineering and product design team for over two years. Notion's database flexibility and document linking are unmatched. When they added Notion AI, it accelerated our sprint summaries. However, search indexing can feel sluggish with large doc trees, and the offline mode is still frustratingly unreliable. Compared to Obsidian or Coda, Notion wins on collaborative aesthetics and team onboarding, but power users keep hitting the markdown rendering quirks. Overall, our team wouldn't trade it despite the occasional latency.`,
        competitors: ['Obsidian', 'Coda'],
        tags: ['Productivity', 'SaaS', 'AI Workspace', 'Collaboration'],
        createdAt: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
        analysis: {
          overallSentiment: 'positive',
          sentimentScore: 78,
          sentimentBreakdown: { positive: 65, neutral: 25, negative: 10 },
          brandVoiceScore: 84,
          brandVoiceTone: 'Innovative, modern, productivity-centric',
          brandVoiceTags: ['Flexible', 'Modern Aesthetic', 'Collaborative', 'Occasional Latency'],
          aiVisibilityScore: 92,
          aiCitationProbability: 'High',
          hallucinationRisk: 'Low',
          executiveSummary: 'Strong customer brand affinity centered on team collaboration and AI productivity. Vulnerabilities focus on offline availability and large-scale search performance.',
          strengths: ['Unmatched database flexibility', 'Fast sprint summarization via integrated AI', 'High team onboarding velocity'],
          vulnerabilities: ['Sluggish search on enterprise doc trees', 'Unreliable offline capability', 'Markdown rendering quirks'],
          keyThemes: [
            { theme: 'Productivity & Workflow', sentiment: 'positive', weight: 9, quotes: ['accelerated our sprint summaries', 'unmatched database flexibility'] },
            { theme: 'Performance & Offline', sentiment: 'negative', weight: 6, quotes: ['search indexing can feel sluggish', 'offline mode is frustratingly unreliable'] },
          ],
          brandClaims: [
            { claim: 'Notion AI accelerates sprint documentation', status: 'verified', rationale: 'Confirmed by user workflow speedups.' },
            { claim: 'Offline mode is fully supported', status: 'disputed', rationale: 'Customer experience indicates persistent offline sync issues.' },
          ],
          competitorMentions: [
            { name: 'Obsidian', context: 'Comparison on offline reliability and markdown rendering', sentimentVsBrand: 'neutral' },
            { name: 'Coda', context: 'Comparison on UI aesthetics and team onboarding', sentimentVsBrand: 'favorable' },
          ],
          actionableRecommendations: [
            'Prioritize offline sync reliability in marketing messaging and product roadmap.',
            'Produce GEO (Generative Engine Optimization) technical documentation highlighting fast search query optimizations.'
          ],
          modelUsed: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
          latencyMs: 1420,
          tokensUsed: { prompt: 420, completion: 380, total: 800 },
          analyzedAt: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
          isSimulation: false,
        }
      },
      {
        id: 'rev-002',
        title: 'ChatGPT & Claude Brand Perception Audit: Shopify vs WooCommerce',
        brandName: 'Shopify',
        productOrService: 'Shopify Plus & Checkout',
        source: 'ai_chat_response',
        content: `When asking major LLMs (ChatGPT-4o, Claude 3.5 Sonnet, and Gemini) for recommendations on enterprise e-commerce platforms, Shopify Plus is consistently cited as the leading solution for conversion rate optimization and frictionless checkout. The AI models repeatedly highlight Shop Pay's 1-click checkout conversion advantage. However, AI responses frequently caution prospective merchants about high app ecosystem transaction fees and vendor lock-in compared to open-source alternatives like WooCommerce.`,
        competitors: ['WooCommerce', 'BigCommerce'],
        tags: ['E-Commerce', 'Checkout', 'AI Audit', 'Conversion'],
        createdAt: new Date(Date.now() - 3600 * 24 * 1 * 1000).toISOString(),
        analysis: {
          overallSentiment: 'positive',
          sentimentScore: 82,
          sentimentBreakdown: { positive: 70, neutral: 20, negative: 10 },
          brandVoiceScore: 90,
          brandVoiceTone: 'Authoritative commerce infrastructure',
          brandVoiceTags: ['High Conversion', 'Enterprise Grade', 'Shop Pay Dominance'],
          aiVisibilityScore: 96,
          aiCitationProbability: 'High',
          hallucinationRisk: 'Low',
          executiveSummary: 'AI models consistently cite Shopify as the industry standard for checkout conversion, with high brand recall on Shop Pay.',
          strengths: ['High AI citation frequency in commerce queries', 'Direct association with superior conversion rates', 'Shop Pay frictionless UX'],
          vulnerabilities: ['AI warnings regarding app store fee stacking', 'Vendor lock-in friction cited against WooCommerce'],
          keyThemes: [
            { theme: 'Checkout Conversion', sentiment: 'positive', weight: 10, quotes: ['consistently cited as the leading solution', 'Shop Pay 1-click conversion advantage'] },
            { theme: 'Total Cost of Ownership', sentiment: 'neutral', weight: 7, quotes: ['caution prospective merchants about high app fees and vendor lock-in'] }
          ],
          brandClaims: [
            { claim: 'Shop Pay provides superior conversion', status: 'verified', rationale: 'Widely cited industry benchmark.' }
          ],
          competitorMentions: [
            { name: 'WooCommerce', context: 'Open-source alternative cited for zero vendor lock-in', sentimentVsBrand: 'neutral' }
          ],
          actionableRecommendations: [
            'Publish transparent TCO (Total Cost of Ownership) comparison calculators to rebut AI mentions of app fee stacking.',
            'Strengthen AI knowledge graph entity markers around developer flexibility.'
          ],
          modelUsed: 'gemini-3.8-flash',
          provider: 'gemini',
          latencyMs: 980,
          tokensUsed: { prompt: 350, completion: 310, total: 660 },
          analyzedAt: new Date(Date.now() - 3600 * 24 * 1 * 1000).toISOString(),
          isSimulation: false,
        }
      }
    ];
    saveReviews(initialReviews);
  }
}

initializeSeedData();

// Helper: Sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Mask API Key
function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '********';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// Fallback Heuristic Analysis Engine when provider is 'none' or simulation
function generateHeuristicAnalysis(
  content: string,
  brandName: string,
  competitors: string[] = [],
  productOrService?: string
): any {
  const lower = content.toLowerCase();
  const positiveWords = ['great', 'unmatched', 'love', 'fast', 'accelerated', 'excellent', 'reliable', 'intuitive', 'win', 'clean', 'best', 'flawless', 'powerful', 'gamechanger', 'exceptional'];
  const negativeWords = ['sluggish', 'frustrating', 'slow', 'quirk', 'bug', 'error', 'expensive', 'lock-in', 'unreliable', 'bad', 'lag', 'failed', 'terrible', 'annoying', 'broken'];

  let posCount = 0;
  let negCount = 0;
  positiveWords.forEach((w) => {
    const matches = lower.split(w).length - 1;
    posCount += matches;
  });
  negativeWords.forEach((w) => {
    const matches = lower.split(w).length - 1;
    negCount += matches;
  });

  const totalWords = Math.max(1, posCount + negCount);
  let score = Math.round(50 + (posCount - negCount) * 8);
  score = Math.min(96, Math.max(15, score));

  const positivePercent = Math.min(85, Math.max(10, Math.round((posCount / totalWords) * 70 + 20)));
  const negativePercent = Math.min(80, Math.max(5, Math.round((negCount / totalWords) * 70 + 10)));
  const neutralPercent = Math.max(5, 100 - positivePercent - negativePercent);

  let overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
  if (score >= 68) overallSentiment = 'positive';
  else if (score <= 42) overallSentiment = 'negative';
  else overallSentiment = posCount > 0 && negCount > 0 ? 'mixed' : 'neutral';

  const brand = brandName || 'Target Brand';
  const detectedCompetitors = competitors.length > 0 ? competitors : ['Market Alternative A', 'Alternative B'];

  return {
    overallSentiment,
    sentimentScore: score,
    sentimentBreakdown: {
      positive: positivePercent,
      neutral: neutralPercent,
      negative: negativePercent,
    },
    brandVoiceScore: Math.min(95, 65 + (posCount % 20)),
    brandVoiceTone: score > 70 ? 'Authoritative, Customer-Centric, Modern' : score > 45 ? 'Informative with Critical Feedback' : 'Distressed Customer Friction',
    brandVoiceTags: [
      brand + ' Core Value',
      score > 60 ? 'Positive Brand Affinity' : 'Friction Point Detected',
      'Market Relevance',
      'AI Retrievable Sentiment'
    ],
    aiVisibilityScore: Math.min(98, 75 + ((content.length / 50) % 20)),
    aiCitationProbability: content.length > 200 ? 'High' : 'Medium',
    hallucinationRisk: 'Low',
    executiveSummary: `Brand analysis for ${brand} indicates a ${overallSentiment} profile with an aggregate brand sentiment score of ${score}/100. Key discussion drivers emphasize product capability, operational reliability, and competitive comparisons against ${detectedCompetitors.slice(0, 2).join(' and ')}.`,
    strengths: [
      `High recognition for core functionality in ${productOrService || 'key service offerings'}`,
      `Strong customer recommendation signals across positive touchpoints`,
      `Distinct brand presence compared to standard alternatives`
    ],
    vulnerabilities: [
      negCount > 0 ? `Explicit friction noted regarding latency or friction points` : `Need for ongoing reinforcement against market competitors`,
      `Potential risk of unaddressed negative perceptions in AI summaries`
    ],
    keyThemes: [
      {
        theme: 'Core Product Utility & Reliability',
        sentiment: overallSentiment === 'negative' ? 'negative' : 'positive',
        weight: 9,
        quotes: content.length > 100 ? [content.slice(0, 110) + '...'] : [content],
      },
      {
        theme: 'Competitive Positioning & Alternative Choices',
        sentiment: 'neutral',
        weight: 7,
        quotes: [`Evaluated against ${detectedCompetitors.join(', ')}`],
      }
    ],
    brandClaims: [
      {
        claim: `${brand} delivers competitive advantages in its domain`,
        status: score > 50 ? 'verified' : 'disputed',
        rationale: 'Inferred from user-generated sentiment and brand expression patterns.',
      }
    ],
    competitorMentions: detectedCompetitors.map((comp) => ({
      name: comp,
      context: `Referenced as alternative or comparative benchmark against ${brand}`,
      sentimentVsBrand: score >= 60 ? 'favorable' : 'neutral',
    })),
    actionableRecommendations: [
      `Optimize generative engine citations by publishing structured benchmark case studies for ${brand}.`,
      `Address recurring friction points identified in customer feedback before they become dominant AI perception patterns.`,
      `Maintain regular AI citation audits to track how LLMs synthesize your product against ${detectedCompetitors[0] || 'competitors'}.`
    ],
    modelUsed: 'brandtrace-heuristic-v1',
    provider: 'none',
    latencyMs: 180,
    tokensUsed: { prompt: Math.round(content.length / 4), completion: 280, total: Math.round(content.length / 4) + 280 },
    analyzedAt: new Date().toISOString(),
    isSimulation: true,
  };
}

// Build BrandTrace Prompt
function buildBrandTracePrompt(brandName: string, productOrService: string, content: string, competitors: string[], source: string): string {
  return `You are BrandTrace AI, an elite brand intelligence analyst and Generative Engine Optimization (GEO) specialist.
Analyze the following text regarding the brand "${brandName}" (Product/Service: "${productOrService || 'General'}").
Source type: ${source}.
Competitors to evaluate: ${competitors.length > 0 ? competitors.join(', ') : 'None specified'}.

TEXT TO ANALYZE:
"""
${content}
"""

You MUST respond strictly with valid JSON only (no markdown code block fences, no commentary).
Format:
{
  "overallSentiment": "positive" | "neutral" | "negative" | "mixed",
  "sentimentScore": <integer 0 to 100>,
  "sentimentBreakdown": {
    "positive": <integer percent>,
    "neutral": <integer percent>,
    "negative": <integer percent>
  },
  "brandVoiceScore": <integer 0 to 100>,
  "brandVoiceTone": "<string describing tone, e.g. Authoritative, Innovative, etc.>",
  "brandVoiceTags": ["<tag1>", "<tag2>", "<tag3>"],
  "aiVisibilityScore": <integer 0 to 100>,
  "aiCitationProbability": "High" | "Medium" | "Low",
  "hallucinationRisk": "Low" | "Moderate" | "High",
  "executiveSummary": "<2-3 sentence strategic summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "vulnerabilities": ["<vulnerability 1>", "<vulnerability 2>"],
  "keyThemes": [
    {
      "theme": "<theme name>",
      "sentiment": "positive" | "neutral" | "negative",
      "weight": <integer 1 to 10>,
      "quotes": ["<quote from text>"]
    }
  ],
  "brandClaims": [
    {
      "claim": "<key claim extracted>",
      "status": "verified" | "unsubstantiated" | "disputed" | "opinion",
      "rationale": "<brief reason>"
    }
  ],
  "competitorMentions": [
    {
      "name": "<competitor name>",
      "context": "<how they are mentioned or compared>",
      "sentimentVsBrand": "favorable" | "neutral" | "unfavorable"
    }
  ],
  "actionableRecommendations": [
    "<actionable advice 1 for marketing / GEO / reputation management>",
    "<actionable advice 2>",
    "<actionable advice 3>"
  ]
}`;
}

// Clean JSON response string from LLMs
function parseCleanJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

// Multi-provider Execution with timeout & retries
async function executeLlmAnalysis(
  provider: 'none' | 'anthropic' | 'openai_compatible' | 'gemini',
  apiKey: string,
  model: string,
  baseUrl: string,
  prompt: string,
  timeoutSeconds: number,
  maxRetries: number,
  retryDelaySeconds: number
): Promise<{ data: any; latencyMs: number; tokensUsed?: any; modelUsed: string }> {
  const startTime = Date.now();
  const timeoutMs = (timeoutSeconds || 30) * 1000;

  if (provider === 'none' || !apiKey) {
    throw new Error('No API key provided or provider set to none');
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    try {
      if (provider === 'anthropic') {
        const endpoint = (baseUrl || 'https://api.anthropic.com').replace(/\/$/, '') + '/v1/messages';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: 3000,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Anthropic API error (${response.status}): ${errText}`);
        }

        const json = await response.json();
        const latencyMs = Date.now() - startTime;
        const textContent = json.content?.[0]?.text || '';
        const parsed = parseCleanJson(textContent);

        return {
          data: parsed,
          latencyMs,
          tokensUsed: {
            prompt: json.usage?.input_tokens,
            completion: json.usage?.output_tokens,
            total: (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0),
          },
          modelUsed: model || 'claude-3-5-sonnet-20241022',
        };
      }

      if (provider === 'openai_compatible') {
        const rootUrl =
          baseUrl ||
          (model.startsWith('gemini')
            ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
            : 'https://api.openai.com/v1');
        const endpoint = rootUrl.replace(/\/$/, '') + '/chat/completions';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let response: Response;
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model || 'gemini-3.8-flash',
              messages: [
                { role: 'system', content: 'You are a brand analysis AI. Respond only in valid JSON.' },
                { role: 'user', content: prompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0,
            }),
            signal: controller.signal,
          });
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            throw new Error(`The AI provider did not respond within ${timeoutSeconds} seconds.`);
          }
          throw new Error('Could not reach the AI provider (network error).');
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('The AI provider rejected the configured credentials. Check LLM_API_KEY.');
          }
          if (response.status === 429) {
            throw new Error('The AI provider rate limit was reached. Try again shortly.');
          }
          if (response.status === 503) {
            throw new Error('The AI provider reported a server error (HTTP 503). This model is currently experiencing high demand. Spikes in demand are usually temporary.');
          }
          if (response.status >= 500) {
            throw new Error(`The AI provider reported a server error (HTTP ${response.status}).`);
          }
          throw new Error(`The AI provider rejected the request (HTTP ${response.status}). Check LLM_MODEL and LLM_BASE_URL.`);
        }

        const json = await response.json();
        const latencyMs = Date.now() - startTime;
        const contentStr = json.choices?.[0]?.message?.content || '{}';
        const parsed = parseCleanJson(contentStr);

        return {
          data: parsed,
          latencyMs,
          tokensUsed: {
            prompt: json.usage?.prompt_tokens,
            completion: json.usage?.completion_tokens,
            total: json.usage?.total_tokens,
          },
          modelUsed: model || 'gemini-3.8-flash',
        };
      }

      if (provider === 'gemini') {
        const genAIKey = apiKey || process.env.GEMINI_API_KEY;
        if (!genAIKey) {
          throw new Error('Gemini API key is required');
        }
        const ai = new GoogleGenAI({ apiKey: genAIKey });
        const targetModel = model || 'gemini-3.8-flash';

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutSeconds}s`)), timeoutMs)
        );

        const generatePromise = ai.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        const latencyMs = Date.now() - startTime;
        const rawText = response.text || '{}';
        const parsed = parseCleanJson(rawText);

        return {
          data: parsed,
          latencyMs,
          tokensUsed: {
            prompt: response.usageMetadata?.promptTokenCount,
            completion: response.usageMetadata?.candidatesTokenCount,
            total: response.usageMetadata?.totalTokenCount,
          },
          modelUsed: targetModel,
        };
      }

      throw new Error(`Unsupported provider: ${provider}`);
    } catch (err: any) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        await sleep(retryDelaySeconds * 1000);
      }
    }
  }

  throw lastError;
}

// Server App
async function startServer() {
  const app = express();

  // CORS middleware respecting CORS_ORIGINS
  app.use((req, res, next) => {
    const allowed = runtimeConfig.cors_origins.split(',').map((o) => o.trim()).filter(Boolean);
    const origin = req.headers.origin;

    if (allowed.length > 0 && origin) {
      if (allowed.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Request size limit (Basic Safety requirement: 2MB payload cap)
  app.use(express.json({ limit: '2mb' }));

  // Initialize SQLite Database
  const db = getDatabase(runtimeConfig.brandtrace_db);

  // Helper: Extract workspace scoping (defaults to 'demo')
  // Note: Client-provided workspace scoping provides demonstration partitioning,
  // not cryptographic multi-tenant access control.
  function getWorkspaceId(req: express.Request): string {
    const headerWs = req.headers['x-workspace-id'];
    if (typeof headerWs === 'string' && headerWs.trim()) {
      return headerWs.trim().slice(0, 64);
    }
    const queryWs = req.query.workspace_id;
    if (typeof queryWs === 'string' && queryWs.trim()) {
      return queryWs.trim().slice(0, 64);
    }
    if (req.body && typeof req.body.workspace_id === 'string' && req.body.workspace_id.trim()) {
      return req.body.workspace_id.trim().slice(0, 64);
    }
    return 'demo';
  }

  // ---- API ROUTES ----

  // 1. Health & Config status
  app.get('/api/health', (req, res) => {
    const rate = checkRateLimit();
    res.json({
      status: 'ok',
      version: '1.2.0',
      uptime: process.uptime(),
      provider: runtimeConfig.llm_provider,
      storage_mode: runtimeConfig.storage_mode,
      rateLimit: rate,
      rate_limit_policy: 'in-memory (resets on server restart)',
      database: 'SQLite (node:sqlite native)',
    });
  });

  // 2. Public Configuration (safe masked data, never exposes raw key)
  app.get('/api/config', (req, res) => {
    const rate = checkRateLimit();
    const effectiveKey = runtimeConfig.llm_api_key || (runtimeConfig.llm_provider === 'gemini' || runtimeConfig.llm_provider === 'openai_compatible' ? process.env.GEMINI_API_KEY || '' : '');

    const isConfigured = Boolean(effectiveKey) && runtimeConfig.llm_provider !== 'none';
    const message = isConfigured
      ? 'AI analysis is configured. Submitted drafts are sent to the configured provider.'
      : 'AI analysis is not configured. Rule checks and keyword retrieval run locally without external API calls.';

    res.json({
      llm_configured: isConfigured,
      provider: runtimeConfig.llm_provider,
      model: runtimeConfig.llm_model,
      base_url: runtimeConfig.llm_base_url,
      message,
      llm_provider: runtimeConfig.llm_provider,
      has_api_key: Boolean(effectiveKey),
      masked_api_key: maskKey(effectiveKey),
      llm_model: runtimeConfig.llm_model,
      llm_base_url: runtimeConfig.llm_base_url,
      llm_timeout_seconds: runtimeConfig.llm_timeout_seconds,
      llm_max_retries: runtimeConfig.llm_max_retries,
      llm_retry_delay_seconds: runtimeConfig.llm_retry_delay_seconds,
      llm_max_calls_per_hour: runtimeConfig.llm_max_calls_per_hour,
      brandtrace_db: runtimeConfig.brandtrace_db,
      storage_mode: runtimeConfig.storage_mode,
      cors_origins: runtimeConfig.cors_origins,
      calls_this_hour: hourlyCallCount,
      calls_remaining: rate.remaining,
      reset_in_seconds: rate.resetIn,
      rate_limit_type: 'in-memory (resets on server restart)',
      privacy_notice: 'Client-provided workspace scoping provides demonstration isolation, not cryptographic multi-tenant access control. When an external LLM key is configured, content is transmitted securely to that provider. Deterministic rules always run locally.',
      gemini_env_available: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // ---------------------------------------------------------------------------
  // BRAND KIT & WORKSPACE API (Stage 2)
  // ---------------------------------------------------------------------------

  // Workspaces list
  app.get('/api/workspaces', (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM workspaces ORDER BY created_at ASC').all();
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // One-click Reset to Fictional Demo Workspace
  app.post('/api/workspaces/reset-demo', (req, res) => {
    try {
      seedDemoWorkspace(db, true);
      res.json({
        success: true,
        message: 'Fictional demo workspace has been reset to pristine seed rules and sources.',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sources: List for active workspace
  app.get('/api/sources', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const rows = db
        .prepare('SELECT * FROM sources WHERE workspace_id = ? ORDER BY id ASC')
        .all(ws) as any[];

      // Format for UI consumption
      const formatted = rows.map((r) => ({
        id: r.id,
        workspace_id: r.workspace_id,
        name: r.name,
        section: r.section,
        text: r.text,
        excerpt: r.text,
        doc_type: r.doc_type,
        is_sample: Boolean(r.is_sample),
        created_at: r.created_at,
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sources: Add Source
  app.post('/api/sources', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const { name, section, text, doc_type } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Source name is required.' });
        return;
      }
      if (!section || !section.trim()) {
        res.status(400).json({ error: 'Source section is required.' });
        return;
      }
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Source text/excerpt is required.' });
        return;
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO sources (workspace_id, name, section, text, doc_type, is_sample, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `);
      stmt.run(ws, name.trim(), section.trim(), text.trim(), (doc_type || 'general').trim(), now);

      const created = db.prepare('SELECT * FROM sources WHERE workspace_id = ? ORDER BY id DESC LIMIT 1').get(ws) as any;
      res.status(201).json({
        success: true,
        source: { ...created, excerpt: created.text, is_sample: false },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sources: Edit Source
  app.put('/api/sources/:id', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const id = Number(req.params.id);
      const { name, section, text, doc_type } = req.body;

      const existing = db.prepare('SELECT * FROM sources WHERE id = ? AND workspace_id = ?').get(id, ws);
      if (!existing) {
        res.status(404).json({ error: `Source ${id} not found in workspace ${ws}.` });
        return;
      }

      db.prepare(`
        UPDATE sources
        SET name = COALESCE(?, name),
            section = COALESCE(?, section),
            text = COALESCE(?, text),
            doc_type = COALESCE(?, doc_type)
        WHERE id = ? AND workspace_id = ?
      `).run(name || null, section || null, text || null, doc_type || null, id, ws);

      const updated = db.prepare('SELECT * FROM sources WHERE id = ?').get(id) as any;
      res.json({
        success: true,
        source: { ...updated, excerpt: updated.text },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sources: Delete Source
  app.delete('/api/sources/:id', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const id = Number(req.params.id);

      const existing = db.prepare('SELECT * FROM sources WHERE id = ? AND workspace_id = ?').get(id, ws) as any;
      if (!existing) {
        res.status(404).json({ error: `Source ${id} not found.` });
        return;
      }

      if (ws === 'demo' && existing.is_sample) {
        res.status(403).json({
          error: 'Shared demo sample sources cannot be permanently deleted. Switch to a custom workspace or reset demo.',
        });
        return;
      }

      db.prepare('DELETE FROM sources WHERE id = ? AND workspace_id = ?').run(id, ws);
      // Unlink from rules
      db.prepare('UPDATE rules SET source_id = NULL WHERE source_id = ? AND workspace_id = ?').run(id, ws);

      res.json({ success: true, message: `Source ${id} deleted.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rules: List for active workspace
  app.get('/api/rules', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const rows = db
        .prepare(`
          SELECT r.*, s.name as source_name, s.section as source_section
          FROM rules r
          LEFT JOIN sources s ON r.source_id = s.id
          WHERE r.workspace_id = ?
          ORDER BY r.id ASC
        `)
        .all(ws) as any[];

      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rules: Add Rule
  app.post('/api/rules', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const { kind, term, replacement, approved_value, keyword, source_id, notes } = req.body;

      if (!kind) {
        res.status(400).json({ error: 'Rule kind is required (prohibited_term, price, tone_hype, approved_claim).' });
        return;
      }

      if (kind === 'prohibited_term' && (!term || !term.trim())) {
        res.status(400).json({ error: 'Prohibited term text is required.' });
        return;
      }

      if (kind === 'price' && (!approved_value || !approved_value.trim())) {
        res.status(400).json({ error: 'Approved price value (e.g. 49) is required.' });
        return;
      }

      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO rules (workspace_id, kind, term, replacement, approved_value, keyword, source_id, notes, is_sample, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        ws,
        kind,
        term ? term.trim() : null,
        replacement ? replacement.trim() : null,
        approved_value ? approved_value.trim() : null,
        keyword ? keyword.trim() : null,
        source_id ? Number(source_id) : null,
        notes ? notes.trim() : null,
        now
      );

      const created = db.prepare('SELECT * FROM rules WHERE workspace_id = ? ORDER BY id DESC LIMIT 1').get(ws);
      res.status(201).json({ success: true, rule: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rules: Edit Rule
  app.put('/api/rules/:id', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const id = Number(req.params.id);
      const { kind, term, replacement, approved_value, keyword, source_id, notes } = req.body;

      const existing = db.prepare('SELECT * FROM rules WHERE id = ? AND workspace_id = ?').get(id, ws);
      if (!existing) {
        res.status(404).json({ error: `Rule ${id} not found.` });
        return;
      }

      db.prepare(`
        UPDATE rules
        SET kind = COALESCE(?, kind),
            term = COALESCE(?, term),
            replacement = COALESCE(?, replacement),
            approved_value = COALESCE(?, approved_value),
            keyword = COALESCE(?, keyword),
            source_id = COALESCE(?, source_id),
            notes = COALESCE(?, notes)
        WHERE id = ? AND workspace_id = ?
      `).run(
        kind || null,
        term !== undefined ? term : null,
        replacement !== undefined ? replacement : null,
        approved_value !== undefined ? approved_value : null,
        keyword !== undefined ? keyword : null,
        source_id !== undefined ? Number(source_id) : null,
        notes !== undefined ? notes : null,
        id,
        ws
      );

      const updated = db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
      res.json({ success: true, rule: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rules: Delete Rule
  app.delete('/api/rules/:id', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const id = Number(req.params.id);

      const existing = db.prepare('SELECT * FROM rules WHERE id = ? AND workspace_id = ?').get(id, ws) as any;
      if (!existing) {
        res.status(404).json({ error: `Rule ${id} not found.` });
        return;
      }

      if (ws === 'demo' && existing.is_sample) {
        res.status(403).json({
          error: 'Shared demo sample rules cannot be permanently deleted. Switch to a custom workspace or reset demo.',
        });
        return;
      }

      db.prepare('DELETE FROM rules WHERE id = ? AND workspace_id = ?').run(id, ws);
      res.json({ success: true, message: `Rule ${id} deleted.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // BrandKit: CSV/JSON Import Preview
  app.post('/api/brandkit/import/preview', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const { format, content, targetType } = req.body; // targetType: 'rules' | 'sources'

      if (!content || !content.trim()) {
        res.status(400).json({ error: 'Import content is empty.' });
        return;
      }

      let parsedRows: any[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      if (format === 'json') {
        try {
          const raw = JSON.parse(content);
          parsedRows = Array.isArray(raw) ? raw : [raw];
        } catch {
          res.status(400).json({ error: 'Invalid JSON format.' });
          return;
        }
      } else {
        // Simple CSV parser
        const lines = content.trim().split(/\r?\n/).filter((l: string) => l.trim().length > 0);
        if (lines.length < 2) {
          res.status(400).json({ error: 'CSV requires a header row and at least one data row.' });
          return;
        }

        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map((c: string) => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj: any = {};
          headers.forEach((h: string, idx: number) => {
            rowObj[h] = cells[idx] || '';
          });
          parsedRows.push(rowObj);
        }
      }

      // Check max row limit (100 rows)
      if (parsedRows.length > 100) {
        errors.push(`Row limit exceeded: Maximum 100 rows per import (got ${parsedRows.length}).`);
      }

      // Validate required fields
      const validRows: any[] = [];
      const existingRules = db.prepare('SELECT term, kind FROM rules WHERE workspace_id = ?').all(ws) as any[];
      const existingSources = db.prepare('SELECT name, section FROM sources WHERE workspace_id = ?').all(ws) as any[];

      parsedRows.slice(0, 100).forEach((row, idx) => {
        const rowNum = idx + 1;
        if (targetType === 'sources') {
          if (!row.name || !row.name.trim()) {
            errors.push(`Row ${rowNum}: Missing required field "name".`);
            return;
          }
          if (!row.section || !row.section.trim()) {
            errors.push(`Row ${rowNum}: Missing required field "section".`);
            return;
          }
          if (!row.text || !row.text.trim()) {
            errors.push(`Row ${rowNum}: Missing required field "text".`);
            return;
          }

          const isDup = existingSources.some((s) => s.name.toLowerCase() === row.name.toLowerCase() && s.section.toLowerCase() === row.section.toLowerCase());
          if (isDup) {
            warnings.push(`Row ${rowNum}: Potential duplicate source "${row.name}" (${row.section}).`);
          }
          validRows.push({
            name: row.name.trim(),
            section: row.section.trim(),
            text: row.text.trim(),
            doc_type: row.doc_type || 'general',
          });
        } else {
          // Rules
          const kind = (row.kind || 'prohibited_term').trim();
          if (kind === 'prohibited_term' && (!row.term || !row.term.trim())) {
            errors.push(`Row ${rowNum}: Prohibited term requires "term".`);
            return;
          }
          if (kind === 'price' && (!row.approved_value || !row.approved_value.trim())) {
            errors.push(`Row ${rowNum}: Pricing rule requires "approved_value" (e.g. 49).`);
            return;
          }

          if (row.term) {
            const isDup = existingRules.some((r) => r.term && r.term.toLowerCase() === row.term.toLowerCase());
            if (isDup) {
              warnings.push(`Row ${rowNum}: Term "${row.term}" already exists in workspace.`);
            }
          }

          validRows.push({
            kind,
            term: row.term ? row.term.trim() : null,
            replacement: row.replacement ? row.replacement.trim() : null,
            approved_value: row.approved_value ? row.approved_value.trim() : null,
            keyword: row.keyword ? row.keyword.trim() : 'standard',
            source_id: row.source_id ? Number(row.source_id) : null,
            notes: row.notes ? row.notes.trim() : null,
          });
        }
      });

      res.json({
        valid: errors.length === 0,
        totalRows: parsedRows.length,
        validRowsCount: validRows.length,
        preview: validRows.slice(0, 5),
        errors,
        warnings,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // BrandKit: CSV/JSON Import Execution (Atomic Database Transaction)
  app.post('/api/brandkit/import', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const { targetType, items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'No validated items provided for import.' });
        return;
      }
      if (items.length > 100) {
        res.status(400).json({ error: 'Import row limit exceeded (max 100 items).' });
        return;
      }

      const now = new Date().toISOString();

      // Begin atomic transaction
      db.exec('BEGIN TRANSACTION');
      try {
        if (targetType === 'sources') {
          const stmt = db.prepare(`
            INSERT INTO sources (workspace_id, name, section, text, doc_type, is_sample, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?)
          `);
          for (const s of items) {
            stmt.run(ws, s.name, s.section, s.text, s.doc_type || 'general', now);
          }
        } else {
          const stmt = db.prepare(`
            INSERT INTO rules (workspace_id, kind, term, replacement, approved_value, keyword, source_id, notes, is_sample, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
          `);
          for (const r of items) {
            stmt.run(
              ws,
              r.kind,
              r.term || null,
              r.replacement || null,
              r.approved_value || null,
              r.keyword || null,
              r.source_id ? Number(r.source_id) : null,
              r.notes || null,
              now
            );
          }
        }
        db.exec('COMMIT');

        res.json({
          success: true,
          importedCount: items.length,
          message: `Successfully imported ${items.length} ${targetType} into workspace "${ws}".`,
        });
      } catch (txnErr: any) {
        db.exec('ROLLBACK');
        throw txnErr;
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // BrandKit: Export Sources & Rules
  app.get('/api/brandkit/export', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const sources = db.prepare('SELECT * FROM sources WHERE workspace_id = ?').all(ws);
      const rules = db.prepare('SELECT * FROM rules WHERE workspace_id = ?').all(ws);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="brandkit-${ws}.json"`);
      res.json({
        workspace_id: ws,
        exported_at: new Date().toISOString(),
        sources,
        rules,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // SAFETY & DATA DELETION (Stage 4)
  // ---------------------------------------------------------------------------

  // Delete My Data with confirmation
  app.post('/api/workspace/delete-data', (req, res) => {
    try {
      const ws = getWorkspaceId(req);
      const { confirm } = req.body;

      if (!confirm) {
        res.status(400).json({ error: 'Deletion confirmation required.' });
        return;
      }

      if (ws === 'demo') {
        // Protect shared demo seed records from permanent deletion
        // Reset demo to pristine seed records
        seedDemoWorkspace(db, true);
        res.json({
          success: true,
          message: 'Demo workspace data has been restored to default seed state. Custom review additions were removed.',
        });
        return;
      }

      // Delete custom workspace data atomically
      db.exec('BEGIN TRANSACTION');
      try {
        db.prepare('DELETE FROM rules WHERE workspace_id = ?').run(ws);
        db.prepare('DELETE FROM sources WHERE workspace_id = ?').run(ws);
        db.prepare('DELETE FROM reviews WHERE workspace_id = ?').run(ws);
        db.prepare('DELETE FROM workspaces WHERE id = ?').run(ws);
        db.exec('COMMIT');

        res.json({
          success: true,
          message: `All custom brand kit data and reviews for workspace "${ws}" have been permanently deleted.`,
        });
      } catch (delErr: any) {
        db.exec('ROLLBACK');
        throw delErr;
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Document Text Extractor (Stage 6)
  app.post('/api/extract-text', (req, res) => {
    try {
      const { text, filename, fileBase64 } = req.body;

      // Safe size check (< 5MB)
      if (fileBase64 && fileBase64.length > 5 * 1024 * 1024 * 1.37) {
        res.status(400).json({ error: 'File exceeds 5MB size limit.' });
        return;
      }

      let extracted = '';
      if (typeof text === 'string' && text.trim()) {
        extracted = text.trim();
      } else if (fileBase64) {
        // Decode base64 buffer safely
        const buf = Buffer.from(fileBase64, 'base64');
        const str = buf.toString('utf8');
        // Clean non-printable / binary junk if it's text-based
        extracted = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
      }

      if (!extracted) {
        res.status(400).json({ error: 'Could not extract readable text from file.' });
        return;
      }

      res.json({
        success: true,
        extractedText: extracted,
        filename: filename || 'uploaded-document.txt',
        characterCount: extracted.length,
        wordCount: extracted.split(/\s+/).filter(Boolean).length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'File text extraction failed.' });
    }
  });

  // ---------------------------------------------------------------------------
  // STATS & REVIEWS
  // ---------------------------------------------------------------------------

  app.get('/api/stats', (req, res) => {
    const reviews = loadReviews();
    const pending = reviews.filter((r) => r.status === 'Pending Review').length;
    const changes = reviews.filter((r) => r.status === 'Changes Requested').length;
    const approved = reviews.filter((r) => r.status === 'Approved').length;
    res.json({
      total: reviews.length,
      pending,
      changes_requested: changes,
      approved,
    });
  });

  // Review status update
  app.post('/api/reviews/:id/status', (req, res) => {
    const { status, comment } = req.body;
    const id = req.params.id;
    const reviews = loadReviews();
    const item = reviews.find((r) => String(r.id) === String(id));
    if (!item) {
      res.status(404).json({ detail: `Review ${id} not found.` });
      return;
    }
    const prevStatus = item.status || 'Pending Review';
    item.status = status;
    item.updated_at = new Date().toISOString();
    if (!item.history) item.history = [];
    item.history.push({
      id: item.history.length + 1,
      previous_status: prevStatus,
      new_status: status,
      comment: comment || null,
      created_at: new Date().toISOString(),
    });
    saveReviews(reviews);
    res.json(item);
  });

  // Export review report as markdown
  app.get('/api/reviews/:id/export', (req, res) => {
    const id = req.params.id;
    const reviews = loadReviews();
    const item = reviews.find((r) => String(r.id) === String(id));
    if (!item) {
      res.status(404).send('Review not found');
      return;
    }
    const md = `# BrandTrace Review Report: ${item.title || `Review #${item.id}`}
**Status**: ${item.status || 'Pending Review'}
**Date**: ${item.created_at || item.createdAt || new Date().toISOString()}
**Engine**: ${item.engine || 'deterministic-rules+keyword-retrieval+gemini'}

## Draft
> ${item.draft || item.content}

## Findings (${(item.findings || []).length})
${(item.findings || []).map((f: any, i: number) => `### ${i + 1}. [${f.category}] ${f.quote}
- **Severity**: ${f.severity}
- **Status**: ${f.evidence_status || 'Source-backed'}
- **Explanation**: ${f.explanation}
${f.suggestion ? `- **Suggestion**: ${f.suggestion}` : ''}
${f.source ? `- **Source**: ${f.source.name} (${f.source.section})` : ''}`).join('\n\n')}

## Score
- Score: ${item.score?.value || 70}/100 (${item.score?.label || item.status})
- Errors: ${item.score?.errors || 0}, Warnings: ${item.score?.warnings || 0}
`;
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="brandtrace-review-${id}.md"`);
    res.send(md);
  });

  // ---------------------------------------------------------------------------
  // FULL DRAFT REVIEW ENDPOINT (Dynamic Rules + SQLite Sources + LLM)
  // ---------------------------------------------------------------------------
  app.post('/api/review', async (req, res) => {
    try {
      const draft: string = (req.body.draft || req.body.content || '').trim();
      const reviewId = req.body.review_id;
      const ws = getWorkspaceId(req);

      if (!draft) {
        res.status(400).json({ detail: 'Draft is empty.' });
        return;
      }

      // 1. Run dynamic deterministic rules from SQLite
      // Any rule added, edited, or deleted in Brand Kit immediately takes effect here!
      const findings = runDynamicRules(db, ws, draft);

      // 2. Fetch relevant approved sources from SQLite for active workspace
      const allWsSources = db
        .prepare('SELECT * FROM sources WHERE workspace_id = ? ORDER BY id ASC')
        .all(ws) as any[];

      const retrieved = allWsSources.slice(0, 5).map((s) => ({
        id: s.id,
        name: s.name,
        section: s.section,
        text: s.text,
        excerpt: s.text,
        doc_type: s.doc_type,
      }));

      // 3. AI Analysis using configured provider (openai_compatible with Gemini API)
      const activeProvider = runtimeConfig.llm_provider;
      const activeKey = runtimeConfig.llm_api_key || process.env.GEMINI_API_KEY || '';
      const activeModel = runtimeConfig.llm_model || 'gemini-3.8-flash';

      let llmUsed = false;
      let analysisInfo: any = {
        retrieval_ran: true,
        llm_status: 'not_configured',
        provider: activeProvider,
        model: activeModel,
        notices: [],
        message: 'Rule checks and keyword retrieval ran locally.',
      };

      if (activeProvider !== 'none' && activeKey) {
        try {
          const systemPrompt = `You are the BrandTrace AI compliance reviewer.
Inspect the draft against the APPROVED SOURCES list.
Report issues strictly in JSON with format:
{"findings":[{"category":"Factual Contradiction|Terminology|Tone|Unsupported Claim","quote":"...","explanation":"...","severity":"error|warning|info","suggestion":"replacement or null","evidence_status":"Contradicted|Source-backed|Unverified","cited_source_ids":[1]}]}
If no additional issues are found, return {"findings":[]}.`;

          const userPrompt = `APPROVED SOURCES:
${retrieved.map((s) => `<source id="${s.id}" name="${s.name}" section="${s.section}">${s.text}</source>`).join('\n')}

DRAFT:
<draft>
${draft}
</draft>`;

          const execution = await executeLlmAnalysis(
            activeProvider,
            activeKey,
            activeModel,
            runtimeConfig.llm_base_url,
            userPrompt,
            runtimeConfig.llm_timeout_seconds,
            runtimeConfig.llm_max_retries,
            runtimeConfig.llm_retry_delay_seconds
          );

          if (execution?.data?.findings && Array.isArray(execution.data.findings)) {
            for (const f of execution.data.findings) {
              if (f.quote && draft.includes(f.quote)) {
                // Avoid duplicating deterministic rule findings
                if (!findings.some((d) => d.quote.toLowerCase() === f.quote.toLowerCase())) {
                  const sPos = draft.indexOf(f.quote);
                  const matchedSource = allWsSources.find((s) => (f.cited_source_ids || []).includes(s.id)) || null;
                  findings.push({
                    category: f.category || 'Unsupported Claim',
                    severity: f.severity || 'warning',
                    quote: f.quote,
                    start: sPos,
                    end: sPos + f.quote.length,
                    explanation: f.explanation || 'Claim requires verification against approved sources.',
                    suggestion: f.suggestion || null,
                    source: matchedSource ? { id: matchedSource.id, name: matchedSource.name, section: matchedSource.section, text: matchedSource.text } : null,
                    sources: matchedSource ? [{ id: matchedSource.id, name: matchedSource.name, section: matchedSource.section, text: matchedSource.text }] : [],
                    evidence_status: f.evidence_status || 'Unverified',
                    detected_by: 'rules', // or llm
                  });
                }
              }
            }
          }

          llmUsed = true;
          analysisInfo.llm_status = 'completed';
          analysisInfo.message = 'AI analysis completed.';
        } catch (err: any) {
          analysisInfo.llm_status = 'failed';
          analysisInfo.error_kind = 'provider_error';
          analysisInfo.message = `Analysis Unavailable: ${err.message}. Deterministic findings are displayed without external AI verification.`;
        }
      }

      // Compute score
      const errors = findings.filter((f) => f.severity === 'error').length;
      const warnings = findings.filter((f) => f.severity === 'warning').length;
      const notes = findings.filter((f) => f.severity === 'info').length;

      let scoreVal = Math.max(0, 100 - errors * 25 - warnings * 10 - notes * 5);
      let statusLabel: 'Approved' | 'Changes Requested' | 'Pending Review' = 'Pending Review';
      if (errors > 0) {
        statusLabel = 'Changes Requested';
      } else if (warnings > 0) {
        statusLabel = 'Pending Review';
      } else {
        statusLabel = 'Approved';
      }

      const scoreInfo = {
        value: scoreVal,
        label: statusLabel,
        errors,
        warnings,
        notes,
        basis: errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : 'No issues detected',
      };

      const noteText =
        analysisInfo.llm_status === 'completed'
          ? 'Rule checks, keyword retrieval and AI analysis ran. AI findings are validated against stored sources, but a human must make the final decision.'
          : analysisInfo.llm_status === 'failed'
          ? analysisInfo.message
          : 'Deterministic rules and keyword retrieval ran locally. External AI was not invoked.';

      const engineName = 'deterministic-rules+sqlite-retrieval' + (llmUsed ? `+${activeProvider}(${activeModel})` : '');

      const reviews = loadReviews();
      const existingId = reviewId ? Number(reviewId) : null;
      let finalId = existingId || reviews.length + 1;

      const reviewDetail = {
        id: finalId,
        workspace_id: ws,
        draft,
        status: statusLabel,
        findings,
        engine: engineName,
        llm_used: llmUsed,
        note: noteText,
        analysis: analysisInfo,
        retrieval_engine: 'sqlite-workspace-retrieval',
        retrieval_note: `Retrieved ${retrieved.length} approved reference passages from workspace "${ws}".`,
        retrieved_sources: retrieved,
        history: [
          {
            id: 1,
            previous_status: null,
            new_status: statusLabel,
            comment: 'Initial automated check completed.',
            created_at: new Date().toISOString(),
          },
        ],
        score: scoreInfo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingId) {
        const idx = reviews.findIndex((r) => r.id === existingId || String(r.id) === String(existingId));
        if (idx !== -1) {
          reviews[idx] = { ...reviews[idx], ...reviewDetail };
        } else {
          reviews.unshift(reviewDetail);
        }
      } else {
        reviews.unshift(reviewDetail);
      }

      saveReviews(reviews);
      res.json(reviewDetail);
    } catch (err: any) {
      console.error('Review error:', err);
      res.status(500).json({ detail: err.message || 'Review execution failed' });
    }
  });

  // 3. Update Configuration (in-app settings)
  app.post('/api/config', (req, res) => {
    try {
      const {
        llm_provider,
        llm_api_key,
        llm_model,
        llm_base_url,
        llm_timeout_seconds,
        llm_max_retries,
        llm_retry_delay_seconds,
        llm_max_calls_per_hour,
        brandtrace_db,
        storage_mode,
      } = req.body;

      if (llm_provider !== undefined) runtimeConfig.llm_provider = llm_provider;
      if (llm_api_key !== undefined) runtimeConfig.llm_api_key = llm_api_key;
      if (llm_model !== undefined) runtimeConfig.llm_model = llm_model;
      if (llm_base_url !== undefined) runtimeConfig.llm_base_url = llm_base_url;
      if (llm_timeout_seconds !== undefined) runtimeConfig.llm_timeout_seconds = Number(llm_timeout_seconds);
      if (llm_max_retries !== undefined) runtimeConfig.llm_max_retries = Number(llm_max_retries);
      if (llm_retry_delay_seconds !== undefined) runtimeConfig.llm_retry_delay_seconds = Number(llm_retry_delay_seconds);
      if (llm_max_calls_per_hour !== undefined) runtimeConfig.llm_max_calls_per_hour = Number(llm_max_calls_per_hour);
      if (brandtrace_db !== undefined) runtimeConfig.brandtrace_db = brandtrace_db;
      if (storage_mode !== undefined) runtimeConfig.storage_mode = storage_mode;

      const rate = checkRateLimit();
      const effectiveKey = runtimeConfig.llm_api_key || (runtimeConfig.llm_provider === 'gemini' ? process.env.GEMINI_API_KEY || '' : '');

      res.json({
        success: true,
        message: 'BrandTrace configuration updated successfully',
        config: {
          llm_provider: runtimeConfig.llm_provider,
          has_api_key: Boolean(effectiveKey),
          masked_api_key: maskKey(effectiveKey),
          llm_model: runtimeConfig.llm_model,
          llm_base_url: runtimeConfig.llm_base_url,
          llm_timeout_seconds: runtimeConfig.llm_timeout_seconds,
          llm_max_retries: runtimeConfig.llm_max_retries,
          llm_retry_delay_seconds: runtimeConfig.llm_retry_delay_seconds,
          llm_max_calls_per_hour: runtimeConfig.llm_max_calls_per_hour,
          brandtrace_db: runtimeConfig.brandtrace_db,
          storage_mode: runtimeConfig.storage_mode,
          calls_this_hour: hourlyCallCount,
          calls_remaining: rate.remaining,
          reset_in_seconds: rate.resetIn,
          gemini_env_available: Boolean(process.env.GEMINI_API_KEY),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Test Connection
  app.post('/api/test-connection', async (req, res) => {
    const { provider, apiKey, model, baseUrl } = req.body;
    const testProvider = provider || runtimeConfig.llm_provider;
    const testKey = apiKey || runtimeConfig.llm_api_key || (testProvider === 'gemini' ? process.env.GEMINI_API_KEY || '' : '');
    const testModel = model || runtimeConfig.llm_model;
    const testBaseUrl = baseUrl !== undefined ? baseUrl : runtimeConfig.llm_base_url;

    if (testProvider === 'none') {
      res.json({
        success: true,
        provider: 'none',
        model: 'brandtrace-heuristic-v1',
        latencyMs: 15,
        message: 'Simulator mode active. Deterministic BrandTrace heuristics will be used.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!testKey) {
      res.status(400).json({
        success: false,
        provider: testProvider,
        message: `API Key is required for provider "${testProvider}". Please enter a valid API key.`,
      });
      return;
    }

    try {
      const startTime = Date.now();
      const testPrompt = 'Respond strictly with JSON: {"status": "ok", "message": "BrandTrace connection verified"}';

      const result = await executeLlmAnalysis(
        testProvider,
        testKey,
        testModel,
        testBaseUrl,
        testPrompt,
        15,
        0,
        1
      );

      res.json({
        success: true,
        provider: testProvider,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        message: `Connected successfully to ${testProvider} (${result.modelUsed}) in ${result.latencyMs}ms!`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        provider: testProvider,
        message: err.message || 'Connection test failed',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 5. Brand & Review AI Analysis
  app.post('/api/analyze', async (req, res) => {
    try {
      const {
        brandName,
        productOrService,
        content,
        competitors = [],
        source = 'customer_review',
        overrideProvider,
        overrideApiKey,
        overrideModel,
      } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ error: 'Content to analyze is required' });
        return;
      }

      // Check Rate Limit
      const rate = checkRateLimit();
      if (!rate.allowed) {
        res.status(429).json({
          error: `Hourly AI call limit reached (${runtimeConfig.llm_max_calls_per_hour} calls/hour). Try again in ${Math.ceil(rate.resetIn / 60)} minutes.`,
          reset_in_seconds: rate.resetIn,
          calls_this_hour: hourlyCallCount,
        });
        return;
      }

      const activeProvider = overrideProvider || runtimeConfig.llm_provider;
      const activeKey = overrideApiKey || runtimeConfig.llm_api_key || (activeProvider === 'gemini' ? process.env.GEMINI_API_KEY || '' : '');
      const activeModel = overrideModel || runtimeConfig.llm_model;

      // Increment rate bucket
      incrementRateLimit();

      // If provider is none or no API key, use fallback heuristic
      if (activeProvider === 'none' || !activeKey) {
        const simulated = generateHeuristicAnalysis(content, brandName, competitors, productOrService);
        res.json({
          success: true,
          result: simulated,
          warning: !activeKey && activeProvider !== 'none'
            ? `API key for provider "${activeProvider}" was not detected. Generated analysis using BrandTrace Heuristic Engine.`
            : null,
        });
        return;
      }

      // Execute Real LLM
      const prompt = buildBrandTracePrompt(brandName, productOrService, content, competitors, source);
      const execution = await executeLlmAnalysis(
        activeProvider,
        activeKey,
        activeModel,
        runtimeConfig.llm_base_url,
        prompt,
        runtimeConfig.llm_timeout_seconds,
        runtimeConfig.llm_max_retries,
        runtimeConfig.llm_retry_delay_seconds
      );

      const parsedResult = execution.data;
      const finalResult = {
        overallSentiment: parsedResult.overallSentiment || 'neutral',
        sentimentScore: Number(parsedResult.sentimentScore ?? 70),
        sentimentBreakdown: parsedResult.sentimentBreakdown || { positive: 60, neutral: 30, negative: 10 },
        brandVoiceScore: Number(parsedResult.brandVoiceScore ?? 80),
        brandVoiceTone: parsedResult.brandVoiceTone || 'Modern & Direct',
        brandVoiceTags: parsedResult.brandVoiceTags || [brandName + ' Core'],
        aiVisibilityScore: Number(parsedResult.aiVisibilityScore ?? 85),
        aiCitationProbability: parsedResult.aiCitationProbability || 'High',
        hallucinationRisk: parsedResult.hallucinationRisk || 'Low',
        executiveSummary: parsedResult.executiveSummary || 'Brand audit successfully generated.',
        strengths: parsedResult.strengths || [],
        vulnerabilities: parsedResult.vulnerabilities || [],
        keyThemes: parsedResult.keyThemes || [],
        brandClaims: parsedResult.brandClaims || [],
        competitorMentions: parsedResult.competitorMentions || [],
        actionableRecommendations: parsedResult.actionableRecommendations || [],
        modelUsed: execution.modelUsed,
        provider: activeProvider,
        latencyMs: execution.latencyMs,
        tokensUsed: execution.tokensUsed,
        analyzedAt: new Date().toISOString(),
        isSimulation: false,
      };

      res.json({
        success: true,
        result: finalResult,
      });
    } catch (err: any) {
      console.error('Analysis error from provider:', err.message);
      // Fallback gracefully to BrandTrace Heuristic Engine so the user always receives an actionable audit
      const fallbackSimulated = generateHeuristicAnalysis(
        req.body.content || '',
        req.body.brandName || 'Brand',
        req.body.competitors || [],
        req.body.productOrService
      );

      res.json({
        success: true,
        result: fallbackSimulated,
        warning: `Upstream AI Provider notice: ${err.message || 'Transient error'}. Loaded BrandTrace Heuristic Intelligence report.`,
      });
    }
  });

  // 6. Review Database CRUD
  app.get('/api/reviews', (req, res) => {
    const reviews = loadReviews();
    res.json({
      reviews,
      count: reviews.length,
      storage_mode: runtimeConfig.storage_mode,
      brandtrace_db: runtimeConfig.brandtrace_db,
    });
  });

  app.post('/api/reviews', (req, res) => {
    try {
      const { title, brandName, productOrService, source, content, competitors, tags, analysis } = req.body;
      const reviews = loadReviews();

      const newReview = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: title || `${brandName || 'Brand'} Analysis - ${new Date().toLocaleDateString()}`,
        brandName: brandName || 'Untitled Brand',
        productOrService: productOrService || '',
        source: source || 'customer_review',
        content: content || '',
        competitors: competitors || [],
        tags: tags || [],
        createdAt: new Date().toISOString(),
        analysis: analysis || null,
      };

      reviews.unshift(newReview);
      saveReviews(reviews);

      res.json({
        success: true,
        review: newReview,
        total: reviews.length,
        storage_mode: runtimeConfig.storage_mode,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/reviews/:id', (req, res) => {
    try {
      const id = req.params.id;
      let reviews = loadReviews();
      const initialLength = reviews.length;
      reviews = reviews.filter((r) => r.id !== id);
      saveReviews(reviews);

      res.json({
        success: true,
        deleted: initialLength - reviews.length > 0,
        remaining: reviews.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reviews/seed', (req, res) => {
    inMemoryReviews = [];
    initializeSeedData();
    const reviews = loadReviews();
    res.json({ success: true, reviews, count: reviews.length });
  });

  // ---- VITE / STATIC INTEGRATION ----
  if (IS_DEV) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BrandTrace AI Server running on http://0.0.0.0:${PORT}`);
    console.log(`Provider: ${runtimeConfig.llm_provider} | Model: ${runtimeConfig.llm_model} | Storage: ${runtimeConfig.storage_mode}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BrandTrace server:', err);
  process.exit(1);
});
