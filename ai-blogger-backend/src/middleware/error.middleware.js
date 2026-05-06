function notFound(req,res) {
  res.status(404).json({ success:false, message:`Route not found: ${req.method} ${req.originalUrl}` });
}
function errorHandler(err,req,res,next) {
  const code = err.status||err.statusCode||500;
  console.error(`[ERROR] ${code} — ${err.message}`);
  res.status(code).json({ success:false, message:err.message||'Internal server error',
    ...(process.env.NODE_ENV==='development'&&{stack:err.stack}) });
}
module.exports = { notFound, errorHandler };
