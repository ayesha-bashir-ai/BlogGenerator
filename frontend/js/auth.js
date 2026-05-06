/**
 * AI Blogger — Auth Manager v2
 * Drop into every page: <script src="js/auth.js"></script>
 */
const Auth = (() => {
  const API         = window.AI_BLOGGER_API || 'http://localhost:5000/api/v1';
  const TOKEN_KEY   = 'aib_token';
  const REFRESH_KEY = 'aib_refresh';
  const USER_KEY    = 'aib_user';

  /* ── storage ── */
  const save    = (at, rt, u) => { ls(TOKEN_KEY, at); ls(REFRESH_KEY, rt); ls(USER_KEY, JSON.stringify(u)); };
  const clear   = ()          => { [TOKEN_KEY, REFRESH_KEY, USER_KEY].forEach(k => localStorage.removeItem(k)); };
  const getT    = ()          => localStorage.getItem(TOKEN_KEY);
  const getR    = ()          => localStorage.getItem(REFRESH_KEY);
  const getU    = ()          => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
  const loggedIn= ()          => !!getT() && !!getU();
  const ls      = (k, v)      => localStorage.setItem(k, v);

  /* ── fetch with timeout ── */
  function apiFetch(path, opts = {}, ms = 8000) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    const token = getT();
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token && !token.startsWith('demo.')) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API}${path}`, { ...opts, headers, signal: ctrl.signal })
      .finally(() => clearTimeout(timer));
  }

  /* ── auth actions ── */
  async function login(email, password) {
    try {
      const res  = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (data.success) { save(data.data.accessToken, data.data.refreshToken, data.data.user); return { success: true, user: data.data.user }; }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: e.name === 'AbortError' ? 'timeout' : 'offline' };
    }
  }

  async function register(name, email, password) {
    try {
      const res  = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      const data = await res.json();
      if (data.success) { save(data.data.accessToken, data.data.refreshToken, data.data.user); return { success: true, user: data.data.user }; }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: e.name === 'AbortError' ? 'timeout' : 'offline' };
    }
  }

  async function logout() {
    try { await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: getR() }) }); } catch {}
    clear();
    window.location.href = 'index.html';
  }

  /* ── demo session (no backend) ── */
  function demoLogin(name, email) {
    const user = { id: 'demo_' + Date.now(), name, email, plan: 'basic', role: 'user', blogs_generated: 0 };
    save('demo.' + btoa(JSON.stringify({ id: user.id })), 'demo_refresh', user);
    return user;
  }
  function getDemoUsers() { try { return JSON.parse(localStorage.getItem('aib_demo_users') || '[]'); } catch { return []; } }
  function saveDemoUser(u) { const list = getDemoUsers(); list.push(u); ls('aib_demo_users', JSON.stringify(list)); }

  /* ── route guards ── */
  function requireLogin(msg = '') {
    if (!loggedIn()) {
      const m = encodeURIComponent(msg || 'Please log in to access this feature.');
      const f = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?msg=${m}&from=${f}`;
      return false;
    }
    return true;
  }

  function requireGuest() {
    if (loggedIn()) {
      const p = new URLSearchParams(window.location.search).get('from');
      window.location.href = p ? decodeURIComponent(p) : 'dashboard.html';
      return false;
    }
    return true;
  }

  /* ── navbar update (landing page) ── */
  function updateNav() {
    const on   = loggedIn();
    const user = getU();
    const show = (id, val) => { const el = document.getElementById(id); if (el) el.style.display = val; };
    show('navLoginBtn',  on ? 'none' : 'inline-flex');
    show('navSignupBtn', on ? 'none' : 'inline-flex');
    show('navDashBtn',   on ? 'inline-flex' : 'none');
    show('navUserMenu',  on ? 'flex' : 'none');
    if (on && user) {
      const nm = document.getElementById('navUserName');
      const av = document.getElementById('navAvatar');
      const lo = document.getElementById('navLogoutBtn');
      if (nm) nm.textContent = user.name.split(' ')[0];
      if (av) av.textContent = user.name.charAt(0).toUpperCase();
      if (lo) lo.onclick = logout;
    }
    const banner = document.getElementById('authBanner');
    if (banner) banner.classList.toggle('show', !on);
    const heroBtn = document.getElementById('heroStartBtn');
    if (heroBtn && on) { heroBtn.textContent = 'Go to Generator →'; heroBtn.onclick = () => { window.location.href = 'generate.html'; }; }
  }

  /* ── gated click ── */
  function gatedClick(dest, msg) {
    if (loggedIn()) { window.location.href = dest; }
    else {
      const m = encodeURIComponent(msg || 'Create a free account to access this feature.');
      const f = encodeURIComponent(dest);
      window.location.href = `login.html?msg=${m}&from=${f}&tab=signup`;
    }
  }

  /* ── api helpers for dashboard ── */
  async function get(path)        { try { const r = await apiFetch(path); return await r.json(); } catch { return null; } }
  async function post(path, body) { try { const r = await apiFetch(path, { method:'POST', body: JSON.stringify(body) }); return await r.json(); } catch { return null; } }
  async function del(path)        { try { const r = await apiFetch(path, { method:'DELETE' }); return await r.json(); } catch { return null; } }
  async function patch(path, body){ try { const r = await apiFetch(path, { method:'PATCH', body: JSON.stringify(body) }); return await r.json(); } catch { return null; } }

  return { login, register, logout, demoLogin, getDemoUsers, saveDemoUser,
           isLoggedIn: loggedIn, getUser: getU, getToken: getT,
           requireLogin, requireGuest, updateNav, gatedClick,
           get, post, del, patch, apiFetch };
})();

window.Auth = Auth;
