const db=require('../config/database');
const R=require('../utils/response.utils');
const{PLAN_LIMITS}=require('../utils/plans.utils');
const safe=({password,...u})=>u;

async function getProfile(req,res,next){
  try{
    const uid=req.user.id;
    const[t,p,a]=await Promise.all([
      db.query('SELECT COUNT(*) FROM blogs WHERE user_id=$1',[uid]),
      db.query(`SELECT COUNT(*) FROM blogs WHERE user_id=$1 AND status='published'`,[uid]),
      db.query('SELECT COUNT(*) FROM ai_generations WHERE user_id=$1',[uid]),
    ]);
    return R.success(res,{user:safe(req.user),stats:{total_blogs:parseInt(t.rows[0].count),published:parseInt(p.rows[0].count),ai_generated:parseInt(a.rows[0].count)},plan_limits:PLAN_LIMITS[req.user.plan]||PLAN_LIMITS.basic});
  }catch(err){next(err);}
}

async function updateProfile(req,res,next){
  try{
    const{name,avatar,bio}=req.body;const sets=[];const vals=[];let i=1;
    if(name){sets.push(`name=$${i++}`);vals.push(name.trim());}
    if(avatar!==undefined){sets.push(`avatar=$${i++}`);vals.push(avatar);}
    if(bio!==undefined){sets.push(`bio=$${i++}`);vals.push(bio);}
    if(!sets.length) return R.success(res,{user:safe(req.user)});
    vals.push(req.user.id);
    const{rows}=await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=$${i} RETURNING *`,vals);
    return R.success(res,{user:safe(rows[0])},'Profile updated.');
  }catch(err){next(err);}
}

async function upgradePlan(req,res,next){
  try{
    const{plan}=req.body;const l=PLAN_LIMITS[plan];
    if(!l) return R.badRequest(res,'Invalid plan.');
    const{rows}=await db.query(`UPDATE users SET plan=$1,blogs_limit=$2,blogs_generated=0 WHERE id=$3 RETURNING *`,[plan,l.blogs_per_month,req.user.id]);
    return R.success(res,{user:safe(rows[0]),plan_limits:l},`Upgraded to ${plan}!`);
  }catch(err){next(err);}
}

async function adminGetUsers(req,res,next){
  try{
    const{page=1,limit=20,search=''}=req.query;const off=(page-1)*limit;
    let w='1=1';const p=[];
    if(search){w=`name ILIKE $1 OR email ILIKE $1`;p.push('%'+search+'%');}
    const total=parseInt((await db.query(`SELECT COUNT(*) FROM users WHERE ${w}`,p)).rows[0].count);
    p.push(limit,off);
    const{rows}=await db.query(`SELECT id,name,email,role,plan,blogs_generated,is_verified,created_at FROM users WHERE ${w} ORDER BY created_at DESC LIMIT $${p.length-1} OFFSET $${p.length}`,p);
    return R.success(res,{users:rows,pagination:{total,page:parseInt(page),limit:parseInt(limit),pages:Math.ceil(total/limit)}});
  }catch(err){next(err);}
}

async function adminUpdateUser(req,res,next){
  try{
    const{name,role,plan,is_verified}=req.body;const sets=[];const vals=[];let i=1;
    if(name){sets.push(`name=$${i++}`);vals.push(name);}
    if(role&&['user','admin'].includes(role)){sets.push(`role=$${i++}`);vals.push(role);}
    if(plan&&PLAN_LIMITS[plan]){sets.push(`plan=$${i++}`);vals.push(plan);sets.push(`blogs_limit=$${i++}`);vals.push(PLAN_LIMITS[plan].blogs_per_month);}
    if(is_verified!==undefined){sets.push(`is_verified=$${i++}`);vals.push(is_verified);}
    if(!sets.length) return R.badRequest(res,'Nothing to update.');
    vals.push(req.params.id);
    const{rows}=await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=$${i} RETURNING *`,vals);
    if(!rows.length) return R.notFound(res,'User not found.');
    return R.success(res,{user:safe(rows[0])},'User updated.');
  }catch(err){next(err);}
}

async function adminDeleteUser(req,res,next){
  try{
    if(req.params.id===req.user.id) return R.forbidden(res,'Cannot delete yourself.');
    await db.query('DELETE FROM users WHERE id=$1',[req.params.id]);
    return R.success(res,{},'User deleted.');
  }catch(err){next(err);}
}

module.exports={getProfile,updateProfile,upgradePlan,adminGetUsers,adminUpdateUser,adminDeleteUser};
