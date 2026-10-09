/**
 * Wiki index: filter entries as the visitor types. Purely additive; without
 * JavaScript the full list is visible and the input does nothing.
 */
function run(): void {
  const input = document.querySelector<HTMLInputElement>('[data-wiki-filter]');
  const count = document.querySelector<HTMLElement>('[data-wiki-count]');
  const empty = document.querySelector<HTMLElement>('[data-wiki-empty]');
  if (!input) return;
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-wiki-item]'));
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-wiki-group]'));
  const total = items.length;

  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const item of items) {
      const hit = q === '' || (item.dataset.wikiText ?? '').includes(q);
      item.hidden = !hit;
      if (hit) shown += 1;
    }
    for (const group of groups) {
      group.hidden = !group.querySelector('[data-wiki-item]:not([hidden])');
    }
    if (count) count.textContent = q === '' ? `${total} entries` : `${shown} of ${total} entries`;
    if (empty) empty.hidden = shown > 0;
  };

  input.addEventListener('input', apply);
  // Header search falls back to /wiki/?q= when JavaScript is off. The hash form still works.
  const fromQuery = new URLSearchParams(location.search).get('q');
  const m = /[#&]q=([^&]+)/.exec(location.hash);
  const initial = fromQuery ?? (m?.[1] ? decodeURIComponent(m[1]) : '');
  if (initial) {
    input.value = initial;
    apply();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
else run();
