import crypto from 'node:crypto';

// Hosts the server may send an API key to. Extra hosts must be added by the operator via ALLOWED_LLM_HOSTS.
const ALLOWED_HOSTS = new Set(['generativelanguage.googleapis.com', 'api.openai.com', 'api.anthropic.com']);

/** True only for an https URL on an allow-listed host (or the empty string, meaning "use the default"). */
export function isAllowedBaseUrl(raw: unknown): boolean {
  if (raw === '') return true;
  if (typeof raw !== 'string') return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password) return false;
    const extra = (process.env.ALLOWED_LLM_HOSTS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const host = u.hostname.toLowerCase();
    return ALLOWED_HOSTS.has(host) || extra.includes(host);
  } catch {
    return false;
  }
}

/** Constant-time comparison of an admin token. Missing values never match. */
export function tokensMatch(sent: unknown, expected: string | undefined): boolean {
  if (!expected || typeof sent !== 'string') return false;
  const a = crypto.createHash('sha256').update(sent).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Scope under which reviews are stored. The shared "demo" workspace would otherwise show every visitor's drafts to
 * every other visitor, so demo reviews are kept per browser (anonymous client id). Other workspaces use their own id.
 */
export function reviewScope(workspaceId: string, clientId: unknown): string {
  if (workspaceId !== 'demo') return workspaceId;
  const id = typeof clientId === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(clientId) ? clientId : 'anonymous';
  return `demo:${id}`;
}
