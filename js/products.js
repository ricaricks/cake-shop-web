// nig? ── products.js ──────────────────────────────────────────────────
import { api, extractList } from './api.js';
import { addToCart }        from './cart.js';
import { escHtml, smartImg, getFallbackImg, toast } from './ui.js';

let allProducts  = [];
let categories   = [];
let activeFilter = 'all';

// nig? ── Bootstrap ────────────────────────────────────────────────────
export async function initProducts() {
  renderSkeleton();
  await Promise.all([loadCategories(), loadProducts()]);
}

// nig? ── Loaders ──────────────────────────────────────────────────────
async function loadCategories() {
  try {
    const res  = await api.get('/categories');
    categories = extractList(res, 'categories');
    renderFilters();
  } catch { /* non-fatal */ }
}

async function loadProducts(search = '') {
  renderSkeleton();
  try {
    const params = { limit: 100 };
    if (search) params.search = search;

    const res = await api.get('/products', params);
    // nig? extractList handles all response shapes
    allProducts = extractList(res, 'products');
    renderProducts();
  } catch (err) {
    renderError(err.message);
  }
}

// nig? ── Render: filter chips ─────────────────────────────────────────
function renderFilters() {
  const bar = document.getElementById('filterBar');
  if (!bar) return;

  const chips = [{ id: 'all', name: 'All Cakes' }, ...categories];
  bar.innerHTML = chips.map(c => `
    <button class="chip ${c.id === 'all' ? 'active' : ''}"
            data-id="${c.id}">${escHtml(c.name)}</button>
  `).join('');

  bar.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.id;
      bar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
  });
}

// nig? ── Render: product grid ─────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let list = allProducts;

  // nig? filter by category
  if (activeFilter !== 'all') {
    list = list.filter(p => {
      const cat = p.category || p.Category || {};
      return String(cat.id) === String(activeFilter) ||
             String(p.categoryId) === String(activeFilter);
    });
  }

  // nig? filter inactive
  list = list.filter(p => p.isActive !== false);

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎂</div>
        <h3 style="font-family:var(--font-display)">No cakes here yet</h3>
        <p style="color:var(--muted);margin-top:8px">Check back soon!</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(prod => productCard(prod)).join('');

  // nig? Add-to-cart listeners
  grid.querySelectorAll('.btn-atc').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id   = parseInt(btn.dataset.id);
      const prod = allProducts.find(p => p.id === id);
      if (prod) {
        addToCart(prod);
        toast(`${prod.name} added to cart 🛒`, 'success');
      }
    });
  });
}

// nig? ── Card template ────────────────────────────────────────────────
function productCard(p) {
  const catName  = (p.category || p.Category || {}).name || '';
  const price    = parseFloat(p.price || 0);
  const imgSrc   = p.imageUrl || '';
  const fallback = getFallbackImg(p.name);

  const imgHtml = imgSrc
    ? smartImg(imgSrc, p.name, 'product-img')
    : `<div class="product-img-placeholder">🎂</div>`;

  return `
  <article class="product-card" data-id="${p.id}">
    <div class="product-img-wrap">
      ${imgHtml}
      ${p.isFeatured ? '<span class="badge-featured">✦ Featured</span>' : ''}
    </div>
    <div class="product-body">
      ${catName ? `<div class="product-category">${escHtml(catName)}</div>` : ''}
      <div class="product-name">${escHtml(p.name)}</div>
      <div class="product-price">
        ₱${price.toFixed(2)}
        ${p.stock === 0 ? '<small>Out of stock</small>' : ''}
      </div>
      <button class="btn-atc btn" data-id="${p.id}"
        ${p.stock === 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
        <span>🛒</span> Add to Cart
      </button>
    </div>
  </article>`;
}

// nig? ── Skeleton / Error states ───────────────────────────────────────
function renderSkeleton() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading delicious cakes…</span>
    </div>`;
}

function renderError(msg = '') {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="error-state">
      <h3>Couldn't load cakes 😔</h3>
      <p>Make sure your backend is running at <code>localhost:3000</code></p>
      ${msg ? `<p style="margin-top:8px;font-size:.8rem;color:var(--coral)">${escHtml(msg)}</p>` : ''}
      <button class="btn btn-ghost" style="margin-top:16px" onclick="location.reload()">Try Again</button>
    </div>`;
}

// nig? ── Search binding ───────────────────────────────────────────────
export function bindSearch() {
  const input = document.getElementById('searchInput');
  const btn   = document.getElementById('searchBtn');
  if (!input) return;

  const run = () => loadProducts(input.value.trim());
  btn?.addEventListener('click', run);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
}
