// Shared helpers for the API functions. (Files starting with _ are not deployed as their own endpoint.)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The real code words are read straight from the standalone arcade file, so there's only one list to keep up to date.
let codesCache;
export function codes() {
  if (!codesCache) {
    // Look next to this file first (works no matter which folder the server runs from), then the project root
    const paths = [fileURLToPath(new URL('../standalone/aaw-arcade.html', import.meta.url)), join(process.cwd(), 'standalone', 'aaw-arcade.html')];
    let html;
    for (const p of paths) { try { html = readFileSync(p, 'utf8'); break; } catch { /* try the next path */ } }
    if (!html) throw new Error('Could not find standalone/aaw-arcade.html on the server');
    const block = html.match(/var CODES\s*=\s*\{([^}]*)\}/);
    if (!block) throw new Error('Could not find CODES in standalone/aaw-arcade.html');
    codesCache = Object.fromEntries([...block[1].matchAll(/(\w+)\s*:\s*['"]([A-Z]+)['"]/g)].map(m => [m[1], m[2]]));
  }
  return codesCache;
}

// Database connection. Tables are created automatically the first time.
let ready;
export function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('No database connected. Add Neon in Vercel → Storage.');
  const sql = neon(url);
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL, codes TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
    await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS player_id TEXT`;
    await sql`CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY, session TEXT, type TEXT NOT NULL, game TEXT NOT NULL, unlocked BOOLEAN, created_at TIMESTAMPTZ DEFAULT now())`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS player_id TEXT`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS name TEXT`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS score INTEGER`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS ms INTEGER`; // how long the play took; breaks tied scores
    await sql`CREATE INDEX IF NOT EXISTS events_board2 ON events (game, player_id, score DESC) WHERE type IN ('finish', 'partial')`;
    await sql`CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY, player_id TEXT, name TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL,
      hidden BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())`;
    await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER`; // set on replies
    await sql`CREATE TABLE IF NOT EXISTS reactions (
      comment_id INTEGER NOT NULL, player_id TEXT NOT NULL, emoji TEXT NOT NULL, PRIMARY KEY (comment_id, player_id, emoji))`;
  })().catch(err => { ready = null; throw err; });
  return ready.then(() => sql);
}

export const json = (data, status = 200) => Response.json(data, { status });

// "  Jane   Smith " and "jane smith" count as the same person
export const nameKey = name => name.trim().replace(/\s+/g, ' ').toLowerCase();

export const cleanName = v => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 30);
export const cleanPlayer = v => (/^[a-z0-9-]{8,40}$/i.test(String(v || '')) ? String(v) : null);

// Everyone who has submitted, with their combined code words.
// Players are grouped by their browser's player ID (so renaming keeps their codes);
// older or manual entries without one are grouped by name.
export async function players(sql) {
  const rows = await sql`SELECT player_id, name, name_key, codes, created_at FROM submissions ORDER BY created_at`;
  const map = new Map();
  for (const r of rows) {
    const key = r.player_id || 'n:' + r.name_key;
    const p = map.get(key) || { key, codes: new Set() };
    r.codes.split(' ').filter(Boolean).forEach(c => p.codes.add(c));
    p.name = r.name;          // latest name wins
    if (r.codes) p.last = r.created_at; // when they last added a code (ties go to whoever got there first)
    p.last ??= r.created_at;
    map.set(key, p);
  }
  return [...map.values()]
    .map(p => ({ key: p.key, name: p.name, codes: [...p.codes].sort(), last: p.last }))
    .sort((a, b) => b.codes.length - a.codes.length || new Date(a.last) - new Date(b.last));
}

// Best score per player for every game, finished or not, highest first. Equal scores share a rank and the next rank
// skips ahead (25, 25, 23 -> 1, 1, 3), so everyone tied at #1 gets gold, and so on down to #3.
// Returns the top `limit` players (plus every medalist), and `player`'s own rank and best score even if they're further down.
// Also returns the medal standings: 5 points for each #1, 3 for each #2 and 1 for each #3 across all games.
export async function gameBoards(sql, player, limit = 10) {
  const best = await sql`
    SELECT DISTINCT ON (game, player_id) game, player_id, score, ms, created_at
    FROM events WHERE type IN ('finish', 'partial') AND score IS NOT NULL AND player_id IS NOT NULL
    ORDER BY game, player_id, score DESC, created_at ASC`;
  // Each player's most recent name, from either table
  const names = new Map((await sql`
    SELECT DISTINCT ON (player_id) player_id, name FROM (
      SELECT player_id, name, created_at FROM submissions WHERE player_id IS NOT NULL
      UNION ALL SELECT player_id, name, created_at FROM events WHERE player_id IS NOT NULL AND name IS NOT NULL
    ) t ORDER BY player_id, created_at DESC`).map(r => [r.player_id, r.name]));
  const byGame = {};
  for (const r of best) (byGame[r.game] ||= []).push(r);
  const boards = {}, medals = new Map();
  for (const g in byGame) {
    const sorted = byGame[g].sort((a, b) => b.score - a.score || new Date(a.created_at) - new Date(b.created_at));
    const rankOf = r => sorted.findIndex(x => x.score === r.score) + 1; // ties share a rank: 1, 1, 3
    const ranked = sorted.map(r => ({ id: r.player_id, rank: rankOf(r), name: names.get(r.player_id) || 'Anonymous', score: r.score, me: !!player && r.player_id === player }));
    for (const r of ranked) if (r.rank <= 3) {
      const m = medals.get(r.id) || { id: r.id, gold: 0, silver: 0, bronze: 0 };
      m[['gold', 'silver', 'bronze'][r.rank - 1]]++;
      medals.set(r.id, m);
    }
    const out = ranked.map(({ id, ...r }) => r);
    boards[g] = { top: out.filter((r, i) => i < limit || r.rank <= 3), me: out.find(r => r.me) || null, players: out.length };
  }
  const table = [...medals.values()]
    .map(m => ({ ...m, points: 5 * m.gold + 3 * m.silver + m.bronze }))
    .sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver)
    .map((m, i, all) => ({ rank: all.findIndex(x => x.points === m.points && x.gold === m.gold && x.silver === m.silver) + 1, // full ties share a rank
      name: names.get(m.id) || 'Anonymous', gold: m.gold, silver: m.silver, bronze: m.bronze, points: m.points, me: !!player && m.id === player }));
  return { boards, medals: { top: table.slice(0, limit), me: table.find(r => r.me) || null } };
}
