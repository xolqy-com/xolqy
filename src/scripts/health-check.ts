/**
 * Health Check page: submit a domain to /api/health-check and render the
 * grouped result. Everything is built with textContent; nothing from the
 * response is inserted as HTML.
 */
type Status = 'pass' | 'warn' | 'fail' | 'info';
interface Check { id: string; group: string; label: string; status: Status; detail: string; weight: number; guide?: string }
interface Report { ok: boolean; domain: string; score: number; grade: string; behindCloudflare: boolean; checks: Check[]; message?: string }

const form = document.querySelector<HTMLFormElement>('[data-health-form]');
const input = document.querySelector<HTMLInputElement>('#hc-domain');
const button = document.querySelector<HTMLButtonElement>('[data-health-submit]');
const status = document.querySelector<HTMLElement>('[data-health-status]');
const result = document.querySelector<HTMLElement>('[data-health-result]');

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const setStatus = (msg: string, tone: 'info' | 'error' = 'info') => {
  if (!status) return;
  status.textContent = msg;
  status.dataset.tone = tone;
};

function render(r: Report): void {
  if (!result) return;
  const q = <T extends HTMLElement>(s: string) => result.querySelector<T>(s);
  q('[data-health-grade]')!.textContent = r.grade;
  q('[data-health-score]')!.textContent = String(r.score);
  q('[data-health-grade-wrap]')!.dataset.grade = r.grade;
  q('[data-health-domain]')!.textContent = r.domain;
  const fails = r.checks.filter((c) => c.status === 'fail').length;
  const warns = r.checks.filter((c) => c.status === 'warn').length;
  q('[data-health-summary]')!.textContent =
    `${r.behindCloudflare ? 'Served through Cloudflare.' : 'Not served through Cloudflare.'} ${fails} ${fails === 1 ? 'problem' : 'problems'} and ${warns} ${warns === 1 ? 'improvement' : 'improvements'} found.`;

  const groups = q('[data-health-groups]')!;
  groups.replaceChildren();
  const order = ['Connection', 'Cloudflare', 'Headers', 'DNS and email'];
  for (const g of order) {
    const items = r.checks.filter((c) => c.group === g);
    if (!items.length) continue;
    const box = el('div', 'hc-group');
    box.appendChild(el('h3', 'h-lg', g));
    for (const c of items) {
      const row = el('div', 'hc-item');
      const dot = el('span', 'hc-dot');
      dot.dataset.s = c.status;
      dot.setAttribute('aria-hidden', 'true');
      const label = el('span', 'hc-item__label', `${c.label}${c.status === 'info' ? '' : `: ${c.status === 'pass' ? 'good' : c.status === 'warn' ? 'could be better' : 'missing'}`}`);
      row.appendChild(dot);
      row.appendChild(label);
      const detail = el('span', 'hc-item__detail', c.detail);
      if (c.guide && c.status !== 'pass' && c.guide.startsWith('/')) {
        const a = el('a', 'hc-item__guide', 'How to fix it');
        a.href = c.guide;
        detail.appendChild(document.createTextNode(' '));
        detail.appendChild(a);
      }
      row.appendChild(detail);
      box.appendChild(row);
    }
    groups.appendChild(box);
  }
  result.hidden = false;
  result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

async function run(domain: string): Promise<void> {
  if (!button) return;
  button.disabled = true;
  setStatus(`Checking ${domain}…`);
  try {
    const res = await fetch(`/api/health-check?domain=${encodeURIComponent(domain)}`, { headers: { accept: 'application/json' } });
    const data = (await res.json()) as Report;
    if (!res.ok || !data.ok) {
      setStatus(data.message ?? 'The check could not be completed.', 'error');
      return;
    }
    setStatus('');
    render(data);
    const url = new URL(location.href);
    url.searchParams.set('domain', data.domain);
    history.replaceState(null, '', url);
  } catch {
    setStatus('The check could not be completed. Please try again.', 'error');
  } finally {
    button.disabled = false;
  }
}

if (form && input) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) {
      setStatus('Enter a domain such as example.com.', 'error');
      input.focus();
      return;
    }
    void run(v);
  });
  const preset = new URLSearchParams(location.search).get('domain');
  if (preset) {
    input.value = preset;
    void run(preset);
  }
}

export {};
