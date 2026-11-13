// The website. It loads the standalone arcade file as-is, then adds:
//   1. a player name (a random antibiotic by default) remembered in this browser
//   2. automatic progress saving + a live leaderboard  -> /api/submit, /api/leaderboard
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
// Random player names: an adjective + an antimicrobial (all US FDA-approved) starting with the same letter.
const DRUGS = [
  'Acyclovir', 'Amikacin', 'Amoxicillin', 'Amphotericin', 'Ampicillin', 'Anidulafungin', 'Atovaquone', 'Azithromycin',
  'Aztreonam', 'Baloxavir', 'Bedaquiline', 'Caspofungin', 'Cefadroxil', 'Cefazolin', 'Cefdinir', 'Cefepime', 'Cefiderocol',
  'Cefoxitin', 'Ceftaroline', 'Ceftazidime', 'Ceftriaxone', 'Cefuroxime', 'Cephalexin', 'Ciprofloxacin', 'Clarithromycin',
  'Clindamycin', 'Colistimethate', 'Dalbavancin', 'Daptomycin', 'Delafloxacin', 'Dicloxacillin', 'Doxycycline', 'Eravacycline',
  'Ertapenem', 'Erythromycin', 'Ethambutol', 'Famciclovir', 'Fidaxomicin', 'Fluconazole', 'Fosfomycin', 'Ganciclovir',
  'Gentamicin', 'Ibrexafungerp', 'Imipenem', 'Isavuconazonium', 'Isoniazid', 'Itraconazole', 'Lefamulin', 'Levofloxacin',
  'Linezolid', 'Meropenem', 'Metronidazole', 'Micafungin', 'Minocycline', 'Moxifloxacin', 'Nafcillin', 'Nitrofurantoin',
  'Nystatin', 'Omadacycline', 'Oritavancin', 'Oseltamivir', 'Oxacillin', 'Penicillin', 'Piperacillin', 'Plazomicin',
  'Polymyxin', 'Posaconazole', 'Remdesivir', 'Rezafungin', 'Rifabutin', 'Rifampin', 'Rifaximin', 'Streptomycin', 'Sulopenem',
  'Tedizolid', 'Telavancin', 'Terbinafine', 'Tigecycline', 'Tobramycin', 'Valacyclovir', 'Valganciclovir', 'Vancomycin',
  'Voriconazole'];
const ADJ = {
  A: ['Agile', 'Astute', 'Adept', 'Ambitious', 'Audacious', 'Awesome'],
  B: ['Bold', 'Brave', 'Bright', 'Brilliant', 'Brisk', 'Buoyant'],
  C: ['Calm', 'Clever', 'Confident', 'Courageous', 'Curious', 'Cheerful'],
  D: ['Daring', 'Dashing', 'Dauntless', 'Dazzling', 'Diligent', 'Dynamic'],
  E: ['Eager', 'Earnest', 'Elegant', 'Energetic', 'Epic', 'Excellent'],
  F: ['Fabulous', 'Fearless', 'Fierce', 'Focused', 'Formidable', 'Friendly'],
  G: ['Gallant', 'Genial', 'Gleaming', 'Gracious', 'Grand', 'Gutsy'],
  I: ['Illustrious', 'Ingenious', 'Insightful', 'Inspired', 'Intrepid', 'Inventive'],
  L: ['Legendary', 'Lionhearted', 'Lively', 'Loyal', 'Lucky', 'Luminous'],
  M: ['Magnificent', 'Marvelous', 'Masterful', 'Merry', 'Mighty', 'Mindful'],
  N: ['Nifty', 'Nimble', 'Noble', 'Nonstop', 'Notable', 'Nurturing'],
  O: ['Observant', 'Optimal', 'Optimistic', 'Original', 'Outstanding', 'Overachieving'],
  P: ['Persistent', 'Plucky', 'Powerful', 'Precise', 'Proactive', 'Prudent'],
  R: ['Radiant', 'Rapid', 'Reliable', 'Remarkable', 'Resolute', 'Resourceful'],
  S: ['Sharp', 'Sincere', 'Spirited', 'Steady', 'Stellar', 'Swift'],
  T: ['Tenacious', 'Terrific', 'Thoughtful', 'Tireless', 'Triumphant', 'Trusty'],
  V: ['Valiant', 'Venerable', 'Versatile', 'Vibrant', 'Vigilant', 'Vivid'],
};
const pick = a => a[Math.floor(Math.random() * a.length)];
const randomName = () => { const d = pick(DRUGS); return `${pick(ADJ[d[0]])} ${d}`; };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('aaw.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('aaw.' + k, JSON.stringify(v)); } catch { /* private browsing: works for this visit only */ } },
};
const me = store.get('player') || { id: crypto.randomUUID(), name: randomName() };
store.set('player', me);
const earned = new Set(store.get('codes') || []);   // games completed in this browser (stored as each game's hidden key)
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
    console.warn('Saving progress failed:', res.status, data.detail || data.error); // shows the real cause in the browser console
    throw new Error(data.error || 'Your progress was not saved. Try again in a minute.');
  }
  return data;
}

// --- Leaderboards: overall (games completed) plus one per game ---
const DOTS = 10;
const pts = n => n.toLocaleString() + ' pts';
const correct = n => n + ' correct';
// Same order as the games in the arcade
const BOARDS = [
  { id: 'overall', label: 'Games completed' },
  { id: 'blast', label: 'Bug Blaster', fmt: pts },
  { id: 'run', label: 'Antibiotic Runner', fmt: pts },
  { id: 'clock', label: 'Stop the Clock', fmt: pts },
  { id: 'whack', label: 'Order Whack', fmt: pts },
  { id: 'catch', label: 'Stewardship Catch', fmt: pts },
  { id: 'wheel', label: 'Stewardship Wheel', fmt: n => '$' + n.toLocaleString() },
  { id: 'allergy', label: 'Allergy Detective', fmt: pts },
  { id: 'myth', label: 'Myth or Fact', fmt: correct },
  { id: 'match', label: 'Bug–Drug Match', fmt: pts },
  { id: 'dash', label: 'De-escalation Dash', fmt: correct },
  { id: 'dur', label: 'Duration Station', fmt: correct },
  { id: 'scr', label: 'Stewardship Scramble', fmt: correct },
];
let current = 'overall';
let lastData = null;
const pickEl = $('board-pick');
pickEl.innerHTML = `<option value="overall">Games completed (overall)</option><optgroup label="Best score by game">` +
  BOARDS.slice(1).map(b => `<option value="${b.id}">${b.label}</option>`).join('') + '</optgroup>';
function showBoard(id) {
  current = id;
  pickEl.value = id;
  if (lastData) render(lastData);
}
pickEl.addEventListener('change', () => showBoard(pickEl.value));

// The leaderboard opens as a side panel from the button in the corner
const panel = $('board');
const toggle = $('board-toggle');
function openBoard(open) {
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', !open);
  panel.inert = !open;
  $('board-backdrop').hidden = !open;
  toggle.setAttribute('aria-expanded', open);
  if (open) { loadBoard(); pickEl.focus(); } else toggle.focus();
}
toggle.onclick = () => openBoard(!panel.classList.contains('open'));
$('board-close').onclick = () => openBoard(false);
$('board-backdrop').onclick = () => openBoard(false);
document.querySelectorAll('.open-board').forEach(b => { b.onclick = () => openBoard(true); });
// Tuck the button away mid-game so it never covers game controls; it returns on the menu or results screen
const arcadeEl = $('arcade');
new MutationObserver(() => {
  if (arcadeEl.querySelector('.menu, .again')) toggle.classList.remove('playing');
}).observe(arcadeEl, { childList: true, subtree: true });
document.addEventListener('aaw', e => { if (e.detail.type === 'start') toggle.classList.add('playing'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) openBoard(false); });

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
        `<span class="dots" aria-hidden="true">${dots}</span><span class="count">${p.count}<span class="visually-hidden"> game${p.count === 1 ? "" : "s"} completed</span></span></li>`;
    };
    $('board-list').innerHTML = data.top.length ? data.top.map(row).join('')
      : '<li class="empty">No games completed yet. Hit the target score in any game to take the top spot.</li>';
    $('board-meta').textContent = data.players ? `${data.players} player${data.players === 1 ? '' : 's'} so far` : '';
    const showMe = data.me && !data.top.some(p => p.me);
    $('board-me').hidden = !showMe;
    if (showMe) $('board-me').innerHTML = `You're #${data.me.rank} with ${data.me.count} game${data.me.count === 1 ? '' : 's'} completed.`;
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
  if (pending.size) save([]).then(() => status('Your saved progress was added to the leaderboard.', 'ok')).catch(() => {}); // keep retrying unsaved progress
}, 30000);

// Save progress, retrying later if the network or server hiccups
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

// --- Game events: tracking + automatic progress saving ---
const session = crypto.randomUUID(); // one random ID per visit, used only to count plays
document.addEventListener('aaw', e => {
  const { type, game, unlocked, code } = e.detail;
  const { score } = e.detail;
  const body = JSON.stringify({ session, player: me.id, name: me.name, type, game, unlocked: !!unlocked, score });
  navigator.sendBeacon?.('/api/event', body) || fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {});

  if (type === 'finish' && score != null) {
    if (BOARDS.some(b => b.id === game)) showBoard(game); // the panel opens on this game's scores
    toggle.classList.remove('nudge'); void toggle.offsetWidth; toggle.classList.add('nudge');
    setTimeout(loadBoard, 1000); // show the new score
  }

  if (code && !earned.has(code)) {
    earned.add(code);
    store.set('codes', [...earned]);
    const label = BOARDS.find(b => b.id === game)?.label || 'this game';
    status(`Saving your progress in ${label}…`);
    save([code])
      .then(d => status(`${label} completed. You've completed ${d.total} of ${d.of} games.`, 'ok'))
      .catch(() => status(`Your ${label} progress is saved in this browser and will be added to the leaderboard automatically once it's reachable.`, 'bad'));
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
    await submit([], name); // updates your name on the leaderboard; your progress stays with you
    status('Name saved.', 'ok');
    loadBoard();
  } catch (err) { status(err.message, 'bad'); }
});
