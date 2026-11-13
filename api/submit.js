// POST /api/submit  { player, name, codes }  -> saves valid code words for that player
// `player` is a random ID kept in the player's browser, so changing your name keeps your codes together.
import { codes, db, json, cleanName, cleanPlayer, nameKey, players } from './_lib.js';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = cleanName(body.name);
  if (!name) return json({ error: 'Please enter a name or initials.' }, 400);
  const player = cleanPlayer(body.player);

  const valid = new Set(Object.values(codes()));
  const submitted = [...new Set(String(body.codes || '').toUpperCase().split(/[^A-Z]+/).filter(Boolean))].slice(0, 30);
  const accepted = submitted.filter(c => valid.has(c));
  const rejected = submitted.filter(c => !valid.has(c));
  // An empty submission is allowed for a signed-in player: it just updates their display name
  if (!accepted.length && !(player && !submitted.length)) {
    return json({ error: submitted.length ? `Not recognized: ${rejected.join(', ')}. Check the spelling.` : 'Please enter at least one code word.' }, 400);
  }

  try {
    const sql = await db();
    await sql`INSERT INTO submissions (name, name_key, codes, player_id) VALUES (${name}, ${nameKey(name)}, ${accepted.join(' ')}, ${player})`;
    const me = (await players(sql)).find(p => p.key === (player || 'n:' + nameKey(name)));
    return json({ accepted, rejected, total: me ? me.codes.length : 0, of: valid.size });
  } catch (err) {
    console.error(err);
    return json({ error: 'Your codes were not saved. Try again in a minute.' }, 500);
  }
}
