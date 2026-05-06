const jwt = require('../utils/jwt.utils');
const db  = require('../config/database');
const R   = require('../utils/response.utils');

async function authenticate(req,res,next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return R.unauthorized(res,'No token provided.');
  try {
    const decoded = jwt.verifyAccessToken(h.split(' ')[1]);
    const { rows } = await db.query('SELECT * FROM users WHERE id=$1',[decoded.id]);
    if (!rows.length) return R.unauthorized(res,'User not found.');
    req.user = rows[0]; next();
  } catch (err) {
    if (err.name==='TokenExpiredError') return R.unauthorized(res,'Token expired. Please refresh.');
    return R.unauthorized(res,'Invalid token.');
  }
}

function authorize(...roles) {
  return (req,res,next) => {
    if (!req.user) return R.unauthorized(res);
    if (!roles.includes(req.user.role)) return R.forbidden(res,'Insufficient permissions.');
    next();
  };
}

async function optionalAuth(req,res,next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verifyAccessToken(h.split(' ')[1]);
    const { rows } = await db.query('SELECT * FROM users WHERE id=$1',[decoded.id]);
    if (rows.length) req.user = rows[0];
  } catch {}
  next();
}

module.exports = { authenticate, authorize, optionalAuth };
