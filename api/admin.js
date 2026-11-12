// GET /api/admin  (header x-admin-key)  -> leaderboard + game activity for the admin page
import { codes, db, json } from './_lib.js';

export async function GET(request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return json({ error: 'ADMIN_KEY is not set in Vercel yet.' }, 500);
  if (request.headers.get('x-admin-key') !== key) return json({ error: 'Wrong admin key.' }, 401);

  try {
    const sql = await db();
    const subs = await sql`SELECT name, name_key, codes, created_at FROM submissions ORDER BY created_at`;
    const people = new Map();
    for (const s of subs) {
      const p = people.get(s.name_key) || { name: s.name, codes: new Set(), last: s.created_at };
      s.codes.split(' ').filter(Boolean).forEach(c => p.codes.add(c));
      p.name = s.name; // show the most recent spelling
      p.last = s.created_at;
      people.set(s.name_key, p);
    }
    // Most codes first; ties go to whoever got there first
    const leaders = [...people.values()]
      .map(p => ({ name: p.name, count: p.codes.size, codes: [...p.codes].sort(), last: p.last }))
      .sort((a, b) => b.count - a.count || new Date(a.last) - new Date(b.last));

    const ev = await sql`SELECT game, type, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE unlocked)::int AS u FROM events GROUP BY game, type`;
    const [{ visits }] = await sql`SELECT COUNT(DISTINCT session)::int AS visits FROM events`;
    const games = Object.keys(codes()).map(game => {
      const start = ev.find(r => r.game === game && r.type === 'start');
      const fin = ev.find(r => r.game === game && r.type === 'finish');
      return { game, started: start?.n || 0, finished: fin?.n || 0, unlocked: fin?.u || 0 };
    }).sort((a, b) => b.started - a.started);

    return json({ leaders, games, visits, totalCodes: Object.keys(codes()).length });
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}
