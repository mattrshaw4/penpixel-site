import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEdgeProtection, extractTitle, isBlocked } from '../lib/edge-protection-check.js';

const ok = (id) => ({ id, status: 200, cfMitigated: null, title: 'Home' });
const challenged = (id) => ({ id, status: 403, cfMitigated: 'challenge', title: 'Just a moment...' });

test('clean site: nothing flagged', () => {
  const r = analyzeEdgeProtection([ok('baseline'), ok('OAI-SearchBot'), ok('PerplexityBot'), ok('ClaudeBot')]);
  assert.equal(r.level, 'none'); assert.equal(r.penalty, 0); assert.equal(r.findings.length, 0);
});

test('everything challenged: critical + penalty (the pipingtech.com shape)', () => {
  const r = analyzeEdgeProtection([challenged('baseline'), challenged('OAI-SearchBot'), challenged('PerplexityBot'), challenged('ClaudeBot')]);
  assert.equal(r.level, 'full'); assert.equal(r.penalty, 35);
  assert.equal(r.findings[0].severity, 'critical');
  assert.match(r.findings[0].text, /cf-mitigated: challenge/);
});

test('only AI user agents blocked: info, no penalty', () => {
  const r = analyzeEdgeProtection([ok('baseline'), { id: 'ClaudeBot', status: 403, cfMitigated: null, title: '' }, ok('OAI-SearchBot')]);
  assert.equal(r.level, 'ai-ua'); assert.equal(r.penalty, 0);
  assert.equal(r.findings[0].severity, 'info');
  assert.match(r.findings[0].text, /ClaudeBot \(403\)/);
});

test('our scanner challenged but crawler UAs pass: not flagged', () => {
  const r = analyzeEdgeProtection([challenged('baseline'), ok('OAI-SearchBot'), ok('ClaudeBot')]);
  assert.equal(r.level, 'none'); assert.equal(r.penalty, 0);
});

test('network failures are unknown, never blocked', () => {
  const r = analyzeEdgeProtection([{ id: 'baseline', status: 0 }, { id: 'ClaudeBot', status: 0 }]);
  assert.equal(r.level, 'unknown'); assert.equal(r.penalty, 0);
  assert.equal(isBlocked({ id: 'x', status: 0 }), false);
});

test('200 with a challenge title still counts as blocked', () => {
  assert.equal(isBlocked({ id: 'x', status: 200, cfMitigated: null, title: 'Attention Required! | Cloudflare' }), true);
});

test('404 and 500 are not bot blocks', () => {
  assert.equal(isBlocked({ id: 'x', status: 404, cfMitigated: null, title: '' }), false);
  assert.equal(isBlocked({ id: 'x', status: 500, cfMitigated: null, title: '' }), false);
});

test('extractTitle handles missing, multiline and oversize input', () => {
  assert.equal(extractTitle('<html><head></head></html>'), '');
  assert.equal(extractTitle('<title>\n  Just   a moment...\n</title>'), 'Just a moment...');
  assert.equal(extractTitle(undefined), '');
  assert.equal(extractTitle('x'.repeat(200000) + '<title>late</title>'), '');
});
