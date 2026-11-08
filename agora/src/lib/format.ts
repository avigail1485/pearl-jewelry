export const fmtKm = (km: number) =>
  km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)} מ'` : `${km.toLocaleString("he-IL", { maximumFractionDigits: km < 10 ? 1 : 0 })} ק"מ`;

export function timeAgo(ts: number) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60_000));
  if (m < 60) return `לפני ${m} דק'`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "לפני שעה" : h === 2 ? "לפני שעתיים" : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? "אתמול" : `לפני ${d} ימים`;
}
