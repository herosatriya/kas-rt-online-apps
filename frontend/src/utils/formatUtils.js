export function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n || 0));
}

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
