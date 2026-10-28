/** Pure computations for explicitly illustrative examples. No participant records. */
export function wilson(k, n, z = 1.96) {
  if (!Number.isInteger(k) || !Number.isInteger(n) || n < 1 || k < 0 || k > n || !Number.isFinite(z) || z <= 0) throw new RangeError('Invalid binomial inputs');
  const p = k / n;
  const denominator = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / denominator;
  const halfWidth = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator;
  return { proportion: p, lower: Math.max(0, center - halfWidth), upper: Math.min(1, center + halfWidth) };
}
export function ppv(prior, sensitivity, specificity) {
  if (![prior, sensitivity, specificity].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) throw new RangeError('Invalid probability');
  const tp = prior * sensitivity;
  const fp = (1 - prior) * (1 - specificity);
  if (tp + fp === 0) throw new RangeError('No positive signals');
  return { value: tp / (tp + fp), truePositive: tp, falsePositive: fp };
}
export const SERIES = Object.freeze([5, 6, 5, 7, 6, 8, 10]);
export const SCENARIOS = Object.freeze({
  model: Object.freeze({ prior: .02, sensitivity: .85, specificity: .70 }),
  socs: Object.freeze({ prior: .02, sensitivity: .76, specificity: .49 })
});
export const SURVEY = Object.freeze({ n: 60, k: 21, verified: false, questionVerified: false });
export function illustrativeAnalysis() {
  // The held-out seventh value never participates in fitting.
  const train = SERIES.slice(0, 6);
  const n = train.length;
  const mean = train.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(train.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1));
  const studentHalf = 2.570581835636314 * sd * Math.sqrt(1 + 1 / n); // t(5, .975)
  const x = train.slice(0, -1), y = train.slice(1);
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const beta = x.reduce((sum, v, i) => sum + (v - xMean) * (y[i] - yMean), 0) / x.reduce((sum, v) => sum + (v - xMean) ** 2, 0);
  const alpha = yMean - beta * xMean;
  const forecast = alpha + beta * train[n - 1];
  const threshold = .25 * Math.max(Math.abs(forecast), 1);
  const error = Math.abs(SERIES[6] - forecast);
  return { train, mean, sd, student: { lower: mean - studentHalf, upper: mean + studentHalf }, ar: { alpha, beta, forecast, threshold, error, withinTolerance: error <= threshold } };
}
