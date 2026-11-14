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
    await sql`CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY, player_id TEXT, name TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL,
      hidden BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())`;
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

// Best score per player for every game, highest first (ties go to whoever got there first):
// the top `limit` players, plus `player`'s own rank and best score even if they're further down.
export async function gameBoards(sql, player, limit = 10) {
  const best = await sql`
    SELECT DISTINCT ON (game, player_id) game, player_id, score, created_at
    FROM events WHERE type = 'finish' AND score IS NOT NULL AND player_id IS NOT NULL
    ORDER BY game, player_id, score DESC, created_at ASC`;
  // Each player's most recent name, from either table
  const names = new Map((await sql`
    SELECT DISTINCT ON (player_id) player_id, name FROM (
      SELECT player_id, name, created_at FROM submissions WHERE player_id IS NOT NULL
      UNION ALL SELECT player_id, name, created_at FROM events WHERE player_id IS NOT NULL AND name IS NOT NULL
    ) t ORDER BY player_id, created_at DESC`).map(r => [r.player_id, r.name]));
  const byGame = {};
  for (const r of best) (byGame[r.game] ||= []).push(r);
  const boards = {};
  for (const g in byGame) {
    const ranked = byGame[g]
      .sort((a, b) => b.score - a.score || new Date(a.created_at) - new Date(b.created_at))
      .map((r, i) => ({ rank: i + 1, name: names.get(r.player_id) || 'Anonymous', score: r.score, me: !!player && r.player_id === player }));
    boards[g] = { top: ranked.slice(0, limit), me: ranked.find(r => r.me) || null, players: ranked.length };
  }
  return boards;
}
