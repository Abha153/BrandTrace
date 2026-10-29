import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewScope } from '../src/server/security.ts';

test('demo reviews are private per browser', () => {
  assert.equal(reviewScope('demo', 'abcdefgh1234'), 'demo:abcdefgh1234');
  assert.notEqual(reviewScope('demo', 'abcdefgh1234'), reviewScope('demo', 'zzzzzzzz9999'));
});
test('missing or malformed client ids fall back to one anonymous bucket', () => {
  for (const bad of [undefined, '', 'short', 'has spaces here', 'x'.repeat(65), 42, ['a']]) assert.equal(reviewScope('demo', bad), 'demo:anonymous');
});
test('custom workspaces keep their own id', () => assert.equal(reviewScope('acme', 'abcdefgh1234'), 'acme'));
