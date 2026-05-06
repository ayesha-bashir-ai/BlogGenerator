const jwt = require('jsonwebtoken');
const S  = process.env.JWT_SECRET         || 'dev_secret_change_me_min32chars!!!!!';
const RS = process.env.JWT_REFRESH_SECRET || 'dev_refresh_change_me_min32chars!!!!';
module.exports = {
  generateAccessToken:  p => jwt.sign(p, S,  { expiresIn: process.env.JWT_EXPIRES_IN         || '15m' }),
  generateRefreshToken: p => jwt.sign(p, RS, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'  }),
  verifyAccessToken:    t => jwt.verify(t, S),
  verifyRefreshToken:   t => jwt.verify(t, RS),
  getRefreshExpiry: ()  => new Date(Date.now() + 7*24*60*60*1000).toISOString(),
};
