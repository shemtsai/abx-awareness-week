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
const me = store.get('player') || { id: store.get('visitor') || crypto.randomUUID(), name: randomName() };
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

// --- Leaderboard panel: your progress, overall standings, and every game's top scores in one scroll ---
const pts = n => n.toLocaleString() + ' pts';
// Same order as the games in the arcade
const GAMES = [
  { id: 'blast', label: 'Bug Blaster', fmt: pts },
  { id: 'run', label: 'Antibiotic Runner', fmt: pts },
  { id: 'clock', label: 'Stop the Clock', fmt: pts },
  { id: 'whack', label: 'Order Whack', fmt: pts },
  { id: 'catch', label: 'Stewardship Catch', fmt: pts },
  { id: 'wheel', label: 'Stewardship Wheel', fmt: n => '$' + n.toLocaleString() },
  { id: 'allergy', label: 'Allergy Detective', fmt: pts },
  { id: 'myth', label: 'Myth or Fact', fmt: pts },
  { id: 'match', label: 'Bug–Drug Match', fmt: pts },
  { id: 'dash', label: 'De-escalation Dash', fmt: pts },
  { id: 'dur', label: 'Test or Rest', fmt: pts },
  { id: 'scr', label: 'Stewardship Scramble', fmt: pts },
];
let lastData = null;
let focusGame = null; // the game just played: its card is highlighted and scrolled into view
const done = new Set(store.get('done') || []); // games completed in this browser, shown before the server answers

// Side panels (leaderboard; comments & feedback) open from the buttons in the corner, one at a time
const toggle = $('board-toggle');
const panels = {
  board: { el: $('board'), btn: toggle, onOpen: () => { loadBoard(); scrollToGame(focusGame); } },
  talk: { el: $('talk'), btn: $('talk-toggle'), onOpen: () => loadComments() },
};
function openPanel(name, open) {
  Object.entries(panels).forEach(([n, p]) => {
    const on = open && n === name;
    if (!on && !p.el.classList.contains('open')) return;
    p.el.classList.toggle('open', on);
    p.el.setAttribute('aria-hidden', !on);
    p.el.inert = !on;
    p.btn.setAttribute('aria-expanded', on);
  });
  $('board-backdrop').hidden = !open;
  const p = panels[name];
  if (open) { p.onOpen(); p.el.querySelector('.board-close').focus(); } else p.btn.focus();
}
const isOpen = name => panels[name].el.classList.contains('open');
const openBoard = open => openPanel('board', open);
Object.entries(panels).forEach(([name, p]) => {
  p.btn.onclick = () => openPanel(name, !isOpen(name));
  p.el.querySelector('.board-close').onclick = () => openPanel(name, false);
});
$('board-backdrop').onclick = () => Object.keys(panels).forEach(n => isOpen(n) && openPanel(n, false));
document.querySelectorAll('.open-board').forEach(b => { b.onclick = () => openBoard(true); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') Object.keys(panels).forEach(n => isOpen(n) && openPanel(n, false)); });

// Tuck the buttons away mid-game so they never cover game controls; they return on the menu or results screen
const arcadeEl = $('arcade');
const corner = $('corner-btns');
new MutationObserver(() => {
  if (arcadeEl.querySelector('.menu, .again, .ov .go')) corner.classList.remove('playing');
}).observe(arcadeEl, { childList: true, subtree: true });
document.addEventListener('aaw', e => { if (e.detail.type === 'start') corner.classList.add('playing'); });

// --- Comments & feedback ---
const talkForm = $('talk-form');
const kindOf = () => talkForm.elements.kind.value;
function talkMode() {
  const fb = kindOf() === 'feedback';
  $('talk-send').textContent = fb ? 'Send private feedback' : 'Post comment';
  talkForm.querySelector('.talk-anon').hidden = fb;
  $('talk-text').placeholder = fb ? 'What would make these games better?' : 'For example, a stewardship win you are proud of, or thanks to your ID and pharmacy teams.';
}
talkForm.addEventListener('change', talkMode);
$('talk-text').addEventListener('input', () => { $('talk-left').textContent = (500 - $('talk-text').value.length) + ' left'; });
talkMode();
async function loadComments() {
  try {
    const res = await fetch('/api/comments?player=' + encodeURIComponent(me.id));
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error);
    $('talk-list').innerHTML = data.comments.length
      ? data.comments.map(c => `<li${c.mine ? ' class="mine"' : ''}><p>${esc(c.text)}</p><small>${esc(c.name)}` +
          (c.mine ? ` · <button type="button" class="link del" data-id="${c.id}">Delete</button>` : '') + '</small></li>').join('')
      : '<li class="empty">No comments yet. Be the first to share something.</li>';
  } catch (err) {
    console.warn('Comments failed:', err.message);
    $('talk-list').innerHTML = '<li class="empty">Comments will appear on the live site.</li>';
  }
}
// People can delete comments they posted from this browser (the server checks the browser's player ID)
$('talk-list').addEventListener('click', async e => {
  const btn = e.target.closest('.del');
  if (!btn || !confirm('Delete this comment?')) return;
  btn.disabled = true;
  const res = await fetch('/api/comments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player: me.id, id: +btn.dataset.id }) }).catch(() => null);
  const st = $('talk-status');
  if (res && res.ok) { st.className = 'talk-status ok'; st.textContent = 'Your comment was deleted.'; loadComments(); }
  else { btn.disabled = false; st.className = 'talk-status bad'; st.textContent = 'That comment could not be deleted. Please try again.'; }
});
talkForm.addEventListener('submit', async e => {
  e.preventDefault();
  const text = $('talk-text').value.trim();
  const st = $('talk-status');
  if (text.length < 3) { st.className = 'talk-status bad'; st.textContent = 'Please write a little more.'; return; }
  const kind = kindOf();
  $('talk-send').disabled = true;
  st.className = 'talk-status'; st.textContent = 'Sending…';
  try {
    const res = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: me.id, name: me.name, kind, text, anonymous: talkForm.elements.anonymous.checked }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Your message could not be sent.');
    talkForm.reset(); talkMode(); $('talk-left').textContent = '500 left';
    st.className = 'talk-status ok';
    st.textContent = kind === 'feedback' ? 'Thank you. Your feedback was sent privately.' : 'Thank you. Your comment is posted below.';
    if (kind === 'comment') loadComments();
  } catch (err) {
    st.className = 'talk-status bad'; st.textContent = err.message;
  } finally {
    $('talk-send').disabled = false;
  }
});

function scrollToGame(id) {
  const card = id && $('gc-' + id);
  if (card) setTimeout(() => card.scrollIntoView({ block: 'center', behavior: 'smooth' }), 260);
}

// "Play" opens that game's instructions in the arcade
function play(id) {
  const g = GAMES.find(x => x.id === id);
  openBoard(false);
  arcadeEl.querySelector('.back')?.click(); // back to the menu if a game is open
  const tile = [...arcadeEl.querySelectorAll('.tile')].find(t => t.querySelector('h3')?.textContent === g.label);
  tile?.click();
  arcadeEl.scrollIntoView({ behavior: 'smooth' });
}
panels.board.el.addEventListener('click', e => {
  const btn = e.target.closest('[data-play], [data-jump]');
  if (!btn) return;
  if (btn.dataset.play) play(btn.dataset.play);
  else scrollToGame(btn.dataset.jump);
});

const rankRow = (p, value) => `<li class="${p.me ? 'me' : ''}"><span class="rank r${p.rank}">${p.rank}</span>` +
  `<span class="who">${esc(p.name)}${p.me ? ' <em>(you)</em>' : ''}</span><span class="val">${value}</span></li>`;

function render(data) {
  const of = data.of || GAMES.length;
  const mine = new Set(data.me?.games || []);
  done.forEach(g => mine.add(g));
  $('board-meta').textContent = (data.players ? `${data.players} player${data.players === 1 ? '' : 's'} so far · ` : '') +
    'Updated ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Your progress: one chip per game, filled in once you hit its target score. Tap a chip to see that game's scores.
  $('board-you').innerHTML =
    `<p class="you-name">${esc(me.name)}</p>` +
    `<p class="you-line"><strong>${mine.size} of ${of}</strong> games completed` +
    (data.me ? ` · <strong>#${data.me.rank}</strong> of ${data.players} overall` : '') + '</p>' +
    `<div class="chips">${GAMES.map(g => `<button type="button" class="chip ${mine.has(g.id) ? 'on' : ''}" data-jump="${g.id}"` +
      ` aria-label="${g.label}: ${mine.has(g.id) ? 'completed' : 'not completed yet'}">${mine.has(g.id) ? '✓ ' : ''}${g.label}</button>`).join('')}</div>`;

  // Overall standings, with a slim bar showing how many of the games each person has completed
  const bar = n => `<span class="bar" aria-hidden="true"><i style="width:${Math.round(n / of * 100)}%"></i></span>`;
  $('board-overall').innerHTML = data.top.length
    ? data.top.map(p => rankRow(p, `${p.count}/${of}${bar(p.count)}`)).join('') +
      (data.me && !data.top.some(p => p.me) ? `<li class="gap" aria-hidden="true">⋯</li>` + rankRow({ ...data.me, me: true }, `${data.me.count}/${of}${bar(data.me.count)}`) : '')
    : '<li class="empty">No games completed yet. Hit the target score in any game to take the top spot.</li>';

  // Every game's podium, with the rest of the top 10 one tap away and your own best always shown
  $('board-games').innerHTML = GAMES.map(g => {
    const b = data.games?.[g.id] || { top: [] };
    const top = b.top || [];
    const rows = list => list.map(p => rankRow(p, g.fmt(p.score))).join('');
    const you = b.me
      ? `You: <strong>#${b.me.rank}</strong> of ${b.players} · best ${g.fmt(b.me.score)}`
      : 'You haven’t played this one yet.';
    return `<article class="game-card ${g.id === focusGame ? 'focus' : ''}" id="gc-${g.id}">
      <header><h4>${g.label}</h4><button type="button" class="play" data-play="${g.id}">Play</button></header>
      ${top.length ? `<ol class="ranks">${rows(top.slice(0, 3))}</ol>` +
        (top.length > 3 ? `<details><summary>Show top ${top.length}</summary><ol class="ranks">${rows(top.slice(3))}</ol></details>` : '')
        : '<p class="empty">No scores yet. Be the first.</p>'}
      <p class="mine ${b.me ? '' : 'none'}">${you}</p>
    </article>`;
  }).join('');
}

async function loadBoard() {
  try {
    const res = await fetch('/api/leaderboard?player=' + encodeURIComponent(me.id));
    const data = await res.json();
    if (!res.ok) { console.warn('Leaderboard failed:', res.status, data.detail || data.error); throw new Error(data.error); }
    lastData = data;
    render(data);
  } catch {
    $('board-overall').innerHTML = '<li class="empty">The leaderboard will appear on the live site.</li>';
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
const session = crypto.randomUUID(); // one random ID per visit, used only to count visits and plays
function beacon(body) { navigator.sendBeacon?.('/api/event', body) || fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {}); }
beacon(JSON.stringify({ session, player: me.id, type: 'visit', game: 'home' }));
document.addEventListener('aaw', e => {
  const { type, game, unlocked, code } = e.detail;
  const { score } = e.detail;
  const body = JSON.stringify({ session, player: me.id, name: me.name, type, game, unlocked: !!unlocked, score });
  beacon(body);

  if (type === 'finish' && score != null) {
    if (GAMES.some(g => g.id === game)) focusGame = game; // the panel opens on this game's scores
    if (unlocked) { done.add(game); store.set('done', [...done]); }
    toggle.classList.remove('nudge'); void toggle.offsetWidth; toggle.classList.add('nudge');
    setTimeout(loadBoard, 1000); // show the new score
  }

  if (code && !earned.has(code)) {
    earned.add(code);
    store.set('codes', [...earned]);
    const label = GAMES.find(g => g.id === game)?.label || 'this game';
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
