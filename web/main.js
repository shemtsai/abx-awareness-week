// The Vercel site. It loads the standalone arcade file as-is, then adds:
//   1. activity tracking (game starts/finishes) -> /api/event
//   2. a code word submission form -> /api/submit
// Edit the games in standalone/aaw-arcade.html; this page picks up changes automatically.
import arcadeHtml from '../standalone/aaw-arcade.html?raw';
import './style.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/bricolage-grotesque/opsz.css';

// --- Put the arcade on the page ---
// Scripts added with innerHTML don't run, so we pull them out and add them back as real script tags.
const mount = document.getElementById('arcade');
const tpl = document.createElement('template');
tpl.innerHTML = arcadeHtml;
const scripts = [...tpl.content.querySelectorAll('script')];
scripts.forEach(s => s.remove());
mount.append(tpl.content);
scripts.forEach(old => {
  const s = document.createElement('script');
  s.textContent = old.textContent;
  mount.querySelector('.aaw-wrap').append(s);
});

// --- Tracking ---
// One random ID per visit (not stored, not tied to a person) so we can count players.
const session = crypto.randomUUID();
const form = document.getElementById('submit-form');
const earned = new Set();

document.addEventListener('aaw', e => {
  const { type, game, unlocked, code } = e.detail;
  const body = JSON.stringify({ session, type, game, unlocked: !!unlocked });
  navigator.sendBeacon?.('/api/event', body) || fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {});

  // Fill unlocked codes into the submission box
  if (code && !earned.has(code)) {
    earned.add(code);
    document.getElementById('tally-n').textContent = earned.size;
    const box = form.elements.codes;
    const have = new Set(box.value.toUpperCase().split(/[^A-Z]+/).filter(Boolean));
    if (!have.has(code)) box.value = [...have, code].join(', ');
  }
});

// --- Submission ---
const result = document.getElementById('submit-result');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('button');
  btn.disabled = true;
  result.className = '';
  result.textContent = 'Submitting…';
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.elements.name.value, codes: form.elements.codes.value }),
    });
    const data = await res.json().catch(() => ({ error: 'Submissions only work on the live site.' }));
    if (!res.ok) throw new Error(data.error || 'Your codes were not saved. Try again in a minute.');
    let msg = `Saved. You have ${data.total} of ${data.of} code words on record.`;
    if (data.rejected.length) msg += ` Not recognized: ${data.rejected.join(', ')}. Check the spelling and submit again.`;
    result.className = 'ok';
    result.textContent = msg;
  } catch (err) {
    result.className = 'bad';
    result.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
