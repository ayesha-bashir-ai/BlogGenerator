const ok = (res, data={}, msg='Success', code=200) => res.status(code).json({ success:true, message:msg, data });
module.exports = {
  success:      ok,
  created:      (res,data,msg) => ok(res,data,msg||'Created',201),
  badRequest:   (res,msg,errs=null) => res.status(400).json({ success:false, message:msg, ...(errs&&{errors:errs}) }),
  unauthorized: (res,msg='Unauthorized') => res.status(401).json({ success:false, message:msg }),
  forbidden:    (res,msg='Forbidden')    => res.status(403).json({ success:false, message:msg }),
  notFound:     (res,msg='Not found')    => res.status(404).json({ success:false, message:msg }),
  paginate: (res,items,total,page,limit,msg='Success') => res.json({
    success:true, message:msg,
    data:{ items, pagination:{ total, page:parseInt(page), limit:parseInt(limit), pages:Math.ceil(total/limit) } }
  }),
};
