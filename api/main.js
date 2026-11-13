// The website. It loads the standalone arcade file as-is, then adds:
//   1. a player name (a random antibiotic by default) remembered in this browser
//   2. automatic code word submission + a live leaderboard  -> /api/submit, /api/leaderboard
//   3. anonymous play tracking                              -> /api/event
// Edit the games in standalone/aaw-arcade.html; this page picks up changes automatically.
import arcadeHtml from '../standalone/aaw-arcade.html?raw';
import './style.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/bricolage-grotesque/opsz.css';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// --- Put the arcade on the page ---
// Scripts added with innerHTML don't run, so we pull them out and add them back as real script tags.
const mount = $('arcade');
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

// --- Player: random ID + name, remembered in this browser when possible ---
const DRUGS = ['Amikacin', 'Amoxicillin', 'Ampicillin', 'Azithromycin', 'Aztreonam', 'Cefazolin', 'Cefepime', 'Cefiderocol',
  'Ceftaroline', 'Ceftriaxone', 'Cephalexin', 'Clindamycin', 'Dalbavancin', 'Daptomycin', 'Doxycycline', 'Ertapenem',
  'Fidaxomicin', 'Fosfomycin', 'Gentamicin', 'Levofloxacin', 'Linezolid', 'Meropenem', 'Metronidazole', 'Minocycline',
  'Nafcillin', 'Nitrofurantoin', 'Oritavancin', 'Penicillin', 'Piperacillin', 'Rifampin', 'Tedizolid', 'Tobramycin', 'Vancomycin'];
const ADJ = { A: ['Agile', 'Astute'], C: ['Clever', 'Calm'], D: ['Daring', 'Dashing'], E: ['Eager', 'Epic'], F: ['Fearless', 'Fierce'],
  G: ['Gallant', 'Gutsy'], L: ['Lucky', 'Legendary'], M: ['Mighty', 'Masterful'], N: ['Nimble', 'Noble'], O: ['Optimal', 'Outstanding'],
  P: ['Plucky', 'Precise'], R: ['Radiant', 'Resolute'], T: ['Tenacious', 'Trusty'], V: ['Valiant', 'Vigilant'] };
const pick = a => a[Math.floor(Math.random() * a.length)];
const randomName = () => { const d = pick(DRUGS); return `${pick(ADJ[d[0]])} ${d}`; };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('aaw.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('aaw.' + k, JSON.stringify(v)); } catch { /* private browsing: works for this visit only */ } },
};
const me = store.get('player') || { id: crypto.randomUUID(), name: randomName() };
store.set('player', me);
const earned = new Set(store.get('codes') || []);   // every code unlocked in this browser
const pending = new Set(store.get('pending') || []); // unlocked but not yet saved on the server
$('player-name').textContent = me.name;

function status(text, tone = '') {
  const el = $('player-status');
  el.textContent = text;
  el.className = 'muted ' + tone;
}

async function submit(codes, name = me.name) {
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player: me.id, name, codes: [...codes].join(' ') }),
  });
  const data = await res.json().catch(() => ({ error: 'The leaderboard only works on the live site.', detail: 'HTTP ' + res.status + ' (not JSON)' }));
  if (!res.ok) {
    console.warn('Code submission failed:', res.status, data.detail || data.error); // shows the real cause in the browser console
    throw new Error(data.error || 'Your codes were not saved. Try again in a minute.');
  }
  return data;
}

// --- Leaderboards: overall (code words) plus one per game ---
const DOTS = 10;
const pts = n => n.toLocaleString() + ' pts';
const correct = n => n + ' correct';
const BOARDS = [
  { id: 'overall', label: 'Code words' },
  { id: 'wheel', label: 'Stewardship Wheel', fmt: n => '$' + n.toLocaleString() },
  { id: 'blast', label: 'Bug Blaster', fmt: pts },
  { id: 'whack', label: 'Order Whack', fmt: pts },
  { id: 'catch', label: 'Stewardship Catch', fmt: pts },
  { id: 'clock', label: 'Stop the Clock', fmt: pts },
  { id: 'myth', label: 'Myth or Fact', fmt: correct },
  { id: 'match', label: 'Bug–Drug Match', fmt: pts },
  { id: 'dash', label: 'De-escalation Dash', fmt: correct },
  { id: 'dur', label: 'Duration Station', fmt: correct },
  { id: 'scr', label: 'Stewardship Scramble', fmt: correct },
];
let current = 'overall';
let lastData = null;
$('board-tabs').innerHTML = BOARDS.map(b => `<button type="button" data-b="${b.id}" aria-pressed="${b.id === current}">${b.label}</button>`).join('');
$('board-tabs').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  current = btn.dataset.b;
  $('board-tabs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === btn));
  if (lastData) render(lastData);
});

function render(data) {
  if (current !== 'overall') {
    const board = BOARDS.find(b => b.id === current);
    const list = data.games?.[current] || [];
    $('board-list').innerHTML = list.length
      ? list.map(p => `<li class="score-row ${p.me ? 'me' : ''}"><span class="rank">${p.rank}</span><span class="who">${esc(p.name)}${p.me ? ' <em>(you)</em>' : ''}</span>` +
          `<span class="count">${board.fmt(p.score)}</span></li>`).join('')
      : `<li class="empty">No scores yet. Finish a round of ${board.label} to set the first one.</li>`;
    $('board-meta').textContent = 'Best score per player';
    $('board-me').hidden = true;
    return;
  }
  {
    const row = p => {
      const dots = Array.from({ length: data.of || DOTS }, (_, i) => `<i class="${i < p.count ? 'on' : ''}"></i>`).join('');
      return `<li class="${p.me ? 'me' : ''}"><span class="rank">${p.rank}</span><span class="who">${esc(p.name)}${p.me ? ' <em>(you)</em>' : ''}</span>` +
        `<span class="dots" aria-hidden="true">${dots}</span><span class="count">${p.count}<span class="visually-hidden"> code words</span></span></li>`;
    };
    $('board-list').innerHTML = data.top.length ? data.top.map(row).join('')
      : '<li class="empty">No code words yet. Unlock one in any game to take the top spot.</li>';
    $('board-meta').textContent = data.players ? `${data.players} player${data.players === 1 ? '' : 's'} so far` : '';
    const showMe = data.me && !data.top.some(p => p.me);
    $('board-me').hidden = !showMe;
    if (showMe) $('board-me').innerHTML = `You're #${data.me.rank} with ${data.me.count} code word${data.me.count === 1 ? '' : 's'}.`;
  }
}

async function loadBoard() {
  try {
    const res = await fetch('/api/leaderboard?player=' + encodeURIComponent(me.id));
    const data = await res.json();
    if (!res.ok) { console.warn('Leaderboard failed:', res.status, data.detail || data.error); throw new Error(data.error); }
    lastData = data;
    render(data);
  } catch {
    $('board-list').innerHTML = '<li class="empty">The leaderboard will appear on the live site.</li>';
  }
}
loadBoard();
setInterval(() => {
  if (document.hidden) return;
  loadBoard();
  if (pending.size) save([]).then(() => status('Your saved code words were added to the leaderboard.', 'ok')).catch(() => {}); // keep retrying unsaved codes
}, 30000);

// Save codes, retrying later if the network or server hiccups
function save(codes) {
  codes.forEach(c => pending.add(c));
  store.set('pending', [...pending]);
  return submit(pending).then(d => {
    pending.clear();
    store.set('pending', []);
    loadBoard();
    return d;
  });
}
if (pending.size) save([]).catch(() => {});

// --- Game events: tracking + automatic code submission ---
const session = crypto.randomUUID(); // one random ID per visit, used only to count plays
document.addEventListener('aaw', e => {
  const { type, game, unlocked, code } = e.detail;
  const { score } = e.detail;
  const body = JSON.stringify({ session, player: me.id, name: me.name, type, game, unlocked: !!unlocked, score });
  navigator.sendBeacon?.('/api/event', body) || fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {});

  if (type === 'finish' && score != null) setTimeout(loadBoard, 1000); // show the new score

  if (code && !earned.has(code)) {
    earned.add(code);
    store.set('codes', [...earned]);
    status(`Adding ${code} to the leaderboard…`);
    save([code])
      .then(d => status(`${code} added. You have ${d.total} of ${d.of} code words.`, 'ok'))
      .catch(() => status(`${code} is saved in this browser. It will be added to the leaderboard automatically once the leaderboard is reachable.`, 'bad'));
  }
});

// --- Change name ---
const renameForm = $('rename-form');
const renameInput = $('rename-input');
function toggleRename(open) {
  renameForm.hidden = !open;
  $('rename-btn').hidden = open;
  if (open) { renameInput.value = me.name; renameInput.select(); renameInput.focus(); }
}
$('rename-btn').onclick = () => toggleRename(true);
$('rename-cancel').onclick = () => toggleRename(false);
renameForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = renameInput.value.trim().replace(/\s+/g, ' ');
  if (!name) return;
  me.name = name;
  store.set('player', me);
  $('player-name').textContent = name;
  toggleRename(false);
  try {
    await submit([], name); // updates your name on the leaderboard; your codes stay with you
    status('Name saved.', 'ok');
    loadBoard();
  } catch (err) { status(err.message, 'bad'); }
});

// --- Add codes earned somewhere else ---
const form = $('submit-form');
const result = $('submit-result');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const typed = form.elements.codes.value.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  if (!typed.length) return;
  const btn = form.querySelector('button');
  btn.disabled = true;
  result.className = '';
  result.textContent = 'Adding…';
  try {
    const data = await submit(typed);
    data.accepted.forEach(c => earned.add(c));
    store.set('codes', [...earned]);
    let msg = `Added. You have ${data.total} of ${data.of} code words.`;
    if (data.rejected.length) msg += ` Not recognized: ${data.rejected.join(', ')}. Check the spelling and try again.`;
    result.className = data.accepted.length ? 'ok' : 'bad';
    result.textContent = msg;
    form.elements.codes.value = data.rejected.join(', ');
    loadBoard();
  } catch (err) {
    result.className = 'bad';
    result.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
