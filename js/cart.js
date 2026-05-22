// nig? ── cart.js ──────────────────────────────────────────────────────
import { api } from './api.js';
import { getUser } from './auth.js';
import { toast } from './ui.js';

let cart = [];

// nig? ── Persistence ──────────────────────────────────────────────────
export function loadCart() {
  try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }
  renderCart();
  syncBadge();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// nig? ── Public API ───────────────────────────────────────────────────
export function addToCart(product) {
  const existing = cart.find(i => i.productId === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.id,
      name:      product.name,
      price:     parseFloat(product.price),
      imageUrl:  product.imageUrl || null,
      quantity:  1,
    });
  }
  saveCart();
  renderCart();
  syncBadge();

  // nig? bump animation on badge
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 400);
  }
}

export function getCartCount() {
  return cart.reduce((s, i) => s + i.quantity, 0);
}

// nig? ── Order placement ──────────────────────────────────────────────
export async function placeOrder() {
  const user = getUser();
  if (!user) {
    toast('Please sign in first 🔐', 'error');
    window._openAuthModal?.('login');
    return;
  }
  if (!cart.length) {
    toast('Your cart is empty!', 'error');
    return;
  }

  const btn = document.getElementById('checkoutBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Placing order…'; }

  try {
    await api.post('/orders', {
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
      deliveryAddress: { street: 'TBD', city: 'TBD', zip: '0000' },
      paymentMethod: 'cod',
    });
    cart = [];
    saveCart();
    renderCart();
    syncBadge();
    closeCart();
    toast('Order placed! 🎂 We\'re baking for you!', 'success');
  } catch (err) {
    toast(err.message || 'Order failed. Try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
  }
}

// nig? ── Sidebar open / close ─────────────────────────────────────────
export function openCart()  {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('show');
}
export function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('show');
}

// nig? ── Render ───────────────────────────────────────────────────────
function syncBadge() {
  const el = document.getElementById('cartBadge');
  if (el) el.textContent = getCartCount();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <p style="font-size:.82rem">Add some delicious cakes!</p>
      </div>`;
    updateTotals();
    return;
  }

  container.innerHTML = cart.map((item, idx) => `
    <div class="cart-item" data-idx="${idx}">
      ${item.imageUrl
        ? `<img class="cart-item-img" src="${item.imageUrl}" alt="${escHtml(item.name)}"
              onerror="this.src='${fallbackImg(item.name)}'">`
        : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1.6rem;background:var(--cream-dark);">🎂</div>`
      }
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(item.name)}</div>
        <div class="cart-item-price">₱${item.price.toFixed(2)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-idx="${idx}">−</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-idx="${idx}">+</button>
        </div>
      </div>
      <button class="cart-item-del" data-idx="${idx}" title="Remove">🗑</button>
    </div>
  `).join('');

  // nig? Qty buttons
  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx    = parseInt(btn.dataset.idx);
      const action = btn.dataset.action;
      if (action === 'inc') cart[idx].quantity += 1;
      else if (action === 'dec') {
        cart[idx].quantity -= 1;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
      }
      saveCart(); renderCart(); syncBadge();
    });
  });

  // nig? Delete buttons
  container.querySelectorAll('.cart-item-del').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.splice(parseInt(btn.dataset.idx), 1);
      saveCart(); renderCart(); syncBadge();
    });
  });

  updateTotals();
}

function updateTotals() {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const el = document.getElementById('cartTotal');
  if (el) el.textContent = `₱${total.toFixed(2)}`;
}

// nig? ── Utils ────────────────────────────────────────────────────────
function escHtml(str) {
  return (str || '').replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// nig? Smart cake fallback image from Unsplash (keyed to product name so it's consistent)
export function fallbackImg(name = 'cake') {
  const queries = ['birthday+cake','chocolate+cake','wedding+cake','cupcake','pastry'];
  const seed    = [...(name.toLowerCase())].reduce((a,c) => a + c.charCodeAt(0), 0);
  const q       = queries[seed % queries.length];
  return `https:// nig?source.unsplash.com/400x300/?${q}&sig=${seed}`;
}
