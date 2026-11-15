const KEY = 'bormassiv-v1';
let persisted;
try { persisted = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { persisted = {}; }
export const state = {
  cart: Array.isArray(persisted.cart) ? persisted.cart.filter(x => Number.isInteger(x.productId) && x.qty > 0 && x.qty <= 99 && Number.isFinite(x.price) && x.price >= 0).slice(0, 100) : [],
  favorites: Array.isArray(persisted.favorites) ? persisted.favorites.filter(Number.isInteger) : [],
};
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* The cart continues to work without persistence. */ }
  window.dispatchEvent(new CustomEvent('storechange'));
}
export function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(x => x !== id) : [...state.favorites, id];
  save();
}
export function addItem(product, variant, attributes, qty) {
  const key = `${product.id}:${variant?.id || 0}:${JSON.stringify(attributes)}`;
  const item = state.cart.find(i => i.key === key);
  if (item) item.qty = Math.min(99, item.qty + qty);
  else state.cart.push({ key, productId: product.id, variantId: variant?.id || null, attributes, price: variant?.price ?? product.minPrice, estimated: Boolean(product.priceOnRequest && !variant), qty, image: variant?.image || product.image });
  save();
}
export const cartCount = () => state.cart.reduce((sum, x) => sum + x.qty, 0);
export const cartTotal = () => state.cart.reduce((sum, x) => sum + x.qty * x.price, 0);
export const money = n => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
