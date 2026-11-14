// Admin page: site traffic and heatmaps, leaderboard, game activity, private feedback and public comments (hide/show).
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
  const tile = (n, label) => `<div class="stat"><strong>${Number(n).toLocaleString()}</strong><span>${label}</span></div>`;
  document.getElementById('stats').innerHTML = tile(t.visitors, 'Unique visitors') + tile(t.visits, 'Total visits') + tile(t.today, 'Visits today') +
    tile(t.players, 'People who played') + tile(t.plays, 'Games started') + tile(t.finishes, 'Games finished');
  const pv = Object.fromEntries(data.pages.map(p => [p.page, p.n]));
  document.getElementById('traffic-note').textContent = `Page views: ${pv.home || 0} on the game page, ${pv.learn || 0} on the Learn more page. ` +
    'Visitors are counted per browser, so one person on two devices counts twice. Visits before Nov 14 were only counted if a game was played.';

  // Heatmaps: one row per day (newest first)
  const days = [...new Set(data.byDay.map(d => d.day))].sort().reverse();
  const dayLabel = d => new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const shade = (n, max) => n ? `style="background:rgba(31,111,139,${(0.12 + 0.88 * n / max).toFixed(2)});color:${n / max > .55 ? '#fff' : 'inherit'}"` : '';
  const hourMax = Math.max(1, ...data.byHour.map(r => r.n));
  const cell = Object.fromEntries(data.byHour.map(r => [r.day + '|' + r.hour, r.n]));
  const hourLabel = h => (h % 12 || 12) + (h < 12 ? 'a' : 'p');
  document.getElementById('heat-hours').innerHTML = days.length
    ? `<thead><tr><th></th>${[...Array(24).keys()].map(h => `<th>${hourLabel(h)}</th>`).join('')}<th class="num">Visits</th><th class="num">Visitors</th></tr></thead><tbody>` +
      days.map(d => { const tot = data.byDay.find(x => x.day === d);
        return `<tr><th>${dayLabel(d)}</th>${[...Array(24).keys()].map(h => { const n = cell[d + '|' + h] || 0; return `<td ${shade(n, hourMax)} title="${n} visits">${n || ''}</td>`; }).join('')}` +
          `<td class="num">${tot.visits}</td><td class="num">${tot.visitors}</td></tr>`; }).join('') + '</tbody>'
    : '<tbody><tr><td>No visits in the last 14 days.</td></tr></tbody>';
  const gMax = Math.max(1, ...data.playsByDay.map(r => r.n));
  const gc = Object.fromEntries(data.playsByDay.map(r => [r.game + '|' + r.day, r.n]));
  const gdays = [...new Set(data.playsByDay.map(r => r.day))].sort();
  document.getElementById('heat-games').innerHTML = gdays.length
    ? `<thead><tr><th></th>${gdays.map(d => `<th>${dayLabel(d).replace(/^\w+, /, '')}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>` +
      Object.keys(GAME_NAMES).map(g => { const row = gdays.map(d => gc[g + '|' + d] || 0);
        return `<tr><th>${gname(g)}</th>${row.map(n => `<td ${shade(n, gMax)}>${n || ''}</td>`).join('')}<td class="num">${row.reduce((a, b) => a + b, 0)}</td></tr>`; }).join('') + '</tbody>'
    : '<tbody><tr><td>No games played in the last 14 days.</td></tr></tbody>';

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

  ['traffic', 'heat', 'heat-games-card', 'leaders', 'games', 'feedback', 'comments'].forEach(id => { document.getElementById(id).hidden = false; });
}
