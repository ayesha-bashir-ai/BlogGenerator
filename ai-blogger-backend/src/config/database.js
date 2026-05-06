require('dotenv').config();
const { neon, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing from .env');

const sql = neon(process.env.DATABASE_URL);

async function query(text, params) {
  try {
    const result = await sql(text, params || []);
    return { rows: Array.isArray(result) ? result : [] };
  } catch (err) {
    console.error('\n[DB ERROR]', err.message, '\n Query:', text.substring(0,100));
    throw err;
  }
}

async function testConnection() {
  try {
    const res = await query('SELECT NOW() AS now');
    console.log('✅  Neon connected —', new Date(res.rows[0].now).toUTCString());
    return true;
  } catch (err) {
    console.error('❌  Neon connection failed:', err.message);
    console.error('    → Check DATABASE_URL in your .env file');
    throw err;
  }
}

module.exports = { query, testConnection };
