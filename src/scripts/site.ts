/**
 * Site-wide behaviour, kept deliberately small. Everything here is progressive
 * enhancement: the page is complete without it.
 */

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Scroll reveals ------------------------------------------------------- */
function setupReveals(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (items.length === 0 || reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  // Mark elements already in the viewport before enabling the hidden state, so
  // above-the-fold content never flashes.
  const vh = window.innerHeight;
  const pending: HTMLElement[] = [];
  for (const el of items) {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.92) el.classList.add('in');
    else pending.push(el);
  }
  root.classList.add('js');
  if (pending.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  pending.forEach((el) => io.observe(el));
}

/* ---- Mobile menu ------------------------------------------------------------ */
function setupMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  if (!toggle || !menu) return;

  const open = () => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  };
  const close = (refocus = true) => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (refocus) toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => (menu.hidden ? open() : close()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) close();
  });
  // Keep focus inside the panel while it is open.
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || menu.hidden) return;
    const focusables = menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  window.matchMedia('(min-width: 60em)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) close(false);
  });
}

/* ---- Accessible tabs (stack explorer) -------------------------------------- */
function setupTabs(): void {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((group) => {
    const tabs = Array.from(group.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = Array.from(group.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    if (tabs.length === 0) return;
    group.classList.add('tabs-ready');

    const activate = (idx: number, focus = false) => {
      tabs.forEach((t, i) => {
        const on = i === idx;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach((p, i) => {
        p.hidden = i !== idx;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(i));
      t.addEventListener('keydown', (e) => {
        const n = tabs.length;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); activate((i + 1) % n, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); activate((i - 1 + n) % n, true); }
        if (e.key === 'Home') { e.preventDefault(); activate(0, true); }
        if (e.key === 'End') { e.preventDefault(); activate(n - 1, true); }
      });
    });
    const initial = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    activate(initial >= 0 ? initial : 0);
  });
}

/* ---- Pause decorative SVG animation while off-screen ------------------------ */
function setupAnimationPausing(): void {
  const nets = document.querySelectorAll<SVGElement>('svg.net');
  if (nets.length === 0 || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.target as SVGElement).classList.toggle('net--paused', !e.isIntersecting);
  });
  nets.forEach((n) => io.observe(n));
}

/* ---- Wide markdown tables scroll inside their own box ------------------------ */
function wrapTables(): void {
  document.querySelectorAll<HTMLTableElement>('.prose table').forEach((table) => {
    if (table.parentElement?.classList.contains('table-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });
}

setupReveals();
setupMenu();
setupTabs();
setupAnimationPausing();
wrapTables();
