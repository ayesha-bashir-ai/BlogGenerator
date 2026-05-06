require('dotenv').config();
const { neon, neonConfig } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

async function seed() {
  if (!process.env.DATABASE_URL) { console.error('❌  DATABASE_URL missing'); process.exit(1); }
  const sql = neon(process.env.DATABASE_URL);
  console.log('🌱  Seeding database...\n');
  try {
    const adminHash = await bcrypt.hash('Admin@1234', 12);
    await sql(`INSERT INTO users (name,email,password,role,plan,blogs_limit,is_verified) VALUES ($1,$2,$3,'admin','enterprise',-1,true) ON CONFLICT (email) DO NOTHING`,
      ['Admin User','admin@aiblogger.io',adminHash]);
    console.log('  ✅  admin@aiblogger.io  /  Admin@1234');

    const demoHash = await bcrypt.hash('Demo@1234', 12);
    const rows = await sql(`INSERT INTO users (name,email,password,plan,blogs_limit,is_verified) VALUES ($1,$2,$3,'pro',-1,true) ON CONFLICT (email) DO NOTHING RETURNING id`,
      ['Demo User','demo@aiblogger.io',demoHash]);
    console.log('  ✅  demo@aiblogger.io   /  Demo@1234');

    const uid = rows[0]?.id;
    if (uid) {
      const blogs = [
        {title:'How AI is Revolutionizing Content Marketing in 2026',cat:'Marketing'},
        {title:'Top 10 SEO Strategies That Actually Work This Year',  cat:'SEO'},
        {title:'The Complete Guide to AI Blogging in 2026',           cat:'Technology'},
      ];
      for (const b of blogs) {
        const slug = b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now();
        await sql(`INSERT INTO blogs (user_id,title,slug,content,excerpt,category,status,is_ai_generated,seo_score,word_count,read_time,published_at) VALUES ($1,$2,$3,$4,$5,$6,'published',true,85,600,3,NOW()) ON CONFLICT DO NOTHING`,
          [uid,b.title,slug,`## Introduction\n\nThis blog covers ${b.title}.\n\n## Conclusion\nGreat content!`,`A guide about ${b.title}.`,b.cat]);
      }
      console.log('  ✅  3 sample blogs added');
    }
    console.log('\n✅  Seeding complete!\n');
  } catch (err) { console.error('❌  Seed error:', err.message); process.exit(1); }
}
seed();
