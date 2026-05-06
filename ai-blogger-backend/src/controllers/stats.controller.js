const db=require('../config/database');
const R=require('../utils/response.utils');

async function publicStats(req,res,next){
  try{
    const[u,b,g]=await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query(`SELECT COUNT(*) FROM blogs WHERE status='published'`),
      db.query('SELECT COUNT(*) FROM ai_generations'),
    ]);
    return R.success(res,{users:parseInt(u.rows[0].count),blogs_published:parseInt(b.rows[0].count),ai_generated:parseInt(g.rows[0].count),rating:4.9,countries:50});
  }catch(err){next(err);}
}

async function myStats(req,res,next){
  try{
    const uid=req.user.id;
    const[all,pub,ai,views]=await Promise.all([
      db.query('SELECT COUNT(*) FROM blogs WHERE user_id=$1',[uid]),
      db.query(`SELECT COUNT(*) FROM blogs WHERE user_id=$1 AND status='published'`,[uid]),
      db.query('SELECT COUNT(*) FROM ai_generations WHERE user_id=$1',[uid]),
      db.query('SELECT COALESCE(SUM(views),0) v FROM blogs WHERE user_id=$1',[uid]),
    ]);
    const top=(await db.query(`SELECT id,title,views,created_at FROM blogs WHERE user_id=$1 AND status='published' ORDER BY views DESC LIMIT 5`,[uid])).rows;
    const act=(await db.query(`SELECT DATE(created_at) date,COUNT(*) blogs FROM blogs WHERE user_id=$1 AND created_at>NOW()-INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY date`,[uid])).rows;
    return R.success(res,{
      overview:{total_blogs:parseInt(all.rows[0].count),published:parseInt(pub.rows[0].count),drafts:parseInt(all.rows[0].count)-parseInt(pub.rows[0].count),ai_generated:parseInt(ai.rows[0].count),total_views:parseInt(views.rows[0].v)},
      activity:act,top_blogs:top,plan:req.user.plan,blogs_generated_this_month:req.user.blogs_generated||0,
    });
  }catch(err){next(err);}
}

async function adminStats(req,res,next){
  try{
    const[u,b,g]=await Promise.all([
      db.query(`SELECT COUNT(*) t,COUNT(*) FILTER(WHERE plan='basic') basic,COUNT(*) FILTER(WHERE plan='pro') pro,COUNT(*) FILTER(WHERE plan='enterprise') ent,COUNT(*) FILTER(WHERE created_at>NOW()-INTERVAL '30 days') new30 FROM users`),
      db.query(`SELECT COUNT(*) t,COUNT(*) FILTER(WHERE status='published') pub,COUNT(*) FILTER(WHERE created_at>NOW()-INTERVAL '30 days') new30 FROM blogs`),
      db.query('SELECT COUNT(*) t FROM ai_generations'),
    ]);
    const ur=u.rows[0];
    return R.success(res,{totals:{users:parseInt(ur.t),blogs:parseInt(b.rows[0].t),published:parseInt(b.rows[0].pub),ai:parseInt(g.rows[0].t)},this_month:{new_users:parseInt(ur.new30),new_blogs:parseInt(b.rows[0].new30)},plans:{basic:parseInt(ur.basic),pro:parseInt(ur.pro),enterprise:parseInt(ur.ent)},mrr:parseInt(ur.pro)*19+parseInt(ur.ent)*49});
  }catch(err){next(err);}
}

module.exports={publicStats,myStats,adminStats};
