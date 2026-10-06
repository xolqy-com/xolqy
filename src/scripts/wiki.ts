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
  // Restore a filter carried in the hash, e.g. /wiki/#q=d1
  const m = /[#&]q=([^&]+)/.exec(location.hash);
  if (m?.[1]) {
    input.value = decodeURIComponent(m[1]);
    apply();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
else run();
