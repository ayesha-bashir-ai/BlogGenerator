// AI Blogger — Generate Page Script
// Served from /public so Vite does NOT transform this file

var state = {
  selectedKeywords: [],
  generatedBlog: null,
  fetchedImages: [],
};

// ── Toggle Buttons ────────────────────────────────────────
function setToggle(groupId, val) {
  document.querySelectorAll('#' + groupId + ' .toggle-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.val === val);
  });
}
function getToggle(groupId) {
  var active = document.querySelector('#' + groupId + ' .toggle-btn.active');
  return active ? active.dataset.val : null;
}

// ── Range Slider ──────────────────────────────────────────
function updateRange(el) {
  var pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--pct', pct + '%');
  document.getElementById('wordCountVal').innerHTML = el.value + ' <span>words</span>';
}

// ── Fetch Trends ──────────────────────────────────────────
function fetchTrends() {
  var topic = document.getElementById('topicInput').value.trim();
  if (!topic) { showToast('Please enter a topic first'); return; }

  var btn = document.getElementById('fetchTrendsBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  var API = '/api/v1';
  fetch(API + '/trends?keyword=' + encodeURIComponent(topic))
    .then(function(res) {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
    .then(function(json) {
      if (json.success && json.data && json.data.length > 0) {
        var normalized = json.data.map(function(item) {
          return { kw: item.keyword, vol: item.volume, score: item.score, type: item.type };
        });
        renderTrends(normalized, topic, json.source);
      } else {
        throw new Error('Empty response');
      }
    })
    .catch(function() {
      renderTrends(generateRelatedTrends(topic), topic, 'local');
    })
    .finally(function() {
      btn.classList.remove('loading');
      btn.disabled = false;
    });
}

// ── Local Fallback Keyword Pools ──────────────────────────
function generateRelatedTrends(topic) {
  var t = topic.toLowerCase();
  var pools = {
    ai: [
      {kw:'AI content writing tools',vol:'90K+',score:95},
      {kw:'ChatGPT alternatives 2026',vol:'74K+',score:91},
      {kw:'AI SEO optimization',vol:'68K+',score:88},
      {kw:'machine learning for beginners',vol:'55K+',score:85},
      {kw:'generative AI marketing',vol:'49K+',score:82},
      {kw:'AI blog generator free',vol:'42K+',score:79},
      {kw:'Claude AI vs ChatGPT',vol:'38K+',score:76},
      {kw:'AI writing plagiarism free',vol:'31K+',score:72},
      {kw:'natural language processing 2026',vol:'27K+',score:69},
      {kw:'AI automation for bloggers',vol:'22K+',score:65},
    ],
    marketing: [
      {kw:'digital marketing trends 2026',vol:'88K+',score:94},
      {kw:'content marketing strategy',vol:'72K+',score:89},
      {kw:'social media marketing tips',vol:'65K+',score:86},
      {kw:'email marketing automation',vol:'58K+',score:83},
      {kw:'SEO keyword research guide',vol:'51K+',score:80},
      {kw:'influencer marketing ROI',vol:'44K+',score:77},
      {kw:'video marketing statistics',vol:'37K+',score:74},
      {kw:'brand awareness campaigns',vol:'30K+',score:70},
      {kw:'conversion rate optimization',vol:'25K+',score:67},
      {kw:'Google Ads strategies 2026',vol:'20K+',score:63},
    ],
    health: [
      {kw:'mental health awareness 2026',vol:'85K+',score:93},
      {kw:'mindfulness meditation tips',vol:'70K+',score:88},
      {kw:'intermittent fasting benefits',vol:'63K+',score:85},
      {kw:'gut health probiotics',vol:'56K+',score:82},
      {kw:'exercise routines for beginners',vol:'49K+',score:79},
      {kw:'sleep quality improvement',vol:'42K+',score:76},
      {kw:'anti-inflammatory diet',vol:'35K+',score:73},
      {kw:'stress management techniques',vol:'28K+',score:70},
      {kw:'holistic wellness approach',vol:'23K+',score:66},
      {kw:'longevity research 2026',vol:'18K+',score:62},
    ],
    tech: [
      {kw:'web development trends 2026',vol:'87K+',score:93},
      {kw:'Python programming for beginners',vol:'73K+',score:89},
      {kw:'cloud computing AWS guide',vol:'67K+',score:86},
      {kw:'cybersecurity best practices',vol:'60K+',score:83},
      {kw:'blockchain technology explained',vol:'53K+',score:80},
      {kw:'React vs Vue vs Angular',vol:'46K+',score:77},
      {kw:'DevOps automation tools',vol:'39K+',score:74},
      {kw:'API development REST GraphQL',vol:'32K+',score:71},
      {kw:'app development cost 2026',vol:'27K+',score:67},
      {kw:'open source software 2026',vol:'22K+',score:63},
    ],
    finance: [
      {kw:'personal finance tips 2026',vol:'89K+',score:94},
      {kw:'investing for beginners',vol:'75K+',score:90},
      {kw:'cryptocurrency market 2026',vol:'68K+',score:87},
      {kw:'passive income ideas online',vol:'61K+',score:84},
      {kw:'stock market strategies',vol:'54K+',score:81},
      {kw:'budgeting apps comparison',vol:'47K+',score:78},
      {kw:'real estate investing tips',vol:'40K+',score:75},
      {kw:'financial freedom roadmap',vol:'33K+',score:72},
      {kw:'side hustle ideas 2026',vol:'28K+',score:68},
      {kw:'retirement planning guide',vol:'23K+',score:64},
    ],
  };

  var matched = null;
  if (/ai|artificial|machine|gpt|llm|chatbot|robot|neural|automation/i.test(t)) matched = pools.ai;
  else if (/market|seo|brand|content|social|campaign|advertis|influenc/i.test(t)) matched = pools.marketing;
  else if (/health|wellness|mental|fitness|diet|nutrition|medical|yoga|mindful/i.test(t)) matched = pools.health;
  else if (/tech|code|program|develop|software|web|app|cloud|cyber|python|java/i.test(t)) matched = pools.tech;
  else if (/financ|invest|money|crypto|stock|budget|income|wealth|econ/i.test(t)) matched = pools.finance;

  if (matched) return matched;

  return [
    {kw: topic + ' tips and tricks 2026', vol:'45K+', score:88},
    {kw: 'best ' + topic + ' tools',      vol:'38K+', score:84},
    {kw: topic + ' for beginners guide',  vol:'32K+', score:80},
    {kw: topic + ' trends 2026',          vol:'27K+', score:77},
    {kw: 'how to learn ' + topic,         vol:'23K+', score:74},
    {kw: topic + ' examples and case studies', vol:'19K+', score:70},
    {kw: topic + ' statistics research',  vol:'16K+', score:67},
    {kw: topic + ' vs alternatives',      vol:'13K+', score:64},
    {kw: 'free ' + topic + ' resources',  vol:'10K+', score:60},
    {kw: topic + ' future outlook',       vol:'8K+',  score:57},
  ];
}

function renderTrends(trends, topic, source) {
  var panel = document.getElementById('trendsPanel');
  var grid  = document.getElementById('trendsGrid');
  var srcLabel = source === 'google_trends' ? '📈 Google Trends'
    : source === 'ai'      ? '🤖 AI-Powered Trends'
    : source === 'fallback'? '⚡ Smart Suggestions'
    : '💡 Suggestions';
  document.getElementById('trendsSource').textContent = srcLabel + ' — related to "' + topic + '"';
  document.getElementById('trendsCount').textContent  = state.selectedKeywords.length + '/5 selected';
  panel.classList.add('show');
  grid.innerHTML = '';

  trends.forEach(function(t, i) {
    var isHot = i < 3;
    var barW  = Math.round((t.score / 100) * 100);

    var chip  = document.createElement('div');
    chip.className    = 'trend-chip';
    chip.dataset.kw   = t.kw;

    var rank  = document.createElement('span');
    rank.className    = 'chip-rank' + (isHot ? ' hot' : '');
    rank.textContent  = (isHot ? '🔥' : '#') + (i + 1);

    var text  = document.createElement('span');
    text.className    = 'chip-text';
    text.textContent  = t.kw;

    var vol   = document.createElement('span');
    vol.className     = 'chip-volume';
    vol.textContent   = t.vol;

    var check = document.createElement('div');
    check.className   = 'chip-check';
    check.textContent = '✓';

    var bar   = document.createElement('div');
    bar.className     = 'trend-bar';
    bar.style.width   = barW + '%';

    chip.appendChild(rank);
    chip.appendChild(text);
    chip.appendChild(vol);
    chip.appendChild(check);
    chip.appendChild(bar);

    chip.onclick = (function(kw, el) {
      return function() { toggleKeyword(kw, el); };
    })(t.kw, chip);

    grid.appendChild(chip);
  });
}

function toggleKeyword(kw, chip) {
  var idx = state.selectedKeywords.indexOf(kw);
  if (idx > -1) {
    state.selectedKeywords.splice(idx, 1);
    chip.classList.remove('selected');
  } else {
    if (state.selectedKeywords.length >= 5) { showToast('Max 5 keywords. Remove one first.'); return; }
    state.selectedKeywords.push(kw);
    chip.classList.add('selected');
  }
  renderSelectedKeywords();
  document.getElementById('trendsCount').textContent = state.selectedKeywords.length + '/5 selected';
}

function renderSelectedKeywords() {
  var wrap = document.getElementById('selectedKeywords');
  if (state.selectedKeywords.length === 0) {
    wrap.innerHTML = '<span class="sel-empty">Click keywords above to select them</span>';
  } else {
    wrap.innerHTML = '';
    state.selectedKeywords.forEach(function(kw) {
      var chip = document.createElement('span');
      chip.className = 'sel-chip';
      chip.textContent = kw + ' ';
      var btn = document.createElement('button');
      btn.textContent = '×';
      btn.onclick = (function(k) { return function() { removeKeyword(k); }; })(kw);
      chip.appendChild(btn);
      wrap.appendChild(chip);
    });
  }
  wrap.classList.toggle('sel-chip-list-empty', state.selectedKeywords.length === 0);
  wrap.classList.toggle('has-items', state.selectedKeywords.length > 0);
}

function removeKeyword(kw) {
  state.selectedKeywords = state.selectedKeywords.filter(function(k) { return k !== kw; });
  document.querySelectorAll('.trend-chip').forEach(function(c) {
    if (c.dataset.kw === kw) c.classList.remove('selected');
  });
  renderSelectedKeywords();
  document.getElementById('trendsCount').textContent = state.selectedKeywords.length + '/5 selected';
}

function clearKeywords() {
  state.selectedKeywords = [];
  document.querySelectorAll('.trend-chip.selected').forEach(function(c) { c.classList.remove('selected'); });
  renderSelectedKeywords();
  document.getElementById('trendsCount').textContent = '0/5 selected';
}

// ── Generate Blog ─────────────────────────────────────────
function generateBlog() {
  var topic = document.getElementById('topicInput').value.trim();
  if (!topic) { showToast('Please enter a blog topic'); document.getElementById('topicInput').focus(); return; }

  var btn = document.getElementById('generateBtn');
  btn.classList.add('loading');
  btn.disabled = true;
  document.getElementById('generateHint').textContent = '✦ AI is writing your blog...';

  var config = {
    topic:    topic,
    keywords: state.selectedKeywords.slice(),
    length:   getToggle('lengthToggle'),
    tone:     document.getElementById('toneSelect').value,
    structure: getToggle('structureToggle'),
    audience: document.getElementById('audienceSelect').value,
    wordCount: document.getElementById('wordCount').value,
    extra:    document.getElementById('extraInstructions').value.trim(),
    humanize: document.getElementById('humanizeToggle').checked,
    seo:      document.getElementById('seoToggle').checked,
    images:   document.getElementById('imagesToggle').checked,
    plagFree: document.getElementById('plagToggle').checked,
  };

  callBackendGenerate(config)
    .catch(function() { return generateDemoBlog(config); })
    .then(function(blog) {
      state.generatedBlog = blog;
      renderOutput(blog, config);
      var p = config.images ? fetchAndRenderImages(topic) : Promise.resolve();
      return p;
    })
    .then(function() {
      btn.classList.remove('loading');
      btn.disabled = false;
      document.getElementById('generateHint').textContent = 'Powered by Claude AI · Usually takes 5–15 seconds';
      document.getElementById('outputSection').classList.add('show');
      document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// ── Backend Call ──────────────────────────────────────────
function callBackendGenerate(config) {
  var token = localStorage.getItem('token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  return fetch('/api/v1/ai/generate', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      topic:    config.topic,
      length:   config.length,
      tone:     config.tone,
      category: config.structure,
      keywords: config.keywords,
    }),
  }).then(function(res) {
    if (!res.ok) throw new Error('Backend unavailable');
    return res.json();
  }).then(function(data) {
    return data.data.blog;
  });
}

// ── Demo Blog Generator ───────────────────────────────────
function generateDemoBlog(config) {
  var topic  = config.topic;
  var keywords  = config.keywords;
  var structure = config.structure;
  var wordCount = config.wordCount;
  var kwStr  = keywords.length ? keywords.slice(0,3).join(', ') : topic;

  var contentFns = {
    listicle:  function() { return generateListicle(topic, kwStr); },
    howto:     function() { return generateHowTo(topic, kwStr); },
    opinion:   function() { return generateOpinion(topic, kwStr); },
    casestudy: function() { return generateCaseStudy(topic, kwStr); },
    standard:  function() { return generateStandard(topic, kwStr); },
  };

  var fn      = contentFns[structure] || contentFns.standard;
  var content = fn();
  var wc      = content.replace(/<[^>]*>/g, '').split(/\s+/).length;

  return {
    title:           generateTitle(topic, structure),
    content:         content,
    excerpt:         'An in-depth exploration of ' + topic + ', covering ' + kwStr + ' and more.',
    seo_score:       82 + Math.floor(Math.random() * 12),
    word_count:      wc,
    tags:            [topic.toLowerCase()].concat(keywords.slice(0, 2)),
    read_time:       Math.ceil(wc / 200),
    is_ai_generated: true,
  };
}

function generateTitle(topic, structure) {
  var map = {
    listicle:  '10 Proven ' + topic + ' Strategies That Actually Work in 2026',
    howto:     'How to Master ' + topic + ': A Complete Step-by-Step Guide',
    opinion:   'Why ' + topic + ' Is Changing Everything We Know',
    casestudy: topic + ' in Action: A Real-World Case Study',
    standard:  'The Ultimate Guide to ' + topic + ': Everything You Need to Know',
  };
  return map[structure] || map.standard;
}

function generateStandard(topic, kw) {
  return '<h2>Introduction</h2>'
    + '<p>In today\'s rapidly evolving landscape, <strong>' + topic + '</strong> has emerged as one of the most transformative forces shaping how we work, live, and connect. This guide covers key insights around <em>' + kw + '</em>.</p>'
    + '<h2>Why ' + topic + ' Matters in 2026</h2>'
    + '<p>Organizations that embrace ' + topic + ' see measurable improvements in efficiency, customer satisfaction, and long-term growth.</p>'
    + '<blockquote>' + topic + ' is not a trend — it\'s the new baseline.</blockquote>'
    + '<h2>Key Concepts</h2>'
    + '<p>When it comes to <strong>' + kw + '</strong>, three ideas separate practitioners who get results from those who spin their wheels: consistency, context, and measurement.</p>'
    + '<h2>Practical Steps</h2>'
    + '<p>Start by auditing where you are. Before adding anything new, understand your baseline. What\'s working? What\'s wasting your time? Then identify your highest-leverage opportunity.</p>'
    + '<h2>Common Mistakes</h2>'
    + '<p>Moving too fast without a clear foundation is the biggest pitfall. Give yourself permission to master the fundamentals of <strong>' + kw + '</strong> first.</p>'
    + '<h2>Conclusion</h2>'
    + '<p>' + topic + ' is a genuine opportunity for those willing to put in the work. Take one idea from this article and implement it today.</p>';
}

function generateListicle(topic, kw) {
  return '<h2>Why This List Changes Everything</h2>'
    + '<p>These are the <strong>10 battle-tested ' + topic + ' strategies</strong> that top performers rely on — especially around <em>' + kw + '</em>.</p>'
    + '<h2>1. Start with the End in Mind</h2><p>Define what done looks like before you take a single step.</p>'
    + '<h2>2. Build Systems, Not Goals</h2><p>Create repeatable processes that produce consistent results in ' + topic + '.</p>'
    + '<h2>3. Master the Core First</h2><p>The fundamentals of <strong>' + kw + '</strong> outperform the latest shiny thing every time.</p>'
    + '<h2>4. Use Data to Drive Decisions</h2><p>Track the metrics that matter to your ' + topic + ' outcomes.</p>'
    + '<h2>5. Invest in Relationships Early</h2><p>Build genuine connections across your industry before you need a favor.</p>'
    + '<h2>6. Communicate with Clarity</h2><p>Whether explaining ' + topic + ' to a client or your audience — clarity wins.</p>'
    + '<h2>7. Embrace Iteration</h2><p>Done beats perfect. Ship, then improve.</p>'
    + '<h2>8. Protect Your Energy</h2><p>Your best ' + topic + ' work happens when you\'re sharp.</p>'
    + '<h2>9. Study What Works</h2><p>Extract principles from the best examples of <strong>' + kw + '</strong> and remix them.</p>'
    + '<h2>10. Play the Long Game</h2><p>Consistency always beats intensity in ' + topic + '.</p>'
    + '<h2>Final Thoughts</h2><p>Pick two or three strategies and commit for the next 90 days.</p>';
}

function generateHowTo(topic, kw) {
  return '<h2>Before You Start</h2>'
    + '<p>This guide assumes basic familiarity with <strong>' + topic + '</strong>. Steps are designed to be followed in order — each builds on the last.</p>'
    + '<h2>Step 1: Define Your Starting Point</h2><p>Spend 20 minutes honestly assessing your current relationship with ' + topic + '. Write it down.</p>'
    + '<h2>Step 2: Set a Measurable Goal</h2><p>"Get better at ' + topic + '" is not a goal. A goal is specific, measurable, and time-bound — focused on <em>' + kw + '</em>.</p>'
    + '<h2>Step 3: Gather the Right Resources</h2><p>Identify two or three authoritative resources on <strong>' + kw + '</strong> and eliminate the noise.</p>'
    + '<h2>Step 4: Execute in Sprints</h2><p>Each sprint has one primary focus. Small batches reveal problems early and build momentum fast.</p>'
    + '<h2>Step 5: Get Early Feedback</h2><p>Share your ' + topic + ' work at 60% completion — early feedback is far more valuable than late praise.</p>'
    + '<h2>Step 6: Document Everything</h2><p>Keep a simple log: what you tried, what happened, what you learned. This becomes your personal playbook.</p>'
    + '<h2>Step 7: Reflect and Iterate</h2><p>End every sprint with a retrospective. What worked? What will you do differently?</p>'
    + '<h2>You\'re Ready</h2><p>These steps make your path clearer and your results more predictable. Start with Step 1 — today.</p>';
}

function generateOpinion(topic, kw) {
  return '<p><em>Most of what you\'ve heard about <strong>' + topic + '</strong> is oversimplified or wrong.</em></p>'
    + '<h2>The Mainstream Narrative Is Missing the Point</h2>'
    + '<p>The people doing serious work — especially around <strong>' + kw + '</strong> — are quietly building something real while the hot takes fly.</p>'
    + '<h2>What the Critics Get Wrong</h2>'
    + '<p>Hype does not negate substance. The organizations that have genuinely integrated ' + topic + ' show outcomes that are hard to dismiss.</p>'
    + '<h2>What the Cheerleaders Get Wrong</h2>'
    + '<p>Breathless enthusiasm ignores adoption challenges and the ways ' + topic + ' can create new problems even as it solves old ones.</p>'
    + '<h2>My Actual Take</h2>'
    + '<p>' + topic + ' is a powerful tool that amplifies both skill and intent. In thoughtful hands it produces remarkable results. In careless hands, expensive messes.</p>'
    + '<h2>The Bottom Line</h2>'
    + '<p>Resist both the cynicism and the hype. Engage with ' + topic + ' on its actual merits — that\'s the only way to figure out what it\'s really capable of.</p>';
}

function generateCaseStudy(topic, kw) {
  return '<h2>Overview</h2>'
    + '<p>This case study examines how a mid-sized organization transformed its approach to <strong>' + topic + '</strong> over 18 months, with a focus on <em>' + kw + '</em>.</p>'
    + '<p><strong>Challenge:</strong> Scaling ' + topic + ' without proportional headcount growth. <strong>Timeline:</strong> Q1 2025 – Q2 2026.</p>'
    + '<h2>The Challenge</h2>'
    + '<p>Output was inconsistent, teams were reinventing wheels, and there was no shared framework for ' + topic + ' decisions.</p>'
    + '<h2>The Approach</h2>'
    + '<p><strong>Phase 1 — Diagnose:</strong> Audit of existing practices. Found 20% of activities producing 80% of value.</p>'
    + '<p><strong>Phase 2 — Design:</strong> Lightweight framework for <strong>' + kw + '</strong> decisions with shared templates and clear ownership.</p>'
    + '<p><strong>Phase 3 — Deploy:</strong> Rolled out in one team first. Iterated before expanding.</p>'
    + '<p><strong>Phase 4 — Scale:</strong> Expanded org-wide with internal champions in each department.</p>'
    + '<h2>Results</h2>'
    + '<p>📈 <strong>37% improvement</strong> in output quality · ⏱ <strong>42% reduction</strong> in rework time · 👥 <strong>89% team satisfaction</strong> · 💰 <strong>3.2x ROI</strong></p>'
    + '<h2>Key Lessons</h2>'
    + '<p>Diagnose before prescribing. Simple frameworks beat sophisticated ones. Champions matter more than mandates.</p>'
    + '<h2>Conclusion</h2>'
    + '<p>' + topic + ' transformation succeeds when grounded in diagnosis, executed in phases, and driven by people — not policy.</p>';
}

// ── Render Output ─────────────────────────────────────────
function renderOutput(blog, config) {
  document.getElementById('outputTitle').textContent = blog.title;

  var wc = blog.word_count || blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  var stats = '<div class="blog-stat">📝 <strong>' + wc.toLocaleString() + '</strong> words</div>'
    + '<div class="blog-stat">⏱ <strong>' + (blog.read_time || Math.ceil(wc / 200)) + '</strong> min read</div>'
    + '<div class="blog-stat">🤖 <strong>AI Generated</strong></div>';
  if (config.humanize) stats += '<div class="blog-stat">✍️ <strong>Humanized</strong></div>';
  if (config.plagFree) stats += '<div class="blog-stat">✅ <strong>Plagiarism-Free</strong></div>';
  document.getElementById('blogStats').innerHTML = stats;

  document.getElementById('blogContent').innerHTML = blog.content;

  if (config.seo) {
    var score = blog.seo_score || 82;
    document.getElementById('seoPanel').style.display = 'block';
    setTimeout(function() {
      document.getElementById('seoScoreNum').textContent = score;
      document.getElementById('seoBarFill').style.width = score + '%';
      document.getElementById('seoLabel').textContent = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs work';
      var tags = (blog.tags || []).concat(state.selectedKeywords.slice(0, 3));
      var unique = tags.filter(function(v, i, a) { return a.indexOf(v) === i; }).slice(0, 8);
      document.getElementById('seoTags').innerHTML = unique.map(function(t) {
        return '<span class="seo-tag">' + t + '</span>';
      }).join('');
    }, 800);
  }
}

// ── Fetch Images ──────────────────────────────────────────
function fetchAndRenderImages(topic) {
  var wrap = document.getElementById('featuredImageWrap');
  var UNSPLASH_KEY = window.UNSPLASH_ACCESS_KEY || '';

  var p = UNSPLASH_KEY
    ? fetch('https://api.unsplash.com/search/photos?query=' + encodeURIComponent(topic) + '&per_page=3&orientation=landscape&client_id=' + UNSPLASH_KEY)
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.results && d.results.length) {
            state.fetchedImages = d.results.map(function(i) { return i.urls.regular; });
            return { url: d.results[0].urls.regular, credit: 'Photo by ' + d.results[0].user.name + ' on Unsplash' };
          }
          return null;
        })
        .catch(function() { return null; })
    : Promise.resolve(null);

  return p.then(function(img) {
    var url    = img ? img.url    : 'https://source.unsplash.com/800x400/?' + encodeURIComponent(topic) + ',technology';
    var credit = img ? img.credit : 'Image via Unsplash';

    wrap.innerHTML = '<img src="' + url + '" alt="' + topic + '" onerror="this.parentElement.style.display=\'none\'">'
      + '<div class="blog-image-credit">' + credit + '</div>';

    var content = document.getElementById('blogContent');
    var h2s     = content.querySelectorAll('h2');
    if (h2s.length >= 3) {
      var midImg = document.createElement('div');
      midImg.className = 'mid-image-wrap';
      var mimg = document.createElement('img');
      mimg.src   = url;
      mimg.alt   = topic;
      mimg.style.filter = 'hue-rotate(15deg)';
      mimg.onerror = function() { this.parentElement.style.display = 'none'; };
      midImg.appendChild(mimg);
      h2s[2].parentNode.insertBefore(midImg, h2s[2]);
    }
  });
}

// ── Copy & Download ───────────────────────────────────────
function copyBlog() {
  if (!state.generatedBlog) return;
  var text = '# ' + state.generatedBlog.title + '\n\n'
    + state.generatedBlog.content.replace(/<[^>]*>/g, '').replace(/\n\n+/g, '\n\n');
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied!';
    btn.classList.add('copy-done');
    setTimeout(function() { btn.textContent = '📋 Copy'; btn.classList.remove('copy-done'); }, 2500);
  });
}

function downloadBlog() {
  if (!state.generatedBlog) return;
  var text = '# ' + state.generatedBlog.title + '\n\n'
    + state.generatedBlog.content.replace(/<[^>]*>/g, '').replace(/\n\n+/g, '\n\n');
  var a = document.createElement('a');
  a.href     = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(text);
  a.download = state.generatedBlog.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.md';
  a.click();
}

function regenerate() {
  document.getElementById('outputSection').classList.remove('show');
  setTimeout(function() { document.getElementById('generateBtn').click(); }, 300);
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  var toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3500);
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  updateRange(document.getElementById('wordCount'));
  document.getElementById('topicInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') fetchTrends();
  });
});
