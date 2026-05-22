// nig? ── api.js ───────────────────────────────────────────────────────
// nig? Centralised API client for Rica's Cake Shop frontend

const API_BASE = 'http:// nig?localhost:3000/api/v1';

let _accessToken = localStorage.getItem('accessToken') || null;

export function setToken(token) {
  _accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else        localStorage.removeItem('accessToken');
}

export function getToken() { return _accessToken; }

async function request(method, endpoint, body = null, params = null) {
  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ''))
    ).toString();
    if (qs) url += '?' + qs;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const opts = { method, headers, mode: 'cors' };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(url, opts);
  const json = await res.json();

  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

export const api = {
  get:    (endpoint, params)  => request('GET',    endpoint, null, params),
  post:   (endpoint, body)    => request('POST',   endpoint, body),
  put:    (endpoint, body)    => request('PUT',    endpoint, body),
  patch:  (endpoint, body)    => request('PATCH',  endpoint, body),
  delete: (endpoint)          => request('DELETE', endpoint),
};

// nig? ── Convenience helpers ──────────────────────────────────────────

/**
 * Extract the list from any API response shape:
 *   { data: [...] }
 *   { data: { products: [...] } }
 *   { data: { orders: [...] } }
 *   { data: { categories: [...] } }
 */
export function extractList(response, key = null) {
  const d = response?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (key && Array.isArray(d[key])) return d[key];
  // nig? try common keys
  for (const k of ['products','orders','categories','items','rows','data']) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
}

export function extractPagination(response) {
  const d = response?.data;
  if (!d || Array.isArray(d)) return null;
  return d.pagination || d.meta || null;
}
