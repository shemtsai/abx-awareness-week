// POST /api/event  { session, player, name, type, game, unlocked, score, ms }  -> logs a page visit, game start, game finish or unfinished game
import { codes, db, cleanName, cleanPlayer } from './_lib.js';

const TYPES = new Set(['visit', 'start', 'finish', 'partial']); // partial = left a game mid-round; its score still counts
const PAGES = new Set(['home', 'learn']); // a 'visit' event's game field holds the page instead

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  // Only accept known games and event types, so junk can't pile up
  let known;
  try { known = codes(); } catch (err) { console.error(err); return new Response(null, { status: 500 }); }
  if (!TYPES.has(b.type) || !(b.type === 'visit' ? PAGES.has(b.game) : b.game in known)) return new Response(null, { status: 400 });
  const finish = b.type === 'finish', scored = finish || b.type === 'partial';
  const score = scored && Number.isFinite(+b.score) ? Math.max(-100000, Math.min(1000000, Math.round(+b.score))) : null;
  const ms = scored && Number.isFinite(+b.ms) && +b.ms > 0 ? Math.min(7200000, Math.round(+b.ms)) : null;
  try {
    const sql = await db();
    await sql`INSERT INTO events (session, player_id, name, type, game, unlocked, score, ms)
              VALUES (${String(b.session || '').slice(0, 40)}, ${cleanPlayer(b.player)}, ${cleanName(b.name) || null},
                      ${b.type}, ${b.game}, ${finish ? !!b.unlocked : null}, ${score}, ${ms})`;
  } catch (err) {
    console.error(err);
  }
  return new Response(null, { status: 204 });
}
