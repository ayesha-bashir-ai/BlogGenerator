const db=require('../config/database');
const R=require('../utils/response.utils');
const ai=require('../services/ai.service');
const{canGenerateBlog}=require('../utils/plans.utils');
const slug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now().toString(36);

async function generateBlog(req,res,next){
  try{
    const{topic,length='medium',tone='professional',category='General',keywords=[],structure='standard',humanize=true}=req.body;
    const check=canGenerateBlog(req.user);
    if(!check.allowed) return R.forbidden(res,check.message);
    const result=await ai.generateBlog({topic,length,tone,category,keywords,structure,humanize});
    const words=result.content.split(/\s+/).length;
    const{rows}=await db.query(`INSERT INTO blogs(user_id,title,slug,content,excerpt,tags,category,status,seo_title,seo_description,seo_score,word_count,read_time,is_ai_generated,ai_topic,ai_tone,ai_structure,humanized) VALUES($1,$2,$3,$4,$5,$6,$7,'draft',$8,$9,$10,$11,$12,true,$13,$14,$15,$16) RETURNING *`,
      [req.user.id,result.title,slug(result.title),result.content,result.excerpt,result.tags||[],category,result.seo_title||result.title,result.seo_description||'',result.seo_score||80,words,Math.max(1,Math.ceil(words/200)),topic,tone,structure,!!humanize]);
    await db.query(`UPDATE users SET blogs_generated=blogs_generated+1 WHERE id=$1`,[req.user.id]);
    await db.query(`INSERT INTO ai_generations(user_id,blog_id,topic,length,tone,structure,word_count,seo_score,keywords) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.user.id,rows[0].id,topic,length,tone,structure,words,result.seo_score||80,keywords]);
    let images=[];try{images=await ai.fetchImages(topic);}catch{}
    return R.success(res,{blog:rows[0],images},'Blog generated!');
  }catch(err){next(err);}
}

async function suggestTopics(req,res,next){
  try{const{niche='technology',count=5}=req.query;const suggestions=await ai.suggestTopics(niche,Math.min(parseInt(count),10));return R.success(res,{suggestions});}catch(err){next(err);}
}

async function getTrending(req,res,next){
  try{
    const{geo='US',keyword=''}=req.query;
    const cached=await db.query(`SELECT keywords FROM trending_cache WHERE geo=$1 AND fetched_at>NOW()-INTERVAL '15 minutes' ORDER BY fetched_at DESC LIMIT 1`,[geo]);
    if(cached.rows.length) return R.success(res,{trends:cached.rows[0].keywords,source:'cache'});
    const trends=await ai.fetchTrending(geo,keyword);
    await db.query(`INSERT INTO trending_cache(geo,keywords) VALUES($1,$2)`,[geo,JSON.stringify(trends)]);
    return R.success(res,{trends,source:'live'});
  }catch(err){next(err);}
}

async function improveBlog(req,res,next){
  try{const{content,improvement='seo'}=req.body;const result=await ai.improveBlog(content,improvement);return R.success(res,result);}catch(err){next(err);}
}

async function generateSEO(req,res,next){
  try{const{title,content}=req.body;const seo=await ai.generateSEOMeta(title,content);return R.success(res,{seo});}catch(err){next(err);}
}

async function chat(req,res,next){
  try{const{message,history=[]}=req.body;const reply=await ai.chat(message,history);return R.success(res,{reply});}catch(err){next(err);}
}

module.exports={generateBlog,suggestTopics,getTrending,improveBlog,generateSEO,chat};
