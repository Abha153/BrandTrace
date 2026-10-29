import { DatabaseSync } from 'node:sqlite';

export type ReviewKind = 'compliance' | 'intel';

/** Workspace-scoped review storage and audit trail. Every query filters by workspace_id. */
export function initReviewStore(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stored_reviews (
      rid TEXT NOT NULL, workspace_id TEXT NOT NULL, kind TEXT NOT NULL, status TEXT,
      body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY (workspace_id, rid)
    );
    CREATE INDEX IF NOT EXISTS idx_stored_reviews_ws ON stored_reviews(workspace_id, created_at);
    CREATE TABLE IF NOT EXISTS review_counters (workspace_id TEXT PRIMARY KEY, next INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, workspace_id TEXT NOT NULL, review_id TEXT, action TEXT NOT NULL,
      actor TEXT NOT NULL, from_status TEXT, to_status TEXT, detail TEXT, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_ws ON audit_log(workspace_id, created_at);
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT, workspace_id TEXT NOT NULL, label TEXT, key_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL, last_used_at TEXT, revoked_at TEXT
    );
  `);
  for (const col of ['effective_from TEXT', 'expires_on TEXT']) {
    try { db.exec(`ALTER TABLE sources ADD COLUMN ${col}`); } catch { /* column already exists */ }
  }
}

/** Monotonic per-workspace id; never reused after a delete. */
export function nextComplianceId(db: DatabaseSync, ws: string): number {
  const row = db.prepare(
    'INSERT INTO review_counters (workspace_id, next) VALUES (?, 1) ON CONFLICT(workspace_id) DO UPDATE SET next = next + 1 RETURNING next'
  ).get(ws) as { next: number };
  return Number(row.next);
}

export function listReviews(db: DatabaseSync, ws: string): any[] {
  const rows = db.prepare('SELECT body FROM stored_reviews WHERE workspace_id = ? ORDER BY created_at DESC, rowid DESC').all(ws) as any[];
  return rows.map((r) => JSON.parse(r.body));
}

export function getReview(db: DatabaseSync, ws: string, id: string | number): any | null {
  const row = db.prepare('SELECT body FROM stored_reviews WHERE workspace_id = ? AND rid = ?').get(ws, String(id)) as any;
  return row ? JSON.parse(row.body) : null;
}

export function saveReview(db: DatabaseSync, ws: string, kind: ReviewKind, review: any) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO stored_reviews (rid, workspace_id, kind, status, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(workspace_id, rid) DO UPDATE SET status = excluded.status, body = excluded.body, updated_at = excluded.updated_at`
  ).run(String(review.id), ws, kind, review.status ?? null, JSON.stringify({ workspace_id: ws, ...review }), review.created_at || review.createdAt || now, now);
}

export function deleteReview(db: DatabaseSync, ws: string, id: string | number): boolean {
  return Number(db.prepare('DELETE FROM stored_reviews WHERE workspace_id = ? AND rid = ?').run(ws, String(id)).changes) > 0;
}

export function reviewStats(db: DatabaseSync, ws: string) {
  const rows = db.prepare("SELECT status, COUNT(*) AS n FROM stored_reviews WHERE workspace_id = ? AND kind = 'compliance' GROUP BY status").all(ws) as any[];
  const by = (s: string) => Number(rows.find((r) => r.status === s)?.n || 0);
  return { total: rows.reduce((a, r) => a + Number(r.n), 0), pending: by('Pending Review'), changes_requested: by('Changes Requested'), approved: by('Approved') };
}

/** No user accounts exist yet, so the actor is the workspace itself, not a person. */
export function recordAudit(db: DatabaseSync, ws: string, reviewId: string | number | null, action: string, opts: { from?: string | null; to?: string | null; detail?: string | null; actor?: string } = {}) {
  db.prepare('INSERT INTO audit_log (workspace_id, review_id, action, actor, from_status, to_status, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(ws, reviewId == null ? null : String(reviewId), action, opts.actor || `workspace:${ws}`, opts.from ?? null, opts.to ?? null, opts.detail ?? null, new Date().toISOString());
}

export function listAudit(db: DatabaseSync, ws: string, reviewId?: string, limit = 200): any[] {
  return (reviewId
    ? db.prepare('SELECT * FROM audit_log WHERE workspace_id = ? AND review_id = ? ORDER BY id DESC LIMIT ?').all(ws, reviewId, limit)
    : db.prepare('SELECT * FROM audit_log WHERE workspace_id = ? ORDER BY id DESC LIMIT ?').all(ws, limit)) as any[];
}

/** Removes everything the store holds for a workspace (used by Delete My Data). */
export function purgeWorkspaceReviews(db: DatabaseSync, ws: string) {
  for (const t of ['stored_reviews', 'review_counters', 'audit_log', 'api_keys']) db.prepare(`DELETE FROM ${t} WHERE workspace_id = ?`).run(ws);
}

/** Sources that are expired, or expire within `withinDays`. Dates are ISO yyyy-mm-dd. */
export function expiringSources(db: DatabaseSync, ws: string, now = new Date(), withinDays = 30) {
  const limit = new Date(now.getTime() + withinDays * 86400000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const rows = db.prepare("SELECT id, name, section, effective_from, expires_on FROM sources WHERE workspace_id = ? AND expires_on IS NOT NULL AND expires_on <= ? ORDER BY expires_on").all(ws, limit) as any[];
  return rows.map((r) => ({ ...r, status: r.expires_on < today ? 'expired' : 'expiring_soon' }));
}
