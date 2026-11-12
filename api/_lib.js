// Shared helpers for the API functions. (Files starting with _ are not deployed as their own endpoint.)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The real code words are read straight from the standalone arcade file, so there's only one list to keep up to date.
let codesCache;
export function codes() {
  if (!codesCache) {
    const html = readFileSync(join(process.cwd(), 'standalone', 'aaw-arcade.html'), 'utf8');
    const block = html.match(/var CODES=\{([^}]*)\}/);
    if (!block) throw new Error('Could not find CODES in standalone/aaw-arcade.html');
    codesCache = Object.fromEntries([...block[1].matchAll(/(\w+):'([A-Z]+)'/g)].map(m => [m[1], m[2]]));
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
    await sql`CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY, session TEXT, type TEXT NOT NULL, game TEXT NOT NULL, unlocked BOOLEAN, created_at TIMESTAMPTZ DEFAULT now())`;
  })().catch(err => { ready = null; throw err; });
  return ready.then(() => sql);
}

export const json = (data, status = 200) => Response.json(data, { status });

// "  Jane   Smith " and "jane smith" count as the same person
export const nameKey = name => name.trim().replace(/\s+/g, ' ').toLowerCase();
