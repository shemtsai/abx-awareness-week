// GET  /api/comments?player=ID  -> public comments, newest first, with no timestamps (hidden ones left out); "mine" marks the asker's own
// POST /api/comments  { player, name, kind: 'comment' | 'feedback', text }
//   comment  = public note about ID/stewardship or Antibiotic Awareness Week, shown on the site right away
//   feedback = private note for the organizer, shown only on the admin page
// DELETE /api/comments  { player, id }  -> deletes a comment, but only one posted from that same browser
import { db, json, cleanName, cleanPlayer } from './_lib.js';

export async function GET(request) {
  const player = cleanPlayer(new URL(request.url).searchParams.get('player'));
  try {
    const sql = await db();
    const rows = await sql`SELECT id, name, body, player_id FROM comments
                           WHERE kind = 'comment' AND NOT hidden ORDER BY created_at DESC LIMIT 60`;
    return json({ comments: rows.map(r => ({ id: r.id, name: r.name, text: r.body, mine: !!player && r.player_id === player })) });
  } catch (err) {
    console.error(err);
    return json({ error: 'Comments are unavailable right now.', detail: err.message }, 500);
  }
}

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const kind = b.kind === 'feedback' ? 'feedback' : b.kind === 'comment' ? 'comment' : null;
  const text = String(b.text || '').trim().replace(/\s+\n/g, '\n').slice(0, 500);
  const player = cleanPlayer(b.player);
  if (!kind) return json({ error: 'Unknown message type.' }, 400);
  if (text.length < 3) return json({ error: 'Please write a little more.' }, 400);
  if (/https?:|www\./i.test(text)) return json({ error: 'Please leave out links.' }, 400);
  try {
    const sql = await db();
    // A few posts per person every 10 minutes is plenty; this keeps accidental repeats and spam out
    if (player) {
      const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM comments WHERE player_id = ${player} AND created_at > now() - interval '10 minutes'`;
      if (n >= 5) return json({ error: 'You have posted several times in the last few minutes. Please try again later.' }, 429);
    }
    const name = (b.anonymous ? '' : cleanName(b.name)) || 'Anonymous';
    await sql`INSERT INTO comments (player_id, name, kind, body) VALUES (${player}, ${name}, ${kind}, ${text})`;
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Your message could not be saved. Please try again.', detail: err.message }, 500);
  }
}

export async function DELETE(request) {
  const b = await request.json().catch(() => ({}));
  const player = cleanPlayer(b.player);
  if (!player || !Number.isInteger(b.id)) return json({ error: 'Missing comment.' }, 400);
  try {
    const sql = await db();
    const gone = await sql`DELETE FROM comments WHERE id = ${b.id} AND player_id = ${player} AND kind = 'comment' RETURNING id`;
    if (!gone.length) return json({ error: 'You can only delete your own comments.' }, 403);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'The comment could not be deleted. Please try again.', detail: err.message }, 500);
  }
}
