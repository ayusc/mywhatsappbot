import { pool } from './db.js';

const tableInitQuery = `
CREATE TABLE IF NOT EXISTS whatsapp_session (
  id SERIAL PRIMARY KEY,
  session JSONB
);
`;

await pool.query(tableInitQuery);

export async function getSession() {
  const res = await pool.query('SELECT session FROM whatsapp_session LIMIT 1');
  return res.rows[0]?.session || null;
}

export async function saveSession(session) {
  const exists = await getSession();
  if (exists) {
    await pool.query('UPDATE whatsapp_session SET session = $1 WHERE id = 1', [session]);
  } else {
    await pool.query('INSERT INTO whatsapp_session (id, session) VALUES (1, $1)', [session]);
  }
}
