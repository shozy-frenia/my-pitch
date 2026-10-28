import test from 'node:test';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wilson, ppv, illustrativeAnalysis, analyzeSeries, STUDENT_T_95_DF5, SERIES, SCENARIOS, SURVEY } from '../assets/math.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const near = (actual, expected, tolerance = .00005) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≉ ${expected}`);

test('Only the preliminary 21/60 aggregate represents the current survey', () => {
  assert.deepEqual(SURVEY, { n: 60, k: 21, verified: false, questionVerified: false });
  const interval = wilson(SURVEY.k, SURVEY.n);
  near(interval.proportion, .35);
  assert.equal((interval.lower * 100).toFixed(1), '24.2');
  assert.equal((interval.upper * 100).toFixed(1), '47.6');
});
test('8/15 remains a separate Wilson arithmetic demonstration', () => {
  const interval = wilson(8, 15);
  near(interval.proportion, 8 / 15);
  assert.equal((interval.lower * 100).toFixed(1), '30.1');
  assert.equal((interval.upper * 100).toFixed(1), '75.2');
});
test('Wilson boundaries and impossible inputs are handled', () => {
  near(wilson(0, 60).lower, 0);
  near(wilson(60, 60).upper, 1);
  for (const [k, n] of [[1, 0], [-1, 60], [61, 60], [1.5, 60]]) assert.throws(() => wilson(k, n), RangeError);
});
test('Bayes scenarios reproduce the expected PPV values, not sensitivity', () => {
  for (const [key, expected] of [['model', '5.466'], ['socs', '2.951']]) {
    const s = SCENARIOS[key];
    assert.equal((100 * ppv(s.prior, s.sensitivity, s.specificity).value).toFixed(3), expected);
  }
  const model = ppv(.02, .85, .70);
  near(model.truePositive * 1000, 17);
  near(model.falsePositive * 1000, 294);
  assert.throws(() => ppv(0, 1, 1), RangeError);
  assert.throws(() => ppv(.02, 1.1, .70), RangeError);
});
test('Student PI uses sample SD and six training points only', () => {
  const a = illustrativeAnalysis();
  assert.equal(a.train.length, 6);
  assert.deepEqual(a.train, [5, 6, 5, 7, 6, 8]);
  near(a.mean, 6.1667);
  near(a.sd, 1.1690);
  near(a.student.lower, 2.9208);
  near(a.student.upper, 9.4126);
  assert.ok(SERIES[6] > a.student.upper);
});
test('AR forecast and 25% tolerance reproduce the failed hypothesis', () => {
  const { ar } = illustrativeAnalysis();
  near(ar.alpha, 7.6429);
  near(ar.beta, -.2143);
  near(ar.forecast, 5.9286);
  near(ar.error, 4.0714);
  near(ar.threshold, 1.4821);
  assert.equal(ar.withinTolerance, false);
  assert.ok(ar.error > ar.threshold);
});
test('Published page retains scientific boundaries and excludes removed claims', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  assert.match(html, /<html lang="kk"/);
  for (const term of ['21 / 60', '35%', '[24.2; 47.6]%', '8\/15', 'верификация', 'Тек иллюстрация', 'прототип', 'тұжырымдамасы', 'расталмады']) assert.ok(html.includes(term), term);
  const dictionary = vm.runInNewContext('(' + html.slice(html.indexOf('const I18N = ') + 13, html.indexOf('\n            const LANG_KEY')).trim().replace(/;$/, '') + ')');
  const copy = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '') + Object.values(dictionary).flatMap(Object.values).join(' ');
  const banned = /24\s*\/\s*60|28\.6|52\.6|1\.1524|13\.0096|2\.6871|2\.2585|регрессиялық (?:PI|интервал)|₸|\$\d|\b(?:TAM|SAM|SOM|investment|revenue|funding|pricing|pitch|payment|checkout|paypal|stripe|firebase|groq)\b/i;
  assert.equal(banned.test(copy), false, copy.match(banned)?.[0]);

  // Repository name is a historical URL only, never commercial copy.
  assert.equal([...html.matchAll(/<form\b/g)].length, 1);
  assert.match(html, /<form id="series-demo-form" novalidate>/);
  assert.doesNotMatch(html, /<form[^>]*(?:action|method)=/i);
});
test('All local assets and fragment links resolve; no duplicate IDs', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const link = match[1];
    if (link === '#') continue;
    if (link.startsWith('#')) assert.ok(ids.includes(link.slice(1)), `Missing ${link}`);
    else if (!/^(?:https?:|mailto:|tel:|data:)/.test(link)) await stat(resolve(root, link));
  }
});
test('Published source includes no old service pages, remote API calls, or clinical collection', async () => {
  const files = await readdir(root);
  for (const name of ['payments.html', 'login.html', 'app.html', 'ai.html', 'panel.html', 'api', 'og.png']) assert.ok(!files.includes(name), name);
  const app = await readFile(resolve(root, 'index.html'), 'utf8');
  assert.doesNotMatch(app, /\bfetch\(|XMLHttpRequest|sendBeacon|document\.cookie/);
});

test('The original stylesheet, responsive layout and controls are preserved', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  assert.equal(createHash('sha256').update(html.match(/<style>([\s\S]*?)<\/style>/)[1]).digest('hex'), '93908cc37d8630538bc242cd0de8bad559e1f5fe34c2f9c915f418e1e9e07978');
  for (const id of ['themeToggle','navToggle','heroFigure','figSvg','baseRate','brSteps']) assert.ok(html.includes('id="'+id+'"'));
});


test('The calculator uses Student df=5 and excludes the held-out value from fitting', () => {
  const first = analyzeSeries([5,6,5,7,6,8,10]);
  const second = analyzeSeries([5,6,5,7,6,8,100]);
  assert.equal(first.n, 6);
  assert.equal(first.degreesOfFreedom, 5);
  assert.equal(first.criticalValue, STUDENT_T_95_DF5);
  near(first.criticalValue, 2.5705818356, 1e-9);
  assert.deepEqual(first.student.lower, second.student.lower);
  assert.deepEqual(first.student.upper, second.student.upper);
  assert.equal(first.ar.forecast, second.ar.forecast);
  assert.notEqual(first.ar.error, second.ar.error);
  near(first.variance, 1.3666666667, 1e-9);
  const gaussianHalf = 1.96 * first.sd * Math.sqrt(1 + 1/6);
  assert.ok(first.student.halfWidth > gaussianHalf);
});
test('The calculator validates input and handles undefined AR independently of Student', () => {
  for (const values of [[1,2,3], [1,2,3,4,5,6,NaN], [1,1,1,1,1,1,2], [0.1,0.1,0.1,0.1,0.1,0.1,2]]) assert.throws(() => analyzeSeries(values), RangeError);
  const result=analyzeSeries([1,1,1,1,1,2,3]);
  assert.equal(result.ar, null);
  assert.equal(analyzeSeries([0.1,0.1,0.1,0.1,0.1,0.2,0.3]).ar, null);
  assert.ok(result.sd > 0);
  assert.ok(Number.isFinite(result.student.upper));
  const inside=analyzeSeries([5,6,5,7,6,8,6]);
  assert.equal(inside.student.containsActual, true);
  assert.equal(inside.ar.withinTolerance, true);
});
test('Calculator runs locally with no data transmission or record persistence', async () => {
  const js=await readFile(resolve(root,'assets/demo.js'),'utf8');
  assert.doesNotMatch(js,/\bfetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/);
  assert.ok(js.includes('event.preventDefault()'));
  assert.ok(js.includes('results.hidden = !lastResult || dirty || !!lastError'));
});
