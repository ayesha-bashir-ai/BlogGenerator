const db=require('../config/database');
const R=require('../utils/response.utils');
const slug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now().toString(36);

async function getBlogs(req,res,next){
  try{
    const{search='',page=1,limit=10,category=''}=req.query;const off=(page-1)*limit;
    const p=['published'];let w='b.status=$1';let i=2;
    if(search){w+=` AND (b.title ILIKE $${i} OR b.excerpt ILIKE $${i})`;p.push('%'+search+'%');i++;}
    if(category){w+=` AND b.category=$${i}`;p.push(category);i++;}
    const total=parseInt((await db.query(`SELECT COUNT(*) FROM blogs b WHERE ${w}`,p)).rows[0].count);
    p.push(limit,off);
    const{rows}=await db.query(`SELECT b.*,u.name author_name FROM blogs b JOIN users u ON b.user_id=u.id WHERE ${w} ORDER BY b.published_at DESC LIMIT $${i} OFFSET $${i+1}`,p);
    return R.paginate(res,rows,total,page,limit);
  }catch(err){next(err);}
}

async function getMyBlogs(req,res,next){
  try{
    const{status='',page=1,limit=10}=req.query;const off=(page-1)*limit;
    const p=[req.user.id];let w='user_id=$1';let i=2;
    if(status){w+=` AND status=$${i}`;p.push(status);i++;}
    const total=parseInt((await db.query(`SELECT COUNT(*) FROM blogs WHERE ${w}`,p)).rows[0].count);
    p.push(limit,off);
    const{rows}=await db.query(`SELECT * FROM blogs WHERE ${w} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`,p);
    return R.paginate(res,rows,total,page,limit);
  }catch(err){next(err);}
}

async function getBlog(req,res,next){
  try{
    const{rows}=await db.query(`SELECT b.*,u.name author_name FROM blogs b JOIN users u ON b.user_id=u.id WHERE b.id=$1`,[req.params.id]);
    if(!rows.length) return R.notFound(res,'Blog not found.');
    const b=rows[0];
    if(b.status!=='published'&&(!req.user||(req.user.id!==b.user_id&&req.user.role!=='admin'))) return R.notFound(res,'Blog not found.');
    await db.query('UPDATE blogs SET views=views+1 WHERE id=$1',[b.id]);
    return R.success(res,{blog:b});
  }catch(err){next(err);}
}

async function createBlog(req,res,next){
  try{
    const{title,content,excerpt,tags=[],category='General',status='draft',seo_title,seo_description,featured_image}=req.body;
    const words=content.split(/\s+/).length;
    const{rows}=await db.query(`INSERT INTO blogs(user_id,title,slug,content,excerpt,tags,category,status,seo_title,seo_description,featured_image,word_count,read_time,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.id,title.trim(),slug(title),content,excerpt||content.substring(0,160)+'...',tags,category,status,seo_title||title,seo_description||'',featured_image||null,words,Math.max(1,Math.ceil(words/200)),status==='published'?new Date():null]);
    return R.created(res,{blog:rows[0]},'Blog created.');
  }catch(err){next(err);}
}

async function updateBlog(req,res,next){
  try{
    const{rows}=await db.query('SELECT * FROM blogs WHERE id=$1',[req.params.id]);
    if(!rows.length) return R.notFound(res,'Blog not found.');
    const b=rows[0];
    if(b.user_id!==req.user.id&&req.user.role!=='admin') return R.forbidden(res);
    const{title=b.title,content=b.content,excerpt,tags,category,status,seo_title,seo_description,featured_image}=req.body;
    const words=content.split(/\s+/).length;
    const{rows:u}=await db.query(`UPDATE blogs SET title=$1,slug=$2,content=$3,excerpt=$4,tags=$5,category=$6,status=$7,seo_title=$8,seo_description=$9,featured_image=$10,word_count=$11,read_time=$12,published_at=CASE WHEN $7='published' AND published_at IS NULL THEN NOW() ELSE published_at END WHERE id=$13 RETURNING *`,
      [title,slug(title),content,excerpt||b.excerpt,tags||b.tags,category||b.category,status||b.status,seo_title||b.seo_title,seo_description||b.seo_description,featured_image||b.featured_image,words,Math.max(1,Math.ceil(words/200)),b.id]);
    return R.success(res,{blog:u[0]},'Blog updated.');
  }catch(err){next(err);}
}

async function publishBlog(req,res,next){
  try{
    const{rows}=await db.query('SELECT * FROM blogs WHERE id=$1',[req.params.id]);
    if(!rows.length) return R.notFound(res,'Blog not found.');
    if(rows[0].user_id!==req.user.id&&req.user.role!=='admin') return R.forbidden(res);
    const ns=rows[0].status==='published'?'draft':'published';
    const{rows:u}=await db.query(`UPDATE blogs SET status=$1,published_at=CASE WHEN $1='published' AND published_at IS NULL THEN NOW() ELSE published_at END WHERE id=$2 RETURNING *`,[ns,rows[0].id]);
    return R.success(res,{blog:u[0]},`Blog ${ns}.`);
  }catch(err){next(err);}
}

async function deleteBlog(req,res,next){
  try{
    const{rows}=await db.query('SELECT * FROM blogs WHERE id=$1',[req.params.id]);
    if(!rows.length) return R.notFound(res,'Blog not found.');
    if(rows[0].user_id!==req.user.id&&req.user.role!=='admin') return R.forbidden(res);
    await db.query('DELETE FROM blogs WHERE id=$1',[rows[0].id]);
    return R.success(res,{},'Blog deleted.');
  }catch(err){next(err);}
}

async function adminGetBlogs(req,res,next){
  try{
    const{page=1,limit=20,status='',search=''}=req.query;const off=(page-1)*limit;
    const p=[];let w='1=1';let i=1;
    if(status){w+=` AND b.status=$${i++}`;p.push(status);}
    if(search){w+=` AND b.title ILIKE $${i++}`;p.push('%'+search+'%');}
    const total=parseInt((await db.query(`SELECT COUNT(*) FROM blogs b WHERE ${w}`,p)).rows[0].count);
    p.push(limit,off);
    const{rows}=await db.query(`SELECT b.*,u.name author_name FROM blogs b JOIN users u ON b.user_id=u.id WHERE ${w} ORDER BY b.created_at DESC LIMIT $${i} OFFSET $${i+1}`,p);
    return R.paginate(res,rows,total,page,limit);
  }catch(err){next(err);}
}

module.exports={getBlogs,getMyBlogs,getBlog,createBlog,updateBlog,publishBlog,deleteBlog,adminGetBlogs};
