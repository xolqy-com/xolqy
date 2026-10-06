type Timeline = { ok: true; reference: string; status: string; attempts: number; hasError: boolean; timeline: { at: string; stage: string; label: string; detail: string | null }[] };
type Fail = { ok: false; error: string; message: string };

const root = document.querySelector<HTMLElement>('[data-tracer]');
if (root) {
  const form = root.querySelector<HTMLFormElement>('[data-tracer-form]')!;
  const input = root.querySelector<HTMLInputElement>('#tracer-ref')!;
  const status = root.querySelector<HTMLElement>('[data-tracer-status]')!;
  const list = root.querySelector<HTMLOListElement>('[data-tracer-timeline]')!;

  const trace = async (ref: string) => {
    status.textContent = 'Looking up…';
    list.hidden = true;
    list.innerHTML = '';
    try {
      const res = await fetch(`/api/enquiry/status?ref=${encodeURIComponent(ref)}`, { headers: { accept: 'application/json' } });
      const data = (await res.json()) as Timeline | Fail;
      if (!data.ok) {
        status.textContent = data.message;
        return;
      }
      status.textContent = `${data.reference}: current status "${data.status}"${data.hasError ? ' (a processing problem is recorded and visible to staff)' : ''}.`;
      for (const ev of data.timeline) {
        const li = document.createElement('li');
        li.className = `timeline__item${ev.stage === 'failed' || ev.stage === 'ack_failed' ? ' timeline__item--failed' : ''}`;
        const t = document.createElement('span');
        t.className = 'mono--lc faint';
        t.textContent = ev.at.replace('T', ' ').slice(0, 19) + ' UTC';
        const l = document.createElement('span');
        l.textContent = ev.label;
        const d = document.createElement('span');
        d.className = 'mono--lc muted';
        d.textContent = ev.detail ?? '';
        li.appendChild(t);
        li.appendChild(l);
        li.appendChild(d);
        list.appendChild(li);
      }
      list.hidden = false;
    } catch {
      status.textContent = 'Lookup failed. Please try again.';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ref = input.value.trim().toUpperCase();
    if (ref) void trace(ref);
  });

  const preset = new URLSearchParams(location.search).get('ref');
  if (preset) {
    input.value = preset.toUpperCase();
    void trace(preset.toUpperCase());
  }
}
export {};
