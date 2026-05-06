const express      = require('express');
const googleTrends = require('google-trends-api');
const https        = require('https');
const router       = express.Router();

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// GET /api/v1/trends?keyword=artificial+intelligence
router.get('/', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ success: false, message: 'keyword is required' });
  }

  // 1st choice: real Google Trends
  try {
    const trends = await fetchGoogleTrends(keyword);
    return res.json({ success: true, source: 'google_trends', data: trends });
  } catch (gtErr) {
    console.log('[Trends] Google Trends unavailable, trying Claude AI...');
  }

  // 2nd choice: Claude AI keyword generation (works for any topic)
  if (ANTHROPIC_KEY) {
    try {
      const trends = await fetchAITrends(keyword);
      return res.json({ success: true, source: 'ai', data: trends });
    } catch (aiErr) {
      console.error('[Trends] Claude AI error:', aiErr.message);
    }
  }

  // 3rd choice: static category pools (offline fallback)
  return res.json({ success: true, source: 'fallback', data: buildStaticFallback(keyword) });
});

// ── Google Trends ─────────────────────────────────────────
async function fetchGoogleTrends(keyword) {
  const rawRelated = await googleTrends.relatedQueries({ keyword });
  const parsed     = JSON.parse(rawRelated);
  const rankedList = parsed?.default?.rankedList || [];
  const rising     = (rankedList[0]?.rankedKeyword || []).slice(0, 6);
  const top        = (rankedList[1]?.rankedKeyword || []).slice(0, 5);

  const results = [
    ...rising.map((r, i) => ({
      keyword: r.query,
      volume:  r.value === 'Breakout' ? 'Breakout 🔥' : `${r.value}%`,
      score:   Math.min(95, 60 + Math.round((r.value === 'Breakout' ? 35 : Math.min(r.value, 100)) * 0.35) - i * 2),
      type:    'rising',
    })),
    ...top.map((t, i) => ({
      keyword: t.query,
      volume:  `${t.value}%`,
      score:   Math.min(80, 55 + Math.round(Math.min(t.value, 100) * 0.25) - i * 2),
      type:    'top',
    })),
  ];

  if (results.length === 0) throw new Error('No results from Google Trends');
  return results.slice(0, 10);
}

// ── Claude AI Keyword Generation ──────────────────────────
function callAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 600,
      system:     'You are an SEO keyword research expert. Always return valid JSON only — no markdown, no extra text.',
      messages:   [{ role: 'user', content: prompt }],
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    }, (response) => {
      let raw = '';
      response.on('data', c => raw += c);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.content[0].text);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fetchAITrends(keyword) {
  const prompt = `Generate 10 currently trending SEO keyword phrases closely related to the topic: "${keyword}".

Requirements:
- Each keyword should be a realistic search query people type into Google
- Mix of long-tail and short-tail keywords  
- Include high-intent and informational keywords
- Reflect trends of 2025/2026
- Vary the angles: how-to, comparisons, guides, statistics, tools, benefits

Return ONLY this JSON (no markdown):
[
  {"keyword": "...", "volume": "45K+", "score": 92, "type": "rising"},
  ...
]

Rules for fields:
- "volume": a realistic estimated monthly search volume like "12K+", "80K+", "2M+"
- "score": trending score 50-98 (higher = more trending)
- "type": "rising" for fast-growing terms, "top" for established high-volume terms`;

  const raw   = await callAnthropic(prompt);
  const clean = raw.replace(/```json|```/g, '').trim();
  const data  = JSON.parse(clean);

  if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid AI response');
  return data.slice(0, 10);
}

// ── Static fallback (no API key at all) ───────────────────
function buildStaticFallback(keyword) {
  const kw = keyword.toLowerCase();
  const pools = {
    ai:        ['AI writing tools 2026','ChatGPT vs Claude','AI SEO automation','machine learning beginners','generative AI marketing','AI blog generator free','LLM comparison guide','AI plagiarism checker','NLP tools 2026','AI content strategy'],
    marketing: ['digital marketing trends 2026','content marketing ROI','social media algorithm 2026','email marketing automation','SEO keyword research','influencer marketing tips','video marketing statistics','Google Ads strategies','conversion rate optimization','brand awareness 2026'],
    health:    ['mental health apps 2026','intermittent fasting guide','gut microbiome research','sleep optimization tips','mindfulness for stress','anti-inflammatory foods','longevity supplements','fitness tracking apps','holistic wellness routine','mental wellness workplace'],
    tech:      ['web dev trends 2026','Python AI libraries','cloud computing cost','cybersecurity tips','blockchain explained','React vs Next.js','DevOps automation','REST vs GraphQL','open source tools','tech layoffs 2026'],
    finance:   ['passive income online','crypto market 2026','index fund investing','budgeting apps 2026','real estate investing','stock market beginner','financial freedom plan','side hustle ideas','inflation protection','retirement planning 2026'],
  };

  let list = pools.ai;
  if (/market|seo|brand|content|social/i.test(kw))            list = pools.marketing;
  else if (/health|wellness|mental|fitness|diet/i.test(kw))    list = pools.health;
  else if (/tech|code|program|develop|software|web/i.test(kw)) list = pools.tech;
  else if (/financ|invest|money|crypto|stock/i.test(kw))       list = pools.finance;

  return list.map((word, i) => ({
    keyword: word,
    volume:  `${Math.floor(Math.random() * 80 + 20)}K+`,
    score:   95 - i * 3,
    type:    i < 5 ? 'rising' : 'top',
  }));
}

module.exports = router;
