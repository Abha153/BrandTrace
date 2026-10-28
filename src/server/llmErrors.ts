// Turns raw AI-provider errors (often a long JSON blob from Google) into one short, safe sentence for users,
// and provides a daily call counter. Pure code with no framework imports so it can be unit tested.

/** One short user-facing sentence. Never includes keys, URLs or the provider's raw payload. */
export function friendlyLlmError(err: unknown): string {
  const raw = String((err as any)?.message ?? err ?? '');
  if (/RESOURCE_EXHAUSTED|\b429\b|quota|rate limit/i.test(raw)) {
    return 'The AI provider quota was reached (the free tier has a daily limit). Try again later.';
  }
  if (/\b(401|403)\b|api key|credentials|permission|UNAUTHENTICATED|PERMISSION_DENIED/i.test(raw)) {
    return 'The AI provider rejected the configured key. Check GEMINI_API_KEY on the server.';
  }
  if (/\b503\b|UNAVAILABLE|overloaded|high demand/i.test(raw)) {
    return 'The AI provider is busy right now. Try again in a moment.';
  }
  if (/timed out|timeout|did not respond|abort/i.test(raw)) {
    return 'The AI provider did not respond in time.';
  }
  if (/not allowed|base url/i.test(raw)) {
    return 'The configured AI endpoint is not allowed.';
  }
  return 'The AI analysis could not be completed.';
}

/** Tumbling 24 hour counter. In memory, so it resets when the server restarts. limit <= 0 means unlimited. */
export class DailyCounter {
  private start: number;
  private count = 0;
  constructor(now = Date.now()) { this.start = now; }
  private roll(now: number) {
    if (now - this.start >= 86_400_000) { this.start = now; this.count = 0; }
  }
  check(limit: number, now = Date.now()): { allowed: boolean; remaining: number | null; resetIn: number } {
    this.roll(now);
    const resetIn = Math.max(0, Math.ceil((this.start + 86_400_000 - now) / 1000));
    if (!(limit > 0)) return { allowed: true, remaining: null, resetIn };
    if (this.count >= limit) return { allowed: false, remaining: 0, resetIn };
    return { allowed: true, remaining: limit - this.count, resetIn };
  }
  increment(now = Date.now()) { this.roll(now); this.count++; }
}
