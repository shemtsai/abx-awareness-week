// POST /api/event  { session, player, name, type, game, unlocked, score }  -> logs a game start or finish
import { codes, db, cleanName, cleanPlayer } from './_lib.js';

const TYPES = new Set(['start', 'finish']);

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  // Only accept known games and event types, so junk can't pile up
  if (!TYPES.has(b.type) || !(b.game in codes())) return new Response(null, { status: 400 });
  const finish = b.type === 'finish';
  const score = finish && Number.isFinite(+b.score) ? Math.max(-100000, Math.min(1000000, Math.round(+b.score))) : null;
  try {
    const sql = await db();
    await sql`INSERT INTO events (session, player_id, name, type, game, unlocked, score)
              VALUES (${String(b.session || '').slice(0, 40)}, ${cleanPlayer(b.player)}, ${cleanName(b.name) || null},
                      ${b.type}, ${b.game}, ${finish ? !!b.unlocked : null}, ${score})`;
  } catch (err) {
    console.error(err);
  }
  return new Response(null, { status: 204 });
}
