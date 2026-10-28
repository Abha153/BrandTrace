import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getDatabase, seedDemoWorkspace } from '../src/server/db.ts';
import { runDynamicRules } from '../src/server/checker.ts';
import { isAllowedBaseUrl, tokensMatch } from '../src/server/security.ts';

const db = getDatabase(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bt-test-')), 't.db'));
seedDemoWorkspace(db, true);
const check = (t: string) => runDynamicRules(db, 'demo', t);

test('flags the retired product name and cites a source', () => {
  const f = check('Introducing BrandTrace Suite today.');
  assert.ok(f.length >= 1);
  assert.equal(f[0].quote.toLowerCase(), 'brandtrace suite');
  assert.ok(f[0].source);
});
test('flags a wrong standard-tier price', () => assert.ok(check('The standard tier is $39/month.').length >= 1));
test('does not flag the approved price', () => assert.equal(check('The standard tier is $49/month.').length, 0));
test('does not flag an enterprise price', () => assert.equal(check('Enterprise is $199/month.').length, 0));
test('flags a hype word', () => assert.ok(check('A revolutionary tool.').length >= 1));
test('flags the human-review claim', () => assert.ok(check('Published with no human review.').length >= 1));
test('clean text produces no findings', () => assert.equal(check('The team shipped the update on Tuesday.').length, 0));
test('finding offsets point at the quoted text', () => {
  const text = 'Meet BrandTrace Suite now.';
  for (const f of check(text)) assert.equal(text.slice(f.start, f.end).toLowerCase(), f.quote.toLowerCase());
});

test('base URL allow-list', () => {
  assert.ok(isAllowedBaseUrl('https://generativelanguage.googleapis.com/v1beta/openai/'));
  assert.ok(isAllowedBaseUrl(''));
  assert.equal(isAllowedBaseUrl('https://evil.example.com/v1'), false);
  assert.equal(isAllowedBaseUrl('http://api.openai.com/v1'), false);
  assert.equal(isAllowedBaseUrl('https://user:pw@api.openai.com/v1'), false);
  assert.equal(isAllowedBaseUrl(42), false);
});
test('admin token comparison', () => {
  assert.ok(tokensMatch('secret', 'secret'));
  assert.equal(tokensMatch('wrong', 'secret'), false);
  assert.equal(tokensMatch(undefined, 'secret'), false);
  assert.equal(tokensMatch('secret', undefined), false);
});
