const { validationResult } = require('express-validator');
const R = require('../utils/response.utils');
function validate(req,res,next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return R.badRequest(res,'Validation failed',errors.array().map(e=>({field:e.path,message:e.msg})));
  next();
}
module.exports = { validate };
