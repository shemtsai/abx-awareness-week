// Admin page: shows the leaderboard and game activity. Needs the ADMIN_KEY you set in Vercel.
import './style.css';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const form = document.getElementById('key-form');
const status = document.getElementById('status');

form.addEventListener('submit', async e => {
  e.preventDefault();
  status.textContent = 'Loading…';
  const res = await fetch('/api/admin', { headers: { 'x-admin-key': form.elements.key.value } });
  const data = await res.json().catch(() => ({ error: 'Could not reach the server.' }));
  if (!res.ok) { status.textContent = data.error; return; }
  status.textContent = `Updated ${new Date().toLocaleString()}`;

  document.querySelector('#leader-note').textContent = `${data.leaders.length} people have submitted. ${data.totalCodes} code words in the game.`;
  document.querySelector('#leaders tbody').innerHTML = data.leaders.map((p, i) =>
    `<tr><td>${i + 1}</td><td>${esc(p.name)}</td><td class="num">${p.count}</td><td>${esc(p.codes.join(', '))}</td><td>${new Date(p.last).toLocaleString()}</td></tr>`
  ).join('');

  document.querySelector('#games-note').textContent = `${data.visits} visits to the Vercel site with at least one game played.`;
  document.querySelector('#games tbody').innerHTML = data.games.map(g =>
    `<tr><td>${esc(g.game)}</td><td class="num">${g.started}</td><td class="num">${g.finished}</td><td class="num">${g.unlocked}</td><td class="num">${g.finished ? Math.round(g.unlocked / g.finished * 100) + '%' : '–'}</td></tr>`
  ).join('');

  document.getElementById('leaders').hidden = false;
  document.getElementById('games').hidden = false;
});
