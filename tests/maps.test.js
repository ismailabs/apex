// Run from the repo root: node tests/maps.test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const MAPS = require('../maps.js');

const EXPECTED_IDS = ['classic', 'city', 'desert', 'glacier', 'volcano', 'forest', 'jungle', 'coastal'];
assert.strictEqual(MAPS.LIST.length, 8, 'expected 8 maps');
assert.deepStrictEqual(MAPS.LIST.map(m => m.id), EXPECTED_IDS, 'map ids must match expected order');

for (const m of MAPS.LIST) {
  assert(m.sky && typeof m.sky === 'object', `${m.id} missing sky`);
  assert(m.ground && typeof m.ground === 'object', `${m.id} missing ground`);
  assert(m.weather && typeof m.weather === 'object', `${m.id} missing weather`);
  assert.strictEqual(typeof m.buildEnv, 'function', `${m.id} missing buildEnv function`);
}

// loop() output finite
{
  const pts = MAPS.loop(16, [[2, 0.15, 0], [3, 0.1, 1]], 1.4, 0.5);
  assert.strictEqual(pts.length, 16);
  for (const [x, y] of pts) {
    assert(Number.isFinite(x) && Number.isFinite(y), 'loop() produced non-finite coordinate');
  }
}

// buildTrackData() valid for all 8 maps
for (const m of MAPS.LIST) {
  const td = MAPS.buildTrackData(m);
  assert(td.N >= 150, `${m.id}: N=${td.N} < 150`);
  assert(td.LEN > 0 && Number.isFinite(td.LEN), `${m.id}: invalid LEN=${td.LEN}`);
  assert.strictEqual(td.P.length, td.N, `${m.id}: P length mismatch`);
  assert.strictEqual(td.T.length, td.N, `${m.id}: T length mismatch`);
  assert.strictEqual(td.NR.length, td.N, `${m.id}: NR length mismatch`);
  assert.strictEqual(td.CURV.length, td.N, `${m.id}: CURV length mismatch`);
  assert.strictEqual(td.VL.length, td.N, `${m.id}: VL length mismatch`);
  assert.strictEqual(td.LINE.length, td.N, `${m.id}: LINE length mismatch`);
  assert.strictEqual(td.GRAVEL.length, td.N, `${m.id}: GRAVEL length mismatch`);
  for (const [x, z] of td.P) {
    assert(Number.isFinite(x) && Number.isFinite(z), `${m.id}: non-finite track point`);
  }
  const gap = Math.hypot(td.P[0][0] - td.P[td.N - 1][0], td.P[0][1] - td.P[td.N - 1][1]);
  assert(gap > 0 && gap < td.SEG * 2.5, `${m.id}: loop not closed cleanly (gap=${gap}, SEG=${td.SEG})`);
}

// index.html wiring check
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(html.includes('maps.js'), 'index.html must reference maps.js');
assert(html.includes('mapList'), 'index.html must contain mapList');
assert(html.includes('pickMap'), 'index.html must contain pickMap');

console.log('maps tests passed');
