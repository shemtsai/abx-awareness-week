// GET /api/leaderboard?player=ID  -> top players by number of code words (the words themselves stay secret),
//                                   plus the top scores in each game
import { codes, db, json, cleanPlayer, players, gameBoards } from './_lib.js';

export async function GET(request) {
  const player = cleanPlayer(new URL(request.url).searchParams.get('player'));
  try {
    const sql = await db();
    const all = (await players(sql)).filter(p => p.codes.length);
    const row = (p, i) => ({ rank: i + 1, name: p.name, count: p.codes.length, me: !!player && p.key === player });
    const top = all.slice(0, 15).map(row);
    const i = player ? all.findIndex(p => p.key === player) : -1;
    const games = {};
    for (const [g, list] of Object.entries(await gameBoards(sql))) {
      games[g] = list.map((r, k) => ({ rank: k + 1, name: r.name, score: r.score, me: !!player && r.player === player }));
    }
    return json({ top, me: i >= 0 ? row(all[i], i) : null, players: all.length, of: Object.keys(codes()).length, games });
  } catch (err) {
    console.error(err);
    return json({ error: 'Leaderboard is unavailable right now.' }, 500);
  }
}
