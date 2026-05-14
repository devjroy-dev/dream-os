// src/lib/format.js — number formatting utilities

function formatRs(n) {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const groups = [];
  let i = rest.length;
  while (i > 0) {
    groups.unshift(rest.slice(Math.max(0, i - 2), i));
    i -= 2;
  }
  return groups.join(',') + ',' + last3;
}

function formatPercent(part, whole) {
  if (!whole) return null;
  return `${Math.round((part / whole) * 100)}%`;
}

module.exports = { formatRs, formatPercent };
