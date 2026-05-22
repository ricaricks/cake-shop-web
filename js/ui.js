// ── ui.js ────────────────────────────────────────────────────────
// Shared UI helpers: toast, escHtml, image fallback

// ── Toast ────────────────────────────────────────────────────────
const toastIcons = { success: '✓', error: '✕', info: 'ℹ' };

export function toast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${toastIcons[type] || '•'}</span> ${escHtml(message)}`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = '.3s';
    setTimeout(() => el.remove(), 320);
  }, duration);
}

// ── escHtml ──────────────────────────────────────────────────────
export function escHtml(str) {
  return (str || '').replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// ── Smart image fallback ─────────────────────────────────────────
// Picks a consistent Unsplash cake photo based on product name hash
const FALLBACK_QUERIES = [
  'birthday+cake+bakery',
  'chocolate+layer+cake',
  'wedding+cake+elegant',
  'cupcake+frosting',
  'strawberry+cake',
  'vanilla+cake+slice',
];

export function getFallbackImg(productName = '') {
  const seed = [...productName.toLowerCase()].reduce((a, c) => a + c.charCodeAt(0), 0);
  const q    = FALLBACK_QUERIES[seed % FALLBACK_QUERIES.length];
  // Use picsum for reliable random images keyed by seed
  return `https://picsum.photos/seed/${seed + 100}/400/300`;
}

// Attach onerror to any <img> that should fallback
export function smartImg(src, productName, cssClass = '', style = '') {
  const fallback = getFallbackImg(productName);
  const safeSrc  = src || fallback;
  return `<img
    src="${escHtml(safeSrc)}"
    alt="${escHtml(productName)}"
    class="${cssClass}"
    ${style ? `style="${style}"` : ''}
    loading="lazy"
    onerror="if(this.dataset.tried){this.style.display='none'}else{this.dataset.tried=1;this.src='${fallback}'}"
  >`;
}

// ── Navbar scroll shadow ─────────────────────────────────────────
export function initNavbarScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const handler = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', handler, { passive: true });
  handler();
}
