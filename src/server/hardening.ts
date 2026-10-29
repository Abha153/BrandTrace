// Small, dependency-free helpers used by server.ts. Kept separate so they can be unit-tested without Express.

export const LLM_CATEGORIES = ['Factual Contradiction', 'Terminology', 'Tone', 'Unsupported Claim'] as const;
const SEVERITIES = ['error', 'warning', 'info'] as const;
const EVIDENCE = ['Contradicted', 'Source-backed', 'Unverified'] as const;
export const KNOWN_PROVIDERS = ['none', 'anthropic', 'openai_compatible', 'gemini'] as const;

/** Longest draft/content the review and analysis endpoints accept (characters). Bounds CPU and LLM cost. */
export const MAX_REVIEW_CHARS = 100_000;

/** Keeps only characters that are safe inside a Content-Disposition filename. */
export function safeFilenamePart(raw: unknown): string {
  const s = String(raw ?? '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
  return s || 'review';
}

/** Prefixes every line with "> " so multi-line drafts stay inside one markdown blockquote. */
export function toBlockquote(text: unknown): string {
  return String(text ?? '').split(/\r?\n/).map((l) => `> ${l}`).join('\n');
}

/**
 * Stops user-controlled text from closing the <draft>/<source> wrapper tags used in the LLM prompt.
 * This reduces prompt-structure breakout; it does not make prompt injection impossible,
 * so LLM output is still validated (see normalizeLlmFinding) and a human makes the final decision.
 */
export function neutralizePromptText(text: unknown): string {
  return String(text ?? '').replace(/<(\/?)(draft|source)\b/gi, '&lt;$1$2');
}

/** For text placed inside a double-quoted XML-style attribute. */
export function promptAttr(text: unknown): string {
  return neutralizePromptText(text).replace(/["\r\n]+/g, ' ').slice(0, 200);
}

const tokens = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9$₹]{3,}/g) ?? []);

/**
 * Picks the `k` sources that share the most words with the draft. Workspaces with <= k sources keep every
 * source in id order, so behaviour for small workspaces is unchanged. Ties keep id order.
 */
export function rankSources<T extends { id?: number; name?: string; section?: string; text?: string }>(draft: string, sources: T[], k = 5): T[] {
  if (sources.length <= k) return sources;
  const d = tokens(draft);
  const scored = sources.map((s, i) => {
    let n = 0;
    for (const t of tokens(`${s.name ?? ''} ${s.section ?? ''} ${s.text ?? ''}`)) if (d.has(t)) n++;
    return { s, n, i };
  });
  scored.sort((a, b) => b.n - a.n || a.i - b.i);
  return scored.slice(0, k).sort((a, b) => a.i - b.i).map((x) => x.s);
}

const clip = (v: unknown, max: number): string => (typeof v === 'string' ? v : '').slice(0, max);

/**
 * Validates one finding returned by an LLM. Returns null unless its quote really appears in the draft.
 * Unknown severity/category/evidence values are replaced with conservative defaults, and the finding is
 * always labelled detected_by: 'llm'.
 */
export function normalizeLlmFinding(raw: any, draft: string, sources: Array<{ id: number; name: string; section: string; text: string }>) {
  if (!raw || typeof raw !== 'object') return null;
  const quote = typeof raw.quote === 'string' ? raw.quote : '';
  if (!quote.trim() || quote.length > 500) return null;
  const start = draft.indexOf(quote);
  if (start < 0) return null;
  const ids: number[] = Array.isArray(raw.cited_source_ids) ? raw.cited_source_ids.map(Number).filter(Number.isFinite) : [];
  const src = sources.find((s) => ids.includes(s.id)) || null;
  const evidence = (EVIDENCE as readonly string[]).includes(raw.evidence_status) ? raw.evidence_status : 'Unverified';
  const citation = src ? { id: src.id, name: src.name, section: src.section, text: src.text } : null;
  return {
    category: (LLM_CATEGORIES as readonly string[]).includes(raw.category) ? raw.category : 'Unsupported Claim',
    severity: (SEVERITIES as readonly string[]).includes(raw.severity) ? raw.severity : 'warning',
    quote,
    start,
    end: start + quote.length,
    explanation: clip(raw.explanation, 1000) || 'Claim requires verification against approved sources.',
    suggestion: clip(raw.suggestion, 500) || null,
    source: citation,
    sources: citation ? [citation] : [],
    // A finding that cites no stored source cannot be "Source-backed" or "Contradicted" by one.
    evidence_status: citation ? evidence : 'Unverified',
    detected_by: 'llm' as const,
  };
}
