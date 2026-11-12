// POST /api/submit  { name, codes }  -> saves valid code words for that person
import { codes, db, json, nameKey } from './_lib.js';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (!name) return json({ error: 'Please enter your name or initials.' }, 400);

  const valid = new Set(Object.values(codes()));
  const submitted = [...new Set(String(body.codes || '').toUpperCase().split(/[^A-Z]+/).filter(Boolean))].slice(0, 30);
  if (!submitted.length) return json({ error: 'Please enter at least one code word.' }, 400);
  const accepted = submitted.filter(c => valid.has(c));
  const rejected = submitted.filter(c => !valid.has(c));

  try {
    const sql = await db();
    const key = nameKey(name);
    if (accepted.length) await sql`INSERT INTO submissions (name, name_key, codes) VALUES (${name}, ${key}, ${accepted.join(' ')})`;
    const rows = await sql`SELECT codes FROM submissions WHERE name_key = ${key}`;
    const total = new Set(rows.flatMap(r => r.codes.split(' ')).filter(Boolean)).size;
    return json({ accepted, rejected, total, of: valid.size });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not save right now. Please try again in a minute.' }, 500);
  }
}
