import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getDatabase } from '../src/server/db.ts';
import { initReviewStore, nextComplianceId, listReviews, getReview, saveReview, deleteReview, reviewStats, recordAudit, listAudit, purgeWorkspaceReviews, expiringSources } from '../src/server/reviewStore.ts';
import { createApiKey, verifyApiKey, revokeApiKey, keyRateAllowed } from '../src/server/apiKeys.ts';

// getDatabase() is a process-wide singleton, so every test starts by emptying the tables it touches.
const fresh = () => {
  const db = getDatabase(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bt-store-')), 's.db'));
  initReviewStore(db);
  for (const t of ['stored_reviews', 'review_counters', 'audit_log', 'api_keys']) db.exec(`DELETE FROM ${t}`);
  db.exec("DELETE FROM sources WHERE workspace_id IN ('a','b')");
  return db;
};

test('reviews are isolated between workspaces', () => {
  const db = fresh();
  saveReview(db, 'a', 'compliance', { id: nextComplianceId(db, 'a'), draft: 'secret A', status: 'Pending Review' });
  assert.equal(listReviews(db, 'a').length, 1);
  assert.equal(listReviews(db, 'b').length, 0);
  assert.equal(getReview(db, 'b', 1), null);
  assert.equal(deleteReview(db, 'b', 1), false);
  assert.equal(listReviews(db, 'a').length, 1);
});
test('ids are monotonic and never reused after a delete', () => {
  const db = fresh();
  const ids = [nextComplianceId(db, 'a'), nextComplianceId(db, 'a')];
  saveReview(db, 'a', 'compliance', { id: ids[1], status: 'Pending Review' });
  deleteReview(db, 'a', ids[1]);
  assert.deepEqual(ids, [1, 2]);
  assert.equal(nextComplianceId(db, 'a'), 3);
});
test('saving again updates in place instead of duplicating', () => {
  const db = fresh();
  saveReview(db, 'a', 'compliance', { id: 1, status: 'Pending Review' });
  saveReview(db, 'a', 'compliance', { id: 1, status: 'Approved' });
  assert.equal(listReviews(db, 'a').length, 1);
  assert.deepEqual(reviewStats(db, 'a'), { total: 1, pending: 0, changes_requested: 0, approved: 1 });
});
test('audit entries are scoped and record who/what', () => {
  const db = fresh();
  recordAudit(db, 'a', 1, 'status_changed', { from: 'Pending Review', to: 'Approved', detail: 'ok' });
  const e = listAudit(db, 'a', '1');
  assert.equal(e.length, 1); assert.equal(e[0].actor, 'workspace:a'); assert.equal(listAudit(db, 'b').length, 0);
});
test('purge removes reviews, counters, audit and API keys for that workspace only', () => {
  const db = fresh();
  for (const ws of ['a', 'b']) { saveReview(db, ws, 'compliance', { id: nextComplianceId(db, ws), status: 'Pending Review' }); recordAudit(db, ws, 1, 'x'); createApiKey(db, ws); }
  purgeWorkspaceReviews(db, 'a');
  assert.equal(listReviews(db, 'a').length, 0); assert.equal(listAudit(db, 'a').length, 0);
  assert.equal(listReviews(db, 'b').length, 1); assert.equal(listAudit(db, 'b').length, 1);
  assert.equal(nextComplianceId(db, 'a'), 1);
});
test('API keys: hash stored, verify, revoke, wrong key', () => {
  const db = fresh();
  const key = createApiKey(db, 'a', 'ci');
  assert.ok(key.startsWith('bt_'));
  assert.equal((db.prepare('SELECT COUNT(*) n FROM api_keys WHERE key_hash = ?').get(key) as any).n, 0); // plaintext is not stored
  const v = verifyApiKey(db, key); assert.equal(v?.workspace_id, 'a');
  assert.equal(verifyApiKey(db, 'bt_wrong'), null); assert.equal(verifyApiKey(db, undefined), null);
  assert.equal(revokeApiKey(db, 'b', v!.keyId), false);
  assert.equal(revokeApiKey(db, 'a', v!.keyId), true);
  assert.equal(verifyApiKey(db, key), null);
});
test('per-key rate limit', () => {
  const t = 1_000_000;
  for (let i = 0; i < 3; i++) assert.ok(keyRateAllowed(9001, 3, 60_000, t));
  assert.equal(keyRateAllowed(9001, 3, 60_000, t + 1), false);
  assert.ok(keyRateAllowed(9001, 3, 60_000, t + 61_000));
});
test('expired and expiring sources are reported', () => {
  const db = fresh();
  const ins = db.prepare("INSERT INTO sources (workspace_id, name, section, text, doc_type, created_at, expires_on) VALUES ('a', ?, 's', 't', 'x', 'now', ?)");
  ins.run('old price list', '2026-01-01'); ins.run('soon', '2026-11-10'); ins.run('later', '2027-06-01'); ins.run('none', null);
  const r = expiringSources(db, 'a', new Date('2026-10-28'));
  assert.deepEqual(r.map((x) => [x.name, x.status]), [['old price list', 'expired'], ['soon', 'expiring_soon']]);
});
