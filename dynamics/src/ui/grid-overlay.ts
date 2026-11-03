/** ?grid=1 מציג שכבת רשת של 12 עמודות ויחידת 8px. */
export function mountGridOverlay() {
  if (new URLSearchParams(location.search).get('grid') !== '1') return;
  const el = document.createElement('div');
  el.className = 'grid-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="grid">${'<span></span>'.repeat(12)}</div>`;
  document.body.append(el);
}
