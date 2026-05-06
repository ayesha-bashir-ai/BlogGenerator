const express      = require('express');
const googleTrends = require('google-trends-api');
const https        = require('https');
const router       = express.Router();

// GET /api/v1/trends?keyword=...
router.get('/', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ success: false, message: 'keyword is required' });
  }

  // 1st choice: real Google Trends
  try {
    const trends = await fetchGoogleTrends(keyword);
    return res.json({ success: true, source: 'google_trends', data: trends });
  } catch {
    console.log('[Trends] Google Trends unavailable, trying Claude AI...');
  }

  // 2nd choice: Claude AI (read key dynamically so it's always fresh)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const trends = await fetchAITrends(keyword, apiKey);
      return res.json({ success: true, source: 'ai', data: trends });
    } catch (aiErr) {
      console.error('[Trends] Claude AI error:', aiErr.message);
    }
  }

  // 3rd choice: static category pools
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
function callAnthropic(prompt, apiKey) {
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
        'x-api-key':         apiKey,
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

async function fetchAITrends(keyword, apiKey) {
  const prompt = `Generate 10 currently trending SEO keyword phrases closely related to the topic: "${keyword}".

Requirements:
- Each keyword should be a realistic search query people type into Google
- Mix of long-tail and short-tail keywords
- Include high-intent and informational keywords
- Reflect trends of 2025/2026
- Vary the angles: how-to, comparisons, guides, statistics, tools, benefits

Return ONLY this JSON array (no markdown, no explanation):
[
  {"keyword": "...", "volume": "45K+", "score": 92, "type": "rising"},
  ...
]

Rules:
- "volume": realistic estimated monthly search volume like "12K+", "80K+", "2M+"
- "score": trending score 50-98 (higher = more trending)
- "type": "rising" for fast-growing terms, "top" for established high-volume terms`;

  const raw   = await callAnthropic(prompt, apiKey);
  const clean = raw.replace(/```json|```/g, '').trim();
  const data  = JSON.parse(clean);

  if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid AI response');
  return data.slice(0, 10);
}

// ── Static fallback pools (covers broad topic categories) ─
function buildStaticFallback(keyword) {
  const kw = keyword.toLowerCase();

  const pools = {
    ai:        ['AI writing tools 2026','ChatGPT vs Claude','AI SEO automation','machine learning beginners','generative AI marketing','AI blog generator free','LLM comparison guide','AI plagiarism checker','NLP tools 2026','AI content strategy'],
    marketing: ['digital marketing trends 2026','content marketing ROI','social media algorithm 2026','email marketing automation','SEO keyword research','influencer marketing tips','video marketing statistics','Google Ads strategies','conversion rate optimization','brand awareness 2026'],
    health:    ['mental health apps 2026','intermittent fasting guide','gut microbiome research','sleep optimization tips','mindfulness for stress','anti-inflammatory foods','longevity supplements','fitness tracking apps','holistic wellness routine','mental wellness workplace'],
    tech:      ['web dev trends 2026','Python AI libraries','cloud computing cost','cybersecurity tips','blockchain explained','React vs Next.js','DevOps automation','REST vs GraphQL','open source tools','tech career 2026'],
    finance:   ['passive income online','crypto market 2026','index fund investing','budgeting apps 2026','real estate investing','stock market beginner','financial freedom plan','side hustle ideas','inflation protection','retirement planning 2026'],
    food:      ['easy dinner recipes 2026','meal prep ideas','healthy breakfast recipes','air fryer recipes','vegan recipes beginners','budget meal planning','restaurant trends 2026','home cooking tips','gluten-free recipes','food photography tips'],
    travel:    ['best travel destinations 2026','budget travel tips','solo travel guide','travel insurance comparison','hidden gems Europe','travel hacks flights','digital nomad destinations','visa-free countries','best travel credit cards','sustainable travel 2026'],
    beauty:    ['skincare routine beginners','best moisturizer 2026','K-beauty trends','anti-aging skincare','natural makeup tutorial','hair care tips','salon at home guide','best serums 2026','beauty on a budget','clean beauty products'],
    fashion:   ['fashion trends 2026','capsule wardrobe guide','sustainable fashion brands','outfit ideas women','men\'s style tips','thrift shopping tips','fashion on a budget','streetwear trends','luxury fashion deals','how to dress for body type'],
    business:  ['small business ideas 2026','how to start a business','dropshipping guide','ecommerce trends','freelancing tips','business automation tools','startup funding guide','online business ideas','B2B marketing strategies','entrepreneur mindset'],
    education: ['online learning platforms','best certifications 2026','study tips productivity','e-learning trends','free online courses','skill development guide','career change advice','professional development','learning new skills fast','EdTech tools 2026'],
    fitness:   ['workout routines beginners','weight loss tips 2026','home workout equipment','HIIT training guide','strength training women','running for beginners','yoga for flexibility','nutrition for muscle gain','fitness apps 2026','gym motivation tips'],
    parenting: ['parenting tips toddlers','screen time guidelines kids','educational toys 2026','child development stages','parenting stress management','homeschooling tips','teen mental health','baby sleep schedule','family activities ideas','positive parenting techniques'],
    pets:      ['dog training tips','best cat food 2026','pet care on a budget','puppy care guide','dog breeds for families','pet health insurance','cat behavior explained','fish tank beginner setup','exotic pets guide','pet adoption tips'],
    real_estate: ['real estate investing 2026','first time home buyer tips','rental property guide','real estate market trends','house flipping guide','mortgage rates 2026','how to buy a house','real estate agent tips','property management','REITs for beginners'],
  };

  // Match topic to the best pool
  let list = null;
  if (/\bai\b|artificial intel|machine learn|chatgpt|gpt|llm|neural|automation/i.test(kw))       list = pools.ai;
  else if (/market|seo|brand|content|social media|advertis|influenc|campaign/i.test(kw))          list = pools.marketing;
  else if (/health|wellness|mental|diet|nutrition|medical|yoga|mindful|supplement/i.test(kw))     list = pools.health;
  else if (/tech|code|program|develop|software|web|app|cloud|cyber|python|java|devops/i.test(kw)) list = pools.tech;
  else if (/financ|invest|money|crypto|stock|budget|income|wealth|econ|trading/i.test(kw))        list = pools.finance;
  else if (/food|recipe|cook|eat|meal|diet|restaurant|baking|cuisine|culinary/i.test(kw))         list = pools.food;
  else if (/travel|trip|tour|vacation|holiday|destination|flight|hotel|backpack/i.test(kw))       list = pools.travel;
  else if (/beauty|skincare|makeup|cosmetic|salon|hair|skin|face|grooming|spa/i.test(kw))         list = pools.beauty;
  else if (/fashion|style|outfit|clothing|wear|dress|trend|wardrobe|apparel/i.test(kw))           list = pools.fashion;
  else if (/business|entrepreneur|startup|commerce|company|ecommerce|dropship/i.test(kw))         list = pools.business;
  else if (/learn|education|study|school|course|certif|college|university|skill/i.test(kw))       list = pools.education;
  else if (/fitness|workout|exercise|gym|weight|muscle|cardio|running|yoga|train/i.test(kw))      list = pools.fitness;
  else if (/parent|child|kid|baby|toddler|teen|family|mom|dad|homeschool/i.test(kw))              list = pools.parenting;
  else if (/pet|dog|cat|puppy|kitten|animal|fish|bird|reptile|hamster/i.test(kw))                 list = pools.pets;
  else if (/real estate|property|house|home buy|mortgage|rental|landlord|reit/i.test(kw))         list = pools.real_estate;

  // Generic fallback: build topic-specific phrases
  if (!list) {
    list = [
      `${keyword} tips and tricks 2026`,
      `best ${keyword} tools and resources`,
      `${keyword} for beginners complete guide`,
      `${keyword} trends 2026`,
      `how to get started with ${keyword}`,
      `${keyword} benefits and advantages`,
      `${keyword} common mistakes to avoid`,
      `${keyword} step by step tutorial`,
      `${keyword} vs alternatives compared`,
      `${keyword} future outlook 2026`,
    ];
    return list.map((word, i) => ({
      keyword: word,
      volume:  `${Math.floor(Math.random() * 60 + 15)}K+`,
      score:   95 - i * 3,
      type:    i < 5 ? 'rising' : 'top',
    }));
  }

  return list.map((word, i) => ({
    keyword: word,
    volume:  `${Math.floor(Math.random() * 80 + 20)}K+`,
    score:   95 - i * 3,
    type:    i < 5 ? 'rising' : 'top',
  }));
}

module.exports = router;
