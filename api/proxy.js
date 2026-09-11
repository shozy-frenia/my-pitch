// api/proxy.js — serverless function deployed alongside the site.
//
// Lives in this project so it shares its environment: GROQ_API_KEY is read
// here, on the server, and never reaches the browser. Because the page and
// this endpoint are served from the same origin, the request never leaves
// the user's own domain.
//
// CommonJS on purpose: without a package.json declaring "type": "module",
// Vercel's Node runtime treats .js as CommonJS and `export default` fails.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// The assistant's instructions live on the server, not in the page. A system
// prompt sent from the browser can be rewritten in devtools, and this one
// carries the safety rules — for a tool used by school students that matters.
const SYSTEM_PROMPT = [
  'You are a warm, empathetic companion inside NeuroCheck, a mental-health',
  'screening prototype used by school students. Be supportive, kind and',
  'practical, and keep replies short — a few sentences unless asked for more.',
  'Never diagnose, never name a disorder, and never interpret a NeuroCheck',
  'score or result. You are not a therapist and you say so plainly if asked.',
  'If someone describes self-harm, suicidal thoughts, abuse or immediate',
  'danger, respond with care and directly encourage them to contact a trusted',
  'adult, a school psychologist, or emergency services.'
].join(' ');

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_MESSAGES = 20;   // turns of history accepted
const MAX_CHARS = 4000;    // per message
const MAX_TOKENS = 600;    // per reply

// Extra origins beyond this deployment's own host — only needed if the site
// is also served somewhere else, e.g. the old GitHub Pages address.
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function isAllowed(req) {
  const origin = req.headers.origin;
  // Same-origin POSTs from our own page, and non-browser clients, send no
  // Origin we need to police. Anything that does send one must be us.
  if (!origin) return true;
  const host = req.headers.host;
  if (host && (origin === 'https://' + host || origin === 'http://' + host)) return true;
  return EXTRA_ORIGINS.includes(origin);
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && isAllowed(req)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Stops another site from embedding this endpoint and spending the quota.
  if (!isAllowed(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.error('GROQ_API_KEY is not set for this deployment');
    return res.status(500).json({ error: 'The assistant is not configured yet.' });
  }

  let incoming = req.body;
  if (typeof incoming === 'string') {
    try { incoming = JSON.parse(incoming); }
    catch (e) { return res.status(400).json({ error: 'Malformed request.' }); }
  }

  const sent = incoming && incoming.messages;
  if (!Array.isArray(sent) || sent.length === 0) {
    return res.status(400).json({ error: 'No messages provided.' });
  }

  // Only user and assistant turns are accepted. A "system" role arriving from
  // the browser is dropped rather than trusted.
  const messages = sent
    .filter(function (m) {
      return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
    })
    .slice(-MAX_MESSAGES)
    .map(function (m) { return { role: m.role, content: m.content.slice(0, MAX_CHARS) }; });

  if (messages.length === 0) {
    return res.status(400).json({ error: 'No usable messages provided.' });
  }

  try {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
        temperature: 0.7,
        max_tokens: MAX_TOKENS
      })
    });

    const raw = await upstream.text();

    if (!upstream.ok) {
      // Logged for us, not returned: provider errors can echo the key back.
      console.error('Groq responded', upstream.status, raw.slice(0, 500));
      if (upstream.status === 401 || upstream.status === 403) {
        return res.status(502).json({ error: 'The assistant is not configured correctly.' });
      }
      if (upstream.status === 429) {
        return res.status(429).json({ error: 'Too many requests right now. Please try again in a moment.' });
      }
      if (upstream.status === 404) {
        return res.status(502).json({ error: 'The configured model is unavailable.' });
      }
      return res.status(502).json({ error: 'The assistant is unavailable right now.' });
    }

    let data;
    try { data = JSON.parse(raw); }
    catch (e) { return res.status(502).json({ error: 'Unexpected response from the assistant.' }); }

    const reply = data && data.choices && data.choices[0] &&
      data.choices[0].message && data.choices[0].message.content;

    if (!reply) {
      return res.status(502).json({ error: 'The assistant returned an empty response.' });
    }

    return res.status(200).json({
      choices: [{ message: { role: 'assistant', content: reply } }]
    });

  } catch (err) {
    console.error('Proxy failure:', err && err.message);
    return res.status(502).json({ error: 'Could not reach the assistant.' });
  }
};
