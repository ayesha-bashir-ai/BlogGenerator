const PLAN_LIMITS = {
  basic:      { blogs_per_month:5,  max_words:1000, seo:false, ai_suggestions:false },
  pro:        { blogs_per_month:-1, max_words:5000, seo:true,  ai_suggestions:true  },
  enterprise: { blogs_per_month:-1, max_words:10000,seo:true,  ai_suggestions:true  },
};
function canGenerateBlog(user) {
  const l = PLAN_LIMITS[user.plan] || PLAN_LIMITS.basic;
  if (l.blogs_per_month === -1) return { allowed:true };
  if ((user.blogs_generated||0) >= l.blogs_per_month)
    return { allowed:false, message:`Monthly limit (${l.blogs_per_month} blogs) reached. Upgrade to Pro.` };
  return { allowed:true, remaining: l.blogs_per_month - (user.blogs_generated||0) };
}
module.exports = { PLAN_LIMITS, canGenerateBlog };
