const https=require('https');
const API_KEY=process.env.ANTHROPIC_API_KEY;
const UNSPLASH=process.env.UNSPLASH_ACCESS_KEY;
const SERP=process.env.SERP_API_KEY;

function callAnthropic(messages,system,maxTokens=2000){
  return new Promise((resolve,reject)=>{
    const body=JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:maxTokens,system,messages});
    const req=https.request({hostname:'api.anthropic.com',path:'/v1/messages',method:'POST',headers:{'Content-Type':'application/json','x-api-key':API_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)}},res=>{
      let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{const p=JSON.parse(d);if(p.error)return reject(new Error(p.error.message));resolve(p.content[0].text);}catch(e){reject(e);}});
    });
    req.on('error',reject);req.write(body);req.end();
  });
}

const WORDS={short:300,medium:600,long:1200,ultralong:2000};
const STRUCTS={standard:'Standard blog with Introduction, H2 sections, Conclusion.',howto:'Step-by-step How-To with numbered steps.',listicle:'Listicle: Top N Things, numbered bold items.',casestudy:'Case Study: Problem→Approach→Results→Takeaways.',opinion:'Opinion: clear stance + arguments + conclusion.'};

async function generateBlog({topic,length='medium',tone='professional',category,keywords=[],structure='standard',humanize=true}){
  if(!API_KEY) return mockBlog(topic,length);
  const wt=WORDS[length]||600;
  const kw=keywords.length?`Naturally include: ${keywords.join(', ')}.`:'';
  const hu=humanize?`Write naturally. Vary sentence lengths. Avoid "delve","tapestry","it's worth noting". Sound like a knowledgeable friend.`:'';
  const system='You are an expert SEO blog writer. Return ONLY valid JSON, no markdown fences.';
  const prompt=`Write a ${tone} blog about: "${topic}"\nStructure: ${STRUCTS[structure]||STRUCTS.standard}\nTarget: ~${wt} words. ${kw} ${hu}\nReturn JSON: {"title":"...","content":"full markdown","excerpt":"<160 chars","tags":["t1","t2","t3"],"seo_title":"<60 chars","seo_description":"<155 chars","seo_score":85}`;
  const raw=await callAnthropic([{role:'user',content:prompt}],system,wt*2+400);
  try{return JSON.parse(raw.replace(/```json|```/g,'').trim());}
  catch{return{title:topic,content:raw,excerpt:raw.substring(0,160),tags:[],seo_title:topic,seo_description:'',seo_score:70};}
}

async function suggestTopics(niche,count=5){
  if(!API_KEY) return Array.from({length:count},(_,i)=>({title:`${niche} Trend ${i+1} in 2026`,why_trending:'High search volume',seo_difficulty:'medium'}));
  const raw=await callAnthropic([{role:'user',content:`Suggest ${count} trending 2026 blog topics for "${niche}". JSON: {"topics":[{"title":"...","why_trending":"...","seo_difficulty":"low|medium|high"}]}`}],'Content strategist. JSON only.',600);
  try{return JSON.parse(raw.replace(/```json|```/g,'').trim()).topics;}catch{return[];}
}

async function improveBlog(content,improvement='seo'){
  if(!API_KEY) return{improved:content,changes:['No API key — original returned']};
  const inst={seo:'Improve SEO: keyword density, headings.',readability:'Shorter sentences, clearer flow.',tone:'More engaging and conversational.',grammar:'Fix grammar and spelling.',humanize:'Rewrite naturally. No AI clichés.'};
  const raw=await callAnthropic([{role:'user',content:`${inst[improvement]||inst.seo}\n\nContent:\n${content.substring(0,3000)}\n\nReturn JSON: {"improved":"...","changes":["c1","c2"]}`}],'Professional editor. JSON only.',3000);
  try{return JSON.parse(raw.replace(/```json|```/g,'').trim());}catch{return{improved:content,changes:[]};}
}

async function generateSEOMeta(title,content){
  if(!API_KEY) return{seo_title:title.substring(0,60),seo_description:content.substring(0,155),keywords:[],seo_score:70};
  const raw=await callAnthropic([{role:'user',content:`SEO meta for:\nTitle:${title}\nContent:${content.substring(0,400)}\nReturn JSON: {"seo_title":"<60","seo_description":"<155","keywords":["k1","k2","k3"],"seo_score":0-100}`}],'SEO expert. JSON only.',350);
  try{return JSON.parse(raw.replace(/```json|```/g,'').trim());}catch{return{seo_title:title.substring(0,60),seo_description:'',keywords:[],seo_score:70};}
}

async function chat(message,history=[]){
  if(!API_KEY) return`Hi! I'm your AI Blogger assistant. Add ANTHROPIC_API_KEY to .env for real AI responses. Ask me anything about blogging or SEO!`;
  const msgs=[...history.slice(-8).map(h=>({role:h.role,content:h.content})),{role:'user',content:message}];
  return callAnthropic(msgs,'You are a helpful AI Blogger assistant. Help with blog writing, SEO, and platform features. Be friendly and concise. Max 3 paragraphs.',500);
}

function fetchImages(query,count=3){
  if(!UNSPLASH) return Promise.resolve(Array.from({length:count},(_,i)=>({url:`https://picsum.photos/seed/${encodeURIComponent(query)}${i}/800/400`,thumb:`https://picsum.photos/seed/${encodeURIComponent(query)}${i}/400/200`,alt:`${query} image ${i+1}`,credit:'Unsplash'})));
  return new Promise(resolve=>{
    https.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,{headers:{Authorization:`Client-ID ${UNSPLASH}`}},res=>{
      let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{const j=JSON.parse(d);resolve((j.results||[]).map(p=>({url:p.urls.regular,thumb:p.urls.small,alt:p.alt_description||query,credit:p.user.name})));}catch{resolve([]);}});
    }).on('error',()=>resolve([]));
  });
}

async function fetchTrending(geo='US',keyword=''){
  if(!SERP) return mockTrends(geo);
  return new Promise(resolve=>{
    const q=keyword?`&q=${encodeURIComponent(keyword)}&data_type=RELATED_QUERIES`:`&data_type=TRENDING_SEARCHES`;
    https.get(`https://serpapi.com/search.json?engine=google_trends&geo=${geo}${q}&api_key=${SERP}`,res=>{
      let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{const j=JSON.parse(d);const t=j.trending_searches||j.related_queries?.top||[];resolve(Array.isArray(t)?t.slice(0,12).map(x=>({keyword:x.query||x.title||x,traffic:x.formattedValue||'Trending'})):mockTrends(geo));}catch{resolve(mockTrends(geo));}});
    }).on('error',()=>resolve(mockTrends(geo)));
  });
}

function mockBlog(topic,length){return{title:`The Complete Guide to ${topic} in 2026`,content:`## Introduction\n\nThis covers ${topic}.\n\n## Key Points\n\n- Point one\n- Point two\n- Point three\n\n## Conclusion\n\nStart today!`,excerpt:`Everything about ${topic}.`,tags:[topic.toLowerCase(),'guide','2026'],seo_title:`${topic} Guide 2026`,seo_description:`Learn about ${topic}.`,seo_score:80};}
function mockTrends(geo){const m={PK:['AI in Pakistan','Digital Marketing','SEO Tips 2026','ChatGPT Uses','Freelancing Online'],US:['AI Jobs 2026','Machine Learning','React Trends','Startup Ideas','Remote Work'],IN:['AI Tools India','Python Tutorial','Digital India','App Development','Blogging Tips']};return(m[geo]||m.US).map((k,i)=>({keyword:k,traffic:`${(5-i)*20}K/day`}));}

module.exports={generateBlog,suggestTopics,improveBlog,generateSEOMeta,chat,fetchImages,fetchTrending};
