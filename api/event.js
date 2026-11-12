// POST /api/event  { session, type, game, unlocked }  -> logs a game start or finish
import { codes, db } from './_lib.js';

const TYPES = new Set(['start', 'finish']);

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  // Only accept known games and event types, so junk can't pile up
  if (!TYPES.has(b.type) || !(b.game in codes())) return new Response(null, { status: 400 });
  try {
    const sql = await db();
    await sql`INSERT INTO events (session, type, game, unlocked)
              VALUES (${String(b.session || '').slice(0, 40)}, ${b.type}, ${b.game}, ${b.type === 'finish' ? !!b.unlocked : null})`;
  } catch (err) {
    console.error(err);
  }
  return new Response(null, { status: 204 });
}
