// GET  /api/admin  (header x-admin-key)  -> leaderboard, game activity, comments and private feedback
// POST /api/admin  (header x-admin-key)  { id, hidden }  -> hide or show a public comment
import { codes, db, json, players } from './_lib.js';

function denied(request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return json({ error: 'ADMIN_KEY is not set in Vercel yet.' }, 500);
  if (request.headers.get('x-admin-key') !== key) return json({ error: 'Wrong admin key.' }, 401);
  return null;
}

export async function POST(request) {
  const no = denied(request);
  if (no) return no;
  const b = await request.json().catch(() => ({}));
  if (!Number.isInteger(b.id)) return json({ error: 'Missing comment id.' }, 400);
  try {
    const sql = await db();
    await sql`UPDATE comments SET hidden = ${!!b.hidden} WHERE id = ${b.id}`;
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}

export async function GET(request) {
  const no = denied(request);
  if (no) return no;

  try {
    const sql = await db();
    const gameOf = Object.fromEntries(Object.entries(codes()).map(([g, c]) => [c, g])); // hidden key -> game id
    const leaders = (await players(sql)).filter(p => p.codes.length)
      .map(p => ({ name: p.name, count: p.codes.length, codes: p.codes.map(c => gameOf[c] || c), last: p.last }));

    const ev = await sql`SELECT game, type, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE unlocked)::int AS u FROM events GROUP BY game, type`;
    const [{ visits }] = await sql`SELECT COUNT(DISTINCT session)::int AS visits FROM events`;
    const games = Object.keys(codes()).map(game => {
      const start = ev.find(r => r.game === game && r.type === 'start');
      const fin = ev.find(r => r.game === game && r.type === 'finish');
      return { game, started: start?.n || 0, finished: fin?.n || 0, unlocked: fin?.u || 0 };
    }).sort((a, b) => b.started - a.started);

    const notes = await sql`SELECT id, name, kind, body, hidden, created_at FROM comments ORDER BY created_at DESC LIMIT 500`;
    const note = r => ({ id: r.id, name: r.name, text: r.body, hidden: r.hidden, at: r.created_at });
    return json({ leaders, games, visits, totalCodes: Object.keys(codes()).length,
      comments: notes.filter(r => r.kind === 'comment').map(note), feedback: notes.filter(r => r.kind === 'feedback').map(note) });
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}
