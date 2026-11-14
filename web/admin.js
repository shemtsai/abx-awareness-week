// Admin page: engagement summary, leaderboard, game activity, private feedback and public comments (hide/show).
// Needs the ADMIN_KEY you set in Vercel. Only anonymous random IDs are counted: no IP addresses, locations or cookies.
import './style.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/bricolage-grotesque/opsz.css';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GAME_NAMES = { blast: 'Bug Blaster', run: 'Antibiotic Runner', clock: 'Stop the Clock', whack: 'Order Whack', catch: 'Stewardship Catch',
  wheel: 'Stewardship Wheel', allergy: 'Allergy Detective', myth: 'Myth or Fact', match: 'Bug–Drug Match', dash: 'De-escalation Dash',
  dur: 'Test or Rest', scr: 'Stewardship Scramble' };
const gname = id => GAME_NAMES[id] || id;
const form = document.getElementById('key-form');
const status = document.getElementById('status');

form.addEventListener('submit', e => { e.preventDefault(); load(); });

async function load() {
  status.textContent = 'Loading…';
  const res = await fetch('/api/admin', { headers: { 'x-admin-key': form.elements.key.value } });
  const data = await res.json().catch(() => ({ error: 'Could not reach the server.' }));
  if (!res.ok) { status.textContent = data.error; return; }
  status.textContent = `Updated ${new Date().toLocaleString()}`;

  document.querySelector('#leader-note').textContent = `${data.leaders.length} people have completed at least one of the ${data.totalCodes} games.`;
  document.querySelector('#leaders tbody').innerHTML = data.leaders.map((p, i) =>
    `<tr><td>${i + 1}</td><td>${esc(p.name)}</td><td class="num">${p.count}</td><td>${esc(p.codes.map(gname).join(', '))}</td><td>${new Date(p.last).toLocaleString()}</td></tr>`
  ).join('');

  // Traffic summary
  const t = data.totals;
  const tile = (n, label) => `<div class="stat"><strong>${typeof n === 'number' ? n.toLocaleString() : n}</strong><span>${label}</span></div>`;
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
  const visible = data.comments.filter(c => !c.hidden).length;
  document.getElementById('stats').innerHTML = tile(t.visitors, 'Unique visitors') + tile(t.visits, 'Total visits') +
    tile(t.players, 'People who played') + tile(pct(t.players, t.visitors), 'Visitors who played') +
    tile(t.plays, 'Games started') + tile(t.finishes, 'Games finished') +
    tile(t.players ? (t.plays / t.players).toFixed(1) : '–', 'Games per player') + tile(t.completers, 'People who hit a target') +
    tile(visible, 'Public comments') + tile(data.feedback.length, 'Feedback messages');
  const pv = Object.fromEntries(data.pages.map(p => [p.page, p.n]));
  document.getElementById('traffic-note').textContent = `Page views: ${pv.home || 0} on the game page, ${pv.learn || 0} on the Learn more page. ` +
    'Visitors are counted per browser (one person on two devices counts twice). Visits before Nov 14 were only counted if a game was played.';

  document.querySelector('#games-note').textContent = 'All-time counts. Players = different browsers that started the game.';
  document.querySelector('#games tbody').innerHTML = data.games.map(g =>
    `<tr><td>${esc(gname(g.game))}</td><td class="num">${g.started}</td><td class="num">${g.players}</td><td class="num">${g.finished}</td><td class="num">${g.unlocked}</td><td class="num">${g.finished ? Math.round(g.unlocked / g.finished * 100) + '%' : '–'}</td></tr>`
  ).join('');

  document.getElementById('csv').onclick = () => {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Rank', 'Name', 'Games completed', 'Games', 'Last completed'], ...data.leaders.map((p, i) => [i + 1, p.name, p.count, p.codes.map(gname).join('; '), p.last])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'aaw-leaderboard.csv';
    a.click();
  };

  const when = t => new Date(t).toLocaleString();
  document.querySelector('#feedback-note').textContent = data.feedback.length ? `${data.feedback.length} message${data.feedback.length === 1 ? '' : 's'}. Only you can see these.` : 'No feedback yet.';
  document.querySelector('#feedback tbody').innerHTML = data.feedback.map(f =>
    `<tr><td>${when(f.at)}</td><td>${esc(f.name)}</td><td class="note">${esc(f.text)}</td></tr>`).join('');

  const shown = data.comments.filter(c => !c.hidden).length;
  document.querySelector('#comments-note').textContent = `${shown} showing on the site, ${data.comments.length - shown} hidden.`;
  document.querySelector('#comments tbody').innerHTML = data.comments.map(c =>
    `<tr class="${c.hidden ? 'is-hidden' : ''}"><td>${when(c.at)}</td><td>${esc(c.name)}</td><td class="note">${esc(c.text)}</td>` +
    `<td><button type="button" class="ghost" data-id="${c.id}" data-hide="${!c.hidden}">${c.hidden ? 'Show' : 'Hide'}</button></td></tr>`).join('');
  document.querySelectorAll('#comments [data-id]').forEach(b => {
    b.onclick = async () => {
      b.disabled = true;
      const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': form.elements.key.value },
        body: JSON.stringify({ id: +b.dataset.id, hidden: b.dataset.hide === 'true' }) });
      if (r.ok) load(); else { b.disabled = false; status.textContent = 'Could not update that comment.'; }
    };
  });

  ['traffic', 'leaders', 'games', 'feedback', 'comments'].forEach(id => { document.getElementById(id).hidden = false; });
}
