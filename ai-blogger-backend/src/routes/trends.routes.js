// ── File: src/routes/trends.routes.js ───────────────────
// Add this to your ai-blogger-backend project
// Then in app.js add: app.use('/api/v1/trends', trendsRoutes);

const express = require('express');
const https   = require('https');
const router  = express.Router();

const SERPAPI_KEY = process.env.SERPAPI_KEY; // put in your .env file

// GET /api/v1/trends?keyword=artificial+intelligence
router.get('/', async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ success: false, message: 'keyword is required' });
  }

  // No API key → return smart mock data so frontend still works
  if (!SERPAPI_KEY) {
    return res.json({ success: true, source: 'mock', data: mockTrends(keyword) });
  }

  try {
    const trends = await fetchFromSerpAPI(keyword);
    res.json({ success: true, source: 'serpapi', data: trends });
  } catch (err) {
    console.error('[Trends] SerpAPI error:', err.message);
    // Graceful fallback — never crash the page
    res.json({ success: true, source: 'fallback', data: mockTrends(keyword) });
  }
});

// ── SerpAPI call ─────────────────────────────────────────
function fetchFromSerpAPI(keyword) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      engine:   'google_trends',
      q:        keyword,
      data_type:'RELATED_QUERIES',  // related rising + top queries
      api_key:  SERPAPI_KEY,
    });

    const url = `https://serpapi.com/search.json?${params}`;

    https.get(url, (response) => {
      let raw = '';
      response.on('data', chunk => raw += chunk);
      response.on('end', () => {
        try {
          const json = JSON.parse(raw);

          if (json.error) return reject(new Error(json.error));

          // SerpAPI returns related_queries.rising and related_queries.top
          const rising = (json.related_queries?.rising || []).slice(0, 6);
          const top    = (json.related_queries?.top    || []).slice(0, 4);

          const combined = [
            ...rising.map((r, i) => ({
              keyword: r.query,
              volume:  r.extracted_value ? `${formatNum(r.extracted_value)}+` : 'Rising',
              score:   95 - i * 4,
              type:    'rising',
            })),
            ...top.map((t, i) => ({
              keyword: t.query,
              volume:  t.extracted_value ? `${formatNum(t.extracted_value)}+` : 'Trending',
              score:   78 - i * 3,
              type:    'top',
            })),
          ];

          resolve(combined.slice(0, 10));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ── Mock fallback (no API key needed) ────────────────────
function mockTrends(keyword) {
  const kw = keyword.toLowerCase();

  const pools = {
    ai: ['AI writing tools 2026','ChatGPT vs Claude','AI SEO automation',
         'machine learning beginners','generative AI marketing',
         'AI blog generator free','LLM comparison guide',
         'AI plagiarism checker','NLP tools 2026','AI content strategy'],

    marketing: ['digital marketing trends 2026','content marketing ROI',
                'social media algorithm 2026','email marketing automation',
                'SEO keyword research','influencer marketing tips',
                'video marketing statistics','Google Ads strategies',
                'conversion rate optimization','brand awareness 2026'],

    health: ['mental health apps 2026','intermittent fasting guide',
             'gut microbiome research','sleep optimization tips',
             'mindfulness for stress','anti-inflammatory foods',
             'longevity supplements','fitness tracking apps',
             'holistic wellness routine','mental wellness workplace'],

    tech: ['web dev trends 2026','Python AI libraries',
           'cloud computing cost','cybersecurity tips',
           'blockchain explained','React vs Next.js',
           'DevOps automation','REST vs GraphQL',
           'open source tools','tech layoffs 2026'],

    finance: ['passive income online','crypto market 2026',
              'index fund investing','budgeting apps 2026',
              'real estate investing','stock market beginner',
              'financial freedom plan','side hustle ideas',
              'inflation protection','retirement planning 2026'],
  };

  let list = pools.ai; // default
  if (/market|seo|brand|content|social/i.test(kw)) list = pools.marketing;
  else if (/health|wellness|mental|fitness|diet/i.test(kw)) list = pools.health;
  else if (/tech|code|program|develop|software|web/i.test(kw)) list = pools.tech;
  else if (/financ|invest|money|crypto|stock/i.test(kw)) list = pools.finance;
  else if (/ai|artificial|machine|gpt|neural/i.test(kw)) list = pools.ai;

  return list.map((word, i) => ({
    keyword: word,
    volume:  `${Math.floor(Math.random() * 80 + 20)}K+`,
    score:   95 - i * 3,
    type:    i < 5 ? 'rising' : 'top',
  }));
}

function formatNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n/1000).toFixed(0) + 'K';
  return String(n);
}

module.exports = router;
