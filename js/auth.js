// ── auth.js ──────────────────────────────────────────────────────
import { api, setToken, getToken } from './api.js';
import { toast } from './ui.js';

let _user = null;

export function getUser() { return _user; }

export function loadStoredAuth() {
  const token = localStorage.getItem('accessToken');
  const raw   = localStorage.getItem('user');
  if (token && raw) {
    try {
      _user = JSON.parse(raw);
      setToken(token);
      return true;
    } catch { clearAuth(); }
  }
  return false;
}

function saveAuth(token, user) {
  _user = user;
  setToken(token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  _user = null;
  setToken(null);
  localStorage.removeItem('user');
}

export async function login(email, password) {
  const res  = await api.post('/auth/login', { email, password });
  const data = res.data || res;
  saveAuth(data.accessToken, data.user);
  return data.user;
}

export async function register(name, email, password) {
  const res  = await api.post('/auth/register', { name, email, password });
  const data = res.data || res;
  saveAuth(data.accessToken, data.user);
  return data.user;
}

export async function logout() {
  if (getToken()) {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
  }
  clearAuth();
  toast('Signed out', 'info');
}

// ── Auth Modal ───────────────────────────────────────────────────
let _onAuthChange = null;
export function onAuthChange(fn) { _onAuthChange = fn; }
function fireAuthChange() { if (_onAuthChange) _onAuthChange(_user); }

export function initAuth() {
  const overlay   = document.getElementById('authModal');
  const title     = document.getElementById('authTitle');
  const sub       = document.getElementById('authSub');
  const nameWrap  = document.getElementById('nameGroup');
  const emailEl   = document.getElementById('authEmail');
  const passEl    = document.getElementById('authPassword');
  const nameEl    = document.getElementById('authName');
  const submitBtn = document.getElementById('authSubmit');
  const toggleEl  = document.getElementById('authToggleLink');
  const errEl     = document.getElementById('authErr');

  let mode = 'login';

  function setMode(m) {
    mode = m;
    const isLogin = m === 'login';
    title.textContent     = isLogin ? 'Welcome back' : 'Join the sweetness';
    sub.textContent       = isLogin ? 'Sign in to your account' : 'Create a free account';
    submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
    toggleEl.textContent  = isLogin ? 'Create an account' : 'Sign in instead';
    nameWrap.style.display = isLogin ? 'none' : 'block';
    errEl.classList.remove('show');
    errEl.textContent = '';
  }

  function openModal(m = 'login') {
    setMode(m);
    overlay.classList.add('show');
    (m === 'register' ? nameEl : emailEl).focus();
  }

  function closeModal() {
    overlay.classList.remove('show');
    emailEl.value = ''; passEl.value = ''; nameEl.value = '';
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  toggleEl.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
  document.getElementById('authClose')?.addEventListener('click', closeModal);

  passEl.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });

  submitBtn.addEventListener('click', async () => {
    const email    = emailEl.value.trim();
    const password = passEl.value.trim();
    const name     = nameEl.value.trim();

    errEl.classList.remove('show');
    if (!email || !password) { showErr('Please fill in all fields.'); return; }
    if (mode === 'register' && !name) { showErr('Please enter your name.'); return; }

    submitBtn.disabled   = true;
    submitBtn.textContent = '…';

    try {
      const user = mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);

      closeModal();
      toast(`Welcome, ${user.name.split(' ')[0]}! 🎂`, 'success');
      fireAuthChange();
    } catch (err) {
      showErr(err.message || 'Something went wrong.');
    } finally {
      submitBtn.disabled = false;
      setMode(mode);
    }
  });

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.classList.add('show');
  }

  // Expose
  window._openAuthModal = openModal;
}
