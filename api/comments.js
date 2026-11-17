// GET  /api/comments?player=ID  -> public comments, newest first, each with its replies and reaction counts.
//      No timestamps; hidden ones left out; "mine" marks the asker's own comments and reactions.
// POST /api/comments  { player, name, kind: 'comment' | 'feedback', text, parent? }   parent = id of the comment being replied to
// POST /api/comments  { player, react: { id, emoji } }  -> adds or removes that player's reaction
//   comment  = public note about ID/stewardship or Antibiotic Awareness Week, shown on the site right away
//   feedback = private note for the organizer, shown only on the admin page
// DELETE /api/comments  { player, id }  -> deletes a comment (and its replies), but only one posted from that same browser
import { db, json, cleanName, cleanPlayer } from './_lib.js';

export const EMOJIS = ['👏', '❤️', '🙌', '💡'];

export async function GET(request) {
  const player = cleanPlayer(new URL(request.url).searchParams.get('player'));
  try {
    const sql = await db();
    const rows = await sql`SELECT c.id, c.name, c.body, c.player_id, c.parent_id FROM comments c
      LEFT JOIN comments p ON p.id = c.parent_id
      WHERE c.kind = 'comment' AND NOT c.hidden AND (c.parent_id IS NULL OR (p.id IS NOT NULL AND NOT p.hidden))
      ORDER BY c.created_at DESC LIMIT 400`;
    const reacts = await sql`SELECT comment_id, emoji, COUNT(*)::int AS n, BOOL_OR(player_id = ${player || ''}) AS mine
      FROM reactions GROUP BY comment_id, emoji`;
    const out = r => ({ id: r.id, name: r.name, text: r.body, mine: !!player && r.player_id === player,
      reactions: EMOJIS.map(e => { const x = reacts.find(q => q.comment_id === r.id && q.emoji === e); return { emoji: e, n: x?.n || 0, mine: !!x?.mine }; }) });
    const top = rows.filter(r => !r.parent_id).slice(0, 60).map(r => ({ ...out(r),
      replies: rows.filter(q => q.parent_id === r.id).reverse().map(out) })); // replies oldest first
    return json({ comments: top });
  } catch (err) {
    console.error(err);
    return json({ error: 'Comments are unavailable right now.', detail: err.message }, 500);
  }
}

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  if (b.react) return react(cleanPlayer(b.player), b.react);
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
    // Replies go one level deep, to a visible public comment
    let parent = null;
    if (b.parent != null) {
      if (kind !== 'comment' || !Number.isInteger(b.parent)) return json({ error: 'Replies are for public comments.' }, 400);
      const [p] = await sql`SELECT id FROM comments WHERE id = ${b.parent} AND kind = 'comment' AND parent_id IS NULL AND NOT hidden`;
      if (!p) return json({ error: 'That comment is no longer available.' }, 404);
      parent = p.id;
    }
    const name = (b.anonymous ? '' : cleanName(b.name)) || 'Anonymous';
    await sql`INSERT INTO comments (player_id, name, kind, body, parent_id) VALUES (${player}, ${name}, ${kind}, ${text}, ${parent})`;
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
    const replies = await sql`DELETE FROM comments WHERE parent_id = ${b.id} RETURNING id`; // a deleted comment takes its replies with it
    const ids = [b.id, ...replies.map(r => r.id)];
    await sql`DELETE FROM reactions WHERE comment_id = ANY(${ids})`;
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'The comment could not be deleted. Please try again.', detail: err.message }, 500);
  }
}

// One reaction of each kind per person per comment; reacting again removes it
async function react(player, r) {
  if (!player || !Number.isInteger(r?.id) || !EMOJIS.includes(r.emoji)) return json({ error: 'Unknown reaction.' }, 400);
  try {
    const sql = await db();
    const [c] = await sql`SELECT id FROM comments WHERE id = ${r.id} AND kind = 'comment' AND NOT hidden`;
    if (!c) return json({ error: 'That comment is no longer available.' }, 404);
    const off = await sql`DELETE FROM reactions WHERE comment_id = ${r.id} AND player_id = ${player} AND emoji = ${r.emoji} RETURNING 1`;
    if (!off.length) await sql`INSERT INTO reactions (comment_id, player_id, emoji) VALUES (${r.id}, ${player}, ${r.emoji}) ON CONFLICT DO NOTHING`;
    return json({ ok: true, on: !off.length });
  } catch (err) {
    console.error(err);
    return json({ error: 'Your reaction could not be saved.', detail: err.message }, 500);
  }
}
