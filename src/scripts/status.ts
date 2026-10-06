/**
 * Stack page: replace declared statuses with the live state from /api/status.
 * Purely additive; the declared badges remain if the request fails.
 */
type Entry = { state: 'active' | 'awaiting' | 'planned' | 'fallback'; detail: string };
type Report = { ok: boolean; checkedAt: string; environment: string; status: Record<string, Entry> };

const LABELS: Record<string, string> = {
  active: 'Active',
  awaiting: 'Awaiting configuration',
  planned: 'Planned',
  fallback: 'Fallback',
};

async function run(): Promise<void> {
  const note = document.querySelector<HTMLElement>('[data-live-note]');
  const explorer = document.querySelector<HTMLElement>('[data-live="true"]');
  if (!explorer) return;
  try {
    const res = await fetch('/api/status', { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const report = (await res.json()) as Report;
    const counts = { active: 0, awaiting: 0, planned: 0 };

    explorer.querySelectorAll<HTMLElement>('[data-stack-id]').forEach((item) => {
      const check = item.dataset.check;
      const badge = item.querySelector<HTMLElement>('.badge[data-status]');
      if (!badge) return;
      const entry = check ? report.status[check] : undefined;
      if (entry) {
        badge.dataset.status = entry.state;
        badge.textContent = LABELS[entry.state] ?? entry.state;
        badge.title = entry.detail;
        let detail = item.querySelector<HTMLElement>('[data-live-detail]');
        if (!detail) {
          detail = document.createElement('p');
          detail.className = 'mono--lc faint';
          detail.dataset.liveDetail = '';
          item.appendChild(detail);
        }
        detail.textContent = `Live check: ${entry.detail}`;
      }
      const s = badge.dataset.status as keyof typeof counts;
      if (s in counts) counts[s] += 1;
    });

    const summary = document.querySelector<HTMLElement>('[data-stack-summary]');
    if (summary) {
      summary.innerHTML = '';
      for (const [k, v] of Object.entries(counts)) {
        const li = document.createElement('li');
        li.className = 'badge';
        li.dataset.status = k;
        li.textContent = `${v} ${k === 'awaiting' ? 'awaiting configuration' : k}`;
        summary.appendChild(li);
      }
    }
    if (note) {
      const t = new Date(report.checkedAt);
      note.textContent = `Verified live at ${t.toUTCString().replace(' GMT', ' UTC')} (${report.environment}).`;
    }
  } catch {
    if (note) note.textContent = 'Live verification unavailable right now; showing declared statuses.';
  }
}

void run();
export {};
