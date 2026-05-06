const bcrypt = require('bcryptjs');
const { v4:uuid } = require('uuid');
const db  = require('../config/database');
const jwt = require('../utils/jwt.utils');
const R   = require('../utils/response.utils');
const safe = ({password,...u})=>u;

async function register(req,res,next){
  try{
    const{name,email,password}=req.body; const em=email.toLowerCase().trim();
    const ex=await db.query('SELECT id FROM users WHERE email=$1',[em]);
    if(ex.rows.length) return R.badRequest(res,'Email already registered.');
    const hash=await bcrypt.hash(password,12);
    const{rows}=await db.query(`INSERT INTO users(name,email,password,role,plan,blogs_limit,is_verified) VALUES($1,$2,$3,'user','basic',5,false) RETURNING *`,[name.trim(),em,hash]);
    const user=rows[0];
    const access=jwt.generateAccessToken({id:user.id,email:user.email,role:user.role});
    const refresh=jwt.generateRefreshToken({id:user.id});
    await db.query(`INSERT INTO refresh_tokens(token,user_id,expires_at) VALUES($1,$2,$3)`,[refresh,user.id,jwt.getRefreshExpiry()]);
    return R.created(res,{user:safe(user),accessToken:access,refreshToken:refresh},'Account created!');
  }catch(err){next(err);}
}

async function login(req,res,next){
  try{
    const{email,password}=req.body;
    const{rows}=await db.query('SELECT * FROM users WHERE email=$1',[email.toLowerCase()]);
    if(!rows.length) return R.unauthorized(res,'Invalid email or password.');
    const user=rows[0];
    if(!await bcrypt.compare(password,user.password)) return R.unauthorized(res,'Invalid email or password.');
    const access=jwt.generateAccessToken({id:user.id,email:user.email,role:user.role});
    const refresh=jwt.generateRefreshToken({id:user.id});
    await db.query(`INSERT INTO refresh_tokens(token,user_id,expires_at) VALUES($1,$2,$3)`,[refresh,user.id,jwt.getRefreshExpiry()]);
    return R.success(res,{user:safe(user),accessToken:access,refreshToken:refresh},'Login successful.');
  }catch(err){next(err);}
}

async function refreshToken(req,res,next){
  try{
    const{refreshToken:token}=req.body;
    const{rows}=await db.query(`SELECT * FROM refresh_tokens WHERE token=$1 AND expires_at>NOW()`,[token]);
    if(!rows.length) return R.unauthorized(res,'Invalid or expired refresh token.');
    let decoded; try{decoded=jwt.verifyRefreshToken(token);}catch{await db.query('DELETE FROM refresh_tokens WHERE token=$1',[token]);return R.unauthorized(res,'Invalid token.');}
    const user=(await db.query('SELECT * FROM users WHERE id=$1',[decoded.id])).rows[0];
    if(!user) return R.unauthorized(res,'User not found.');
    await db.query('DELETE FROM refresh_tokens WHERE token=$1',[token]);
    const access=jwt.generateAccessToken({id:user.id,email:user.email,role:user.role});
    const refresh=jwt.generateRefreshToken({id:user.id});
    await db.query(`INSERT INTO refresh_tokens(token,user_id,expires_at) VALUES($1,$2,$3)`,[refresh,user.id,jwt.getRefreshExpiry()]);
    return R.success(res,{accessToken:access,refreshToken:refresh},'Token refreshed.');
  }catch(err){next(err);}
}

async function logout(req,res,next){
  try{const{refreshToken:t}=req.body;if(t)await db.query('DELETE FROM refresh_tokens WHERE token=$1',[t]);return R.success(res,{},'Logged out.');}catch(err){next(err);}
}
async function logoutAll(req,res,next){
  try{await db.query('DELETE FROM refresh_tokens WHERE user_id=$1',[req.user.id]);return R.success(res,{},'Logged out from all devices.');}catch(err){next(err);}
}
async function me(req,res,next){try{return R.success(res,{user:safe(req.user)});}catch(err){next(err);}}

async function forgotPassword(req,res,next){
  try{
    const{rows}=await db.query('SELECT * FROM users WHERE email=$1',[req.body.email.toLowerCase()]);
    if(rows.length){
      const token=uuid().replace(/-/g,'')+uuid().replace(/-/g,'');
      const exp=new Date(Date.now()+60*60*1000);
      await db.query('DELETE FROM password_resets WHERE user_id=$1',[rows[0].id]);
      await db.query(`INSERT INTO password_resets(token,user_id,expires_at) VALUES($1,$2,$3)`,[token,rows[0].id,exp]);
      if(process.env.NODE_ENV==='development') return R.success(res,{resetToken:token},'Reset token (dev only).');
    }
    return R.success(res,{},'If that email exists, a reset link has been sent.');
  }catch(err){next(err);}
}

async function resetPassword(req,res,next){
  try{
    const{token,password}=req.body;
    const{rows}=await db.query(`SELECT * FROM password_resets WHERE token=$1 AND expires_at>NOW()`,[token]);
    if(!rows.length) return R.badRequest(res,'Invalid or expired reset token.');
    const hash=await bcrypt.hash(password,12);
    await db.query('UPDATE users SET password=$1 WHERE id=$2',[hash,rows[0].user_id]);
    await db.query('DELETE FROM password_resets WHERE token=$1',[token]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id=$1',[rows[0].user_id]);
    return R.success(res,{},'Password reset. Please log in again.');
  }catch(err){next(err);}
}

async function changePassword(req,res,next){
  try{
    const{currentPassword,newPassword}=req.body;
    const user=(await db.query('SELECT * FROM users WHERE id=$1',[req.user.id])).rows[0];
    if(!await bcrypt.compare(currentPassword,user.password)) return R.badRequest(res,'Current password incorrect.');
    const hash=await bcrypt.hash(newPassword,12);
    await db.query('UPDATE users SET password=$1 WHERE id=$2',[hash,req.user.id]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id=$1',[req.user.id]);
    return R.success(res,{},'Password changed. Please log in again.');
  }catch(err){next(err);}
}

module.exports={register,login,refreshToken,logout,logoutAll,me,forgotPassword,resetPassword,changePassword};
