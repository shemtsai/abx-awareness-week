// GET /api/leaderboard?player=ID  -> top players by games completed, plus the top scores in each game.
// "me" entries give the asking player's own rank even when they're outside the top of the list.
import { codes, db, json, cleanPlayer, players, gameBoards } from './_lib.js';

export async function GET(request) {
  const player = cleanPlayer(new URL(request.url).searchParams.get('player'));
  try {
    const sql = await db();
    const gameOf = Object.fromEntries(Object.entries(codes()).map(([g, c]) => [c, g])); // hidden key -> game id
    const all = (await players(sql)).filter(p => p.codes.length);
    const row = (p, i) => ({ rank: i + 1, name: p.name, count: p.codes.length, me: !!player && p.key === player });
    const i = player ? all.findIndex(p => p.key === player) : -1;
    const me = i >= 0 ? { ...row(all[i], i), games: all[i].codes.map(c => gameOf[c]).filter(Boolean) } : null;
    return json({ top: all.slice(0, 10).map(row), me, players: all.length, of: Object.keys(gameOf).length, games: await gameBoards(sql, player) });
  } catch (err) {
    console.error(err);
    return json({ error: 'Leaderboard is unavailable right now.', detail: err.message }, 500);
  }
}
