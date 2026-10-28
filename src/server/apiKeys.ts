import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const hash = (k: string) => crypto.createHash('sha256').update(k).digest('hex');

/** Creates a key. The plaintext is returned once and only its SHA-256 hash is stored. */
export function createApiKey(db: DatabaseSync, ws: string, label = ''): string {
  const key = 'bt_' + crypto.randomBytes(24).toString('base64url');
  db.prepare('INSERT INTO api_keys (workspace_id, label, key_hash, created_at) VALUES (?, ?, ?, ?)').run(ws, label, hash(key), new Date().toISOString());
  return key;
}

/** Returns the key's workspace id, or null if the key is unknown or revoked. */
export function verifyApiKey(db: DatabaseSync, key: unknown): { workspace_id: string; keyId: number } | null {
  if (typeof key !== 'string' || !key.startsWith('bt_') || key.length > 100) return null;
  const row = db.prepare('SELECT id, workspace_id FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL').get(hash(key)) as any;
  if (!row) return null;
  db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), row.id);
  return { workspace_id: row.workspace_id, keyId: Number(row.id) };
}

export function revokeApiKey(db: DatabaseSync, ws: string, id: number): boolean {
  return Number(db.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ? AND workspace_id = ? AND revoked_at IS NULL').run(new Date().toISOString(), id, ws).changes) > 0;
}

/** Fixed-window per-key limiter (in memory, resets on restart). */
const windows = new Map<number, { start: number; n: number }>();
export function keyRateAllowed(keyId: number, limit = 60, windowMs = 60_000, now = Date.now()): boolean {
  const w = windows.get(keyId);
  if (!w || now - w.start >= windowMs) { windows.set(keyId, { start: now, n: 1 }); return true; }
  return ++w.n <= limit;
}
