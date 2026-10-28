import { analyzeSeries, SERIES } from './math.js';

const form = document.getElementById('series-demo-form');
const inputs = [...form.querySelectorAll('input[type="number"]')];
const results = document.getElementById('demo-results');
const errorBox = document.getElementById('demo-error');
const texts = {
  kk: {
    invalid: 'Жеті өрістің бәріне шекті сан енгізіңіз. Ондық бөлшекке нүкте қолданыңыз.',
    constant: 'Алғашқы алты мән бірдей: S = 0. Бұл деректермен мағыналы болжам интервалы мен AR(1) бағасын көрсету мүмкін емес. Оқу мәндерін өзгертіңіз.',
    range: 'Сандар тым үлкен немесе есептеу дәлдігі жеткіліксіз. Оқу мысалы үшін кішірек мәндерді қолданыңыз.',
    inside: 'Y₇ Стьюденттің болжам интервалының ішінде.',
    outside: 'Y₇ Стьюденттің болжам интервалынан тыс.',
    met: 'D₇ ≤ T₇: осы оқу мысалында 25% шарты орындалды.',
    notMet: 'D₇ > T₇: осы оқу мысалында 25% шарты орындалмады.',
    noAr: 'Алғашқы бес мән бірдей: AR(1) коэффициенттерін бағалау мүмкін емес. Стьюдент есебі бөлек көрсетілген.',
    stale: 'Мәндер өзгерді. Жаңа нәтижелер үшін «Есептеу» түймесін басыңыз.'
  },
  ru: {
    invalid: 'Заполните все семь полей конечными числами. Для десятичной дроби используйте точку.',
    constant: 'Первые шесть значений одинаковы: S = 0. Содержательный прогнозный интервал и оценку AR(1) по ним показать нельзя. Измените учебные значения.',
    range: 'Числа слишком велики или вычислительная точность недостаточна. Возьмите меньшие значения для учебного примера.',
    inside: 'Y₇ находится внутри прогнозного интервала Стьюдента.',
    outside: 'Y₇ находится вне прогнозного интервала Стьюдента.',
    met: 'D₇ ≤ T₇: в этом учебном примере условие 25% выполнено.',
    notMet: 'D₇ > T₇: в этом учебном примере условие 25% не выполнено.',
    noAr: 'Первые пять значений одинаковы: коэффициенты AR(1) не определены. Расчёт Стьюдента показан отдельно.',
    stale: 'Значения изменены. Нажмите «Рассчитать», чтобы обновить результаты.'
  },
  en: {
    invalid: 'Fill all seven fields with finite numbers. Use a decimal point.',
    constant: 'The first six values are identical: S = 0. A meaningful prediction interval and AR(1) fit cannot be shown from this baseline. Change the illustrative inputs.',
    range: 'The values exceed numerical precision. Use smaller numbers for this worked example.',
    inside: 'Y₇ is inside the Student prediction interval.',
    outside: 'Y₇ is outside the Student prediction interval.',
    met: 'D₇ ≤ T₇: this illustrative series meets the 25% condition.',
    notMet: 'D₇ > T₇: this illustrative series does not meet the 25% condition.',
    noAr: 'The first five values are identical: AR(1) coefficients are undefined. The Student calculation is shown separately.',
    stale: 'Inputs changed. Select Calculate to update the results.'
  }
};
const language = () => texts[document.documentElement.lang] || texts.kk;
const f = value => value.toFixed(4);
let lastResult = null, lastError = null, dirty = false;
const put = (id, text) => { document.getElementById(id).textContent = text; };
function render() {
  const t = language();
  errorBox.hidden = !lastError && !dirty;
  errorBox.textContent = dirty ? t.stale : lastError ? t[lastError] : '';
  results.hidden = !lastResult || dirty || !!lastError;
  if (results.hidden) return;
  const r = lastResult;
  put('demo-mean', f(r.mean));
  put('demo-variance', f(r.variance));
  put('demo-sd', f(r.sd));
  put('demo-pi', `[${f(r.student.lower)}; ${f(r.student.upper)}]`);
  put('demo-substitution', `${f(r.mean)} ± 2.5705818 · ${f(r.sd)} · √(1 + 1/6)`);
  put('demo-student-verdict', t[r.student.containsActual ? 'inside' : 'outside']);
  put('demo-alpha-beta', r.ar ? `${f(r.ar.alpha)}; ${f(r.ar.beta)}` : '—');
  put('demo-forecast', r.ar ? f(r.ar.forecast) : '—');
  put('demo-error-value', r.ar ? f(r.ar.error) : '—');
  put('demo-limit', r.ar ? f(r.ar.threshold) : '—');
  put('demo-ar-verdict', r.ar ? t[r.ar.withinTolerance ? 'met' : 'notMet'] : t.noAr);
}
function calculate() {
  dirty = false;
  lastError = null;
  lastResult = null;
  if (inputs.some(input => input.value.trim() === '' || !input.validity.valid || !Number.isFinite(input.valueAsNumber))) lastError = 'invalid';
  else {
    try { lastResult = analyzeSeries(inputs.map(input => input.valueAsNumber)); }
    catch (error) { lastError = error.message === 'constant-baseline' ? 'constant' : error.message === 'numeric-range' ? 'range' : 'invalid'; }
  }
  render();
}
form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
form.addEventListener('input', () => { dirty = true; lastError = null; render(); });
document.getElementById('demo-reset').addEventListener('click', () => { inputs.forEach((input, i) => { input.value = SERIES[i]; }); calculate(); });
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
form.querySelectorAll('button').forEach(button => { button.disabled = false; });
calculate();
