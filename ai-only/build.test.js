import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bundle } from './build.js';

test('logic.jsを埋め込んだ、外部ファイルを読まない単一HTMLを作る', () => {
  const html = '<title>t</title>\n<script type="module">\nimport { step } from \'./logic.js\';\nstep();\n</script>';
  const logic = 'export const W = 1;\nexport function step() {}\n';
  const out = bundle(html, logic);
  assert.match(out, /^<!doctype html>/);
  assert.doesNotMatch(out, /logic\.js/);
  assert.doesNotMatch(out, /^export /m);
  assert.match(out, /function step\(\) \{\}/);
});
