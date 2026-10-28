import test from 'node:test';
import assert from 'node:assert/strict';
import { friendlyLlmError, DailyCounter } from '../src/server/llmErrors.ts';

test('Google quota error becomes one short sentence with no raw payload', () => {
  const raw = '{"error":{"code":429,"message":"You exceeded your current quota ... https://ai.dev/rate-limit","status":"RESOURCE_EXHAUSTED"}}';
  const msg = friendlyLlmError(new Error(raw));
  assert.match(msg, /quota/i);
  assert.ok(msg.length < 120);
  assert.ok(!msg.includes('{') && !msg.includes('http'));
});

test('other provider errors are mapped and unknown errors stay generic', () => {
  assert.match(friendlyLlmError(new Error('The AI provider rejected the configured credentials.')), /key/i);
  assert.match(friendlyLlmError(new Error('HTTP 503 UNAVAILABLE')), /busy/i);
  assert.match(friendlyLlmError(new Error('Gemini API call timed out after 30s')), /respond/i);
  assert.equal(friendlyLlmError(new Error('weird internal AIzaSyFAKEKEY detail')), 'The AI analysis could not be completed.');
});

test('daily counter blocks after the limit and resets after 24h', () => {
  const t0 = 1_000_000;
  const c = new DailyCounter(t0);
  assert.equal(c.check(2, t0).remaining, 2);
  c.increment(t0); c.increment(t0);
  assert.equal(c.check(2, t0 + 1000).allowed, false);
  assert.equal(c.check(2, t0 + 86_400_001).allowed, true);
});

test('daily limit 0 means unlimited', () => {
  const c = new DailyCounter(0);
  for (let i = 0; i < 100; i++) c.increment(0);
  assert.deepEqual(c.check(0, 0).remaining, null);
  assert.equal(c.check(0, 0).allowed, true);
});
