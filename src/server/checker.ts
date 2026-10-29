import { DatabaseSync } from 'node:sqlite';

export interface DeterministicFinding {
  category: string;
  severity: 'error' | 'warning' | 'info';
  quote: string;
  start: number;
  end: number;
  explanation: string;
  suggestion: string | null;
  source: any | null;
  sources: any[];
  evidence_status: 'Source-backed' | 'Contradicted' | 'Unverified';
  detected_by: 'rules' | 'llm';
}

/**
 * Normalises text: quotes, dashes, hyphens, and collapses redundant whitespace.
 */
export function normalizeText(text: string): string {
  let t = text;
  // Unicode single and double quotes
  t = t.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  t = t.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  // Unicode hyphens, en-dash, em-dash, non-breaking hyphens
  t = t.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');
  // Collapse whitespace
  t = t.replace(/\s+/g, ' ');
  return t;
}

/**
 * Levenshtein edit distance for conservative typo detection
 */
export function levenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[al][bl];
}

/**
 * Executes dynamic rules from SQLite for the given workspace against a draft.
 */
export function runDynamicRules(db: DatabaseSync, workspaceId: string, draft: string): DeterministicFinding[] {
  const findings: DeterministicFinding[] = [];
  const normDraft = normalizeText(draft);
  const normLower = normDraft.toLowerCase();

  // 1. Fetch rules and their associated sources for this workspace
  const rules = db
    .prepare(
      `SELECT r.*, s.name as source_name, s.section as source_section, s.text as source_text, s.doc_type as source_doc_type
       FROM rules r
       LEFT JOIN sources s ON r.source_id = s.id
       WHERE r.workspace_id = ?`
    )
    .all(workspaceId) as any[];

  // 2. Fetch all sources for fallback attribution
  const allSources = db
    .prepare('SELECT * FROM sources WHERE workspace_id = ?')
    .all(workspaceId) as any[];

  const formatSource = (r: any) => {
    if (r.source_id && r.source_name) {
      return {
        id: r.source_id,
        name: r.source_name,
        section: r.source_section,
        text: r.source_text,
        excerpt: r.source_text,
        doc_type: r.source_doc_type,
      };
    }
    const found = allSources.find((s) => s.id === r.source_id);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        section: found.section,
        text: found.text,
        excerpt: found.text,
        doc_type: found.doc_type,
      };
    }
    return null;
  };

  // --- Check: Prohibited Terms & Required Terminology ---
  const prohibitedRules = rules.filter((r) => r.kind === 'prohibited_term' && r.term);
  for (const rule of prohibitedRules) {
    const term = rule.term.trim();
    const sourceObj = formatSource(rule);

    // Regex with flexible whitespace/hyphen matching: e.g. "BrandTrace Suite" matches "BrandTrace-Suite", "brandtrace suite"
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\-]+');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    let match: RegExpExecArray | null;
    let foundExact = false;
    while ((match = regex.exec(normDraft)) !== null) {
      foundExact = true;
      const quote = match[0];
      const start = draft.toLowerCase().indexOf(quote.toLowerCase());
      const end = start !== -1 ? start + quote.length : match.index + quote.length;

      findings.push({
        category: 'Terminology',
        severity: 'error',
        quote,
        start: start !== -1 ? start : match.index,
        end,
        explanation: rule.notes || `"${quote}" is a prohibited product name. Use "${rule.replacement || 'approved naming'}".`,
        suggestion: rule.replacement || null,
        source: sourceObj,
        sources: sourceObj ? [sourceObj] : [],
        evidence_status: 'Source-backed',
        detected_by: 'rules',
      });
    }

    // Conservative Fuzzy typo match (Levenshtein distance = 1) for words with length >= 6
    if (!foundExact && term.length >= 6) {
      const words = normDraft.split(/\s+/);
      const termWordsCount = term.split(/\s+/).length;
      for (let i = 0; i <= words.length - termWordsCount; i++) {
        const candidate = words.slice(i, i + termWordsCount).join(' ');
        const cleanCandidate = candidate.replace(/[^\w\s]/g, '');
        if (Math.abs(cleanCandidate.length - term.length) <= 2) {
          const dist = levenshtein(cleanCandidate.toLowerCase(), term.toLowerCase());
          if (dist === 1) {
            const start = draft.indexOf(candidate);
            findings.push({
              category: 'Terminology',
              severity: 'warning',
              quote: candidate,
              start: start !== -1 ? start : 0,
              end: start !== -1 ? start + candidate.length : candidate.length,
              explanation: `Possible typo for prohibited term "${term}".`,
              suggestion: rule.replacement || null,
              source: sourceObj,
              sources: sourceObj ? [sourceObj] : [],
              evidence_status: 'Source-backed',
              detected_by: 'rules',
            });
            break;
          }
        }
      }
    }
  }

  // --- Check: Pricing Rules (USD and INR) ---
  const priceRules = rules.filter((r) => r.kind === 'price');
  // Flexible regex patterns
  const usdRegex = /(?:\$\s?(\d+(?:\.\d{1,2})?)\s*(?:\/|\ba\b|per)\s*(?:month|mo)\b)|(?:(\d+(?:\.\d{1,2})?)\s*(?:usd|dollars)\s*(?:\/|\ba\b|per)\s*(?:month|mo)\b)/gi;
  const inrRegex = /(?:(?:rs\.?|inr|₹)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+)\s*(?:\/|\ba\b|per)?\s*(?:month|mo)?)/gi;

  const sentences = normDraft.split(/[.;\n\r]/);
  for (const sentence of sentences) {
    const sTrim = sentence.trim();
    if (!sTrim) continue;
    const sLower = sTrim.toLowerCase();

    // Check each price rule against the clause context
    for (const rule of priceRules) {
      const kw = (rule.keyword || 'standard').toLowerCase();
      const approvedVal = parseFloat(rule.approved_value || '0');
      const sourceObj = formatSource(rule);

      const hasKeyword = sLower.includes(kw);
      const isOtherProduct = /\b(?:third\s*party|add[\s-]*on|plugin|enterprise|custom)\b/i.test(sLower);

      // Check USD
      let usdMatch: RegExpExecArray | null;
      while ((usdMatch = usdRegex.exec(sTrim)) !== null) {
        const valStr = usdMatch[1] || usdMatch[2];
        const quote = usdMatch[0].trim();
        const numVal = parseFloat(valStr);

        // Check subclauses if sentence has multiple items
        const subclauses = sTrim.split(/[,|]|\b(?:while|whereas|but)\b/i);
        const sub = subclauses.find((sc) => sc.includes(quote)) || sTrim;
        const subLower = sub.toLowerCase();
        const subHasKw = subLower.includes(kw);
        const subIsOther = /\b(?:third\s*party|add[\s-]*on|plugin|enterprise|custom)\b/i.test(subLower);

        if ((subHasKw || (hasKeyword && !isOtherProduct)) && !subIsOther) {
          if (numVal !== approvedVal && approvedVal < 1000) {
            const start = draft.indexOf(quote);
            findings.push({
              category: 'Pricing',
              severity: 'error',
              quote,
              start: start !== -1 ? start : 0,
              end: start !== -1 ? start + quote.length : quote.length,
              explanation: `Draft states ${quote} for ${rule.keyword || 'standard'} tier, but approved pricing is ${rule.replacement || `$${approvedVal}/month`}.`,
              suggestion: rule.replacement || `$${approvedVal}/month`,
              source: sourceObj,
              sources: sourceObj ? [sourceObj] : [],
              evidence_status: 'Contradicted',
              detected_by: 'rules',
            });
          }
        }
      }

      // Check INR
      let inrMatch: RegExpExecArray | null;
      while ((inrMatch = inrRegex.exec(sTrim)) !== null) {
        const rawNum = inrMatch[1].replace(/,/g, '');
        const quote = inrMatch[0].trim();
        const numVal = parseFloat(rawNum);

        if (hasKeyword && !isOtherProduct) {
          if (numVal !== approvedVal && approvedVal >= 100) {
            const start = draft.indexOf(quote);
            findings.push({
              category: 'Pricing',
              severity: 'error',
              quote,
              start: start !== -1 ? start : 0,
              end: start !== -1 ? start + quote.length : quote.length,
              explanation: `Draft states ${quote} for ${rule.keyword || 'standard'} tier, but approved INR pricing is ${rule.replacement || `₹${approvedVal}/month`}.`,
              suggestion: rule.replacement || `₹${approvedVal}/month`,
              source: sourceObj,
              sources: sourceObj ? [sourceObj] : [],
              evidence_status: 'Contradicted',
              detected_by: 'rules',
            });
          }
        }
      }
    }
  }

  // --- Check: Tone & Hype terms from dynamic rules ---
  const hypeRules = rules.filter((r) => r.kind === 'tone_hype' && r.term);
  for (const rule of hypeRules) {
    const term = rule.term.trim();
    const sourceObj = formatSource(rule);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\-]+');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    let match: RegExpExecArray | null;
    while ((match = regex.exec(normDraft)) !== null) {
      const quote = match[0];
      const start = draft.toLowerCase().indexOf(quote.toLowerCase());
      findings.push({
        category: 'Brand Voice',
        severity: 'warning',
        quote,
        start: start !== -1 ? start : match.index,
        end: start !== -1 ? start + quote.length : match.index + quote.length,
        explanation: rule.notes || `Brand Voice Guide: Avoid hype words such as "${quote}". Keep tone clear, friendly and confident.`,
        suggestion: rule.replacement || null,
        source: sourceObj,
        sources: sourceObj ? [sourceObj] : [],
        evidence_status: 'Source-backed',
        detected_by: 'rules',
      });
    }
  }

  // --- Check: Approved Claims (Human Review & Autonomous Claims) ---
  const claimRules = rules.filter((r) => r.kind === 'approved_claim');
  const humanPatterns = [
    /\b(?:no|without(?:\s+any)?)\s+human\s+(?:review|oversight|approval|involvement)\b(?:\s+(?:is\s+)?(?:needed|required|necessary))?/gi,
    /\bautomatically\s+(?:approves?|publishes?)\b/gi,
    /\breplaces?\s+(?:your|the)\s+(?:human\s+)?(?:reviewers?|review\s+team|compliance\s+team|legal\s+team)\b/gi,
  ];

  for (const pat of humanPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pat.exec(normDraft)) !== null) {
      const quote = match[0];
      const start = draft.indexOf(quote);
      const claimRule = claimRules[0];
      const sourceObj = claimRule ? formatSource(claimRule) : allSources.find((s) => s.doc_type === 'approved_claims') || null;

      findings.push({
        category: 'Approved Claims',
        severity: 'error',
        quote,
        start: start !== -1 ? start : match.index,
        end: start !== -1 ? start + quote.length : match.index + quote.length,
        explanation: 'This wording suggests content is published without a human decision. Approved claims register states a human reviewer makes the final publishing decision.',
        suggestion: 'A human reviewer makes the final publishing decision.',
        source: sourceObj,
        sources: sourceObj ? [sourceObj] : [],
        evidence_status: 'Contradicted',
        detected_by: 'rules',
      });
    }
  }

  // Remove duplicates and sort by start position
  const seenQuotes = new Set<string>();
  const uniqueFindings: DeterministicFinding[] = [];
  for (const f of findings) {
    const key = `${f.category}|${f.quote.toLowerCase()}|${f.start}`;
    if (!seenQuotes.has(key)) {
      seenQuotes.add(key);
      uniqueFindings.push(f);
    }
  }

  return uniqueFindings.sort((a, b) => a.start - b.start);
}
