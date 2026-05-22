// ── main.js ──────────────────────────────────────────────────────
import { initAuth, onAuthChange, getUser, logout } from './auth.js';
import { loadCart, openCart, closeCart, placeOrder } from './cart.js';
import { initProducts, bindSearch } from './products.js';
import { initNavbarScroll } from './ui.js';

// ── Nav: auth button ─────────────────────────────────────────────
function updateAuthBtn() {
  const user = getUser();
  const btn  = document.getElementById('authNavBtn');
  if (!btn) return;

  if (user) {
    const first = user.name?.split(' ')[0] || 'You';
    btn.innerHTML = `👤 ${first}${user.role === 'admin' ? ' <small style="background:var(--coral-light);color:#fff;padding:2px 8px;border-radius:99px;font-size:.65rem">admin</small>' : ''}`;
    btn.onclick = async () => { await logout(); updateAuthBtn(); };
  } else {
    btn.innerHTML = 'Sign In';
    btn.onclick   = () => window._openAuthModal?.('login');
  }
}

// ── Cart sidebar wiring ──────────────────────────────────────────
function initCartUI() {
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('checkoutBtn')?.addEventListener('click', placeOrder);
}

// ── Hero CTA ─────────────────────────────────────────────────────
function initHero() {
  document.getElementById('exploreBtn')?.addEventListener('click', () => {
    document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ── Boot ─────────────────────────────────────────────────────────
async function boot() {
  initNavbarScroll();
  initAuth();
  initCartUI();
  initHero();
  bindSearch();

  // Auth state
  const { loadStoredAuth } = await import('./auth.js');
  loadStoredAuth();
  updateAuthBtn();
  onAuthChange(() => updateAuthBtn());

  // Cart
  loadCart();

  // Products
  await initProducts();
}

boot();
