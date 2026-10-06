/** Gate for the finder: nothing loads or runs until the visitor opts in. */
const root = document.querySelector<HTMLElement>('[data-finder]');
if (root) {
  const start = root.querySelector<HTMLButtonElement>('[data-finder-start]');
  start?.addEventListener(
    'click',
    async () => {
      start.disabled = true;
      start.textContent = 'Loading…';
      const mod = await import('./finder-core');
      mod.mount(root);
    },
    { once: true },
  );
}
export {};
