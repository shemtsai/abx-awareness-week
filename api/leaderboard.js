// GET /api/leaderboard?player=ID  -> medal standings, the top scores in each game, and top players by games completed.
// "me" entries give the asking player's own rank even when they're outside the top of the list.
import { codes, db, json, cleanPlayer, players, gameBoards } from './_lib.js';

export async function GET(request) {
  const player = cleanPlayer(new URL(request.url).searchParams.get('player'));
  try {
    const sql = await db();
    const gameOf = Object.fromEntries(Object.entries(codes()).map(([g, c]) => [c, g])); // hidden key -> game id
    const all = (await players(sql)).filter(p => p.codes.length);
    // Equal counts share a rank (1, 1, 3)
    const row = p => ({ rank: all.findIndex(x => x.codes.length === p.codes.length) + 1, name: p.name, count: p.codes.length, me: !!player && p.key === player });
    const i = player ? all.findIndex(p => p.key === player) : -1;
    const me = i >= 0 ? { ...row(all[i]), games: all[i].codes.map(c => gameOf[c]).filter(Boolean) } : null;
    const { boards, medals } = await gameBoards(sql, player);
    return json({ top: all.slice(0, 10).map(p => row(p)), me, players: all.length, of: Object.keys(gameOf).length, games: boards, medals });
  } catch (err) {
    console.error(err);
    return json({ error: 'Leaderboard is unavailable right now.', detail: err.message }, 500);
  }
}
