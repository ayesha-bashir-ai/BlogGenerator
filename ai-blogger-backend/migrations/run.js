require('dotenv').config();
const { neon, neonConfig } = require('@neondatabase/serverless');
const ws   = require('ws');
const fs   = require('fs');
const path = require('path');

neonConfig.webSocketConstructor = ws;

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('❌  DATABASE_URL is not set in .env');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  console.log('🔄  Running migrations...\n');

  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`  → ${file}`);
    const text = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const stmts = text.split(';').map(s => s.trim()).filter(s => s.length > 5 && !s.startsWith('--'));
    for (const stmt of stmts) {
      try { await sql(stmt); }
      catch (err) {
        if (err.message.includes('already exists')) continue;
        console.error(`  ❌  ${err.message}`);
        throw err;
      }
    }
    console.log(`  ✅  ${file} done`);
  }
  console.log('\n✅  All tables created in Neon!');
  console.log('   Check: neon.tech → Tables tab\n');
}

run().catch(err => { console.error('❌  Migration failed:', err.message); process.exit(1); });
