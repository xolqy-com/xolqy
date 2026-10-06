/** Solution finder UI, loaded on demand after the visitor opts in. */
type ServiceLink = { slug: string; title: string; url: string };
type Ok = { ok: true; sessionId: string; turnsLeft: number; answer: string; services: ServiceLink[]; mode: 'ai' | 'rules'; model?: string; note?: string; sources: { title: string; section: string; url: string }[] };
type Fail = { ok: false; error: string; message: string; sessionId?: string; turnsLeft?: number };

export function mount(root: HTMLElement): void {
  const gate = root.querySelector<HTMLElement>('[data-finder-gate]')!;
  const ui = root.querySelector<HTMLElement>('[data-finder-ui]')!;
  const log = root.querySelector<HTMLOListElement>('[data-finder-log]')!;
  const form = root.querySelector<HTMLFormElement>('[data-finder-form]')!;
  const input = root.querySelector<HTMLTextAreaElement>('#finder-input')!;
  const send = root.querySelector<HTMLButtonElement>('[data-finder-send]')!;
  const meta = root.querySelector<HTMLElement>('[data-finder-meta]')!;
  const status = root.querySelector<HTMLElement>('[data-finder-status]')!;

  let sessionId: string | undefined;
  let busy = false;

  gate.hidden = true;
  ui.hidden = false;
  input.focus();

  const add = (role: 'you' | 'finder', text: string, extra?: { services?: ServiceLink[]; mode?: string; model?: string; note?: string }) => {
    const li = document.createElement('li');
    li.className = `finder__msg finder__msg--${role}`;
    const who = document.createElement('p');
    who.className = 'mono faint';
    who.textContent = role === 'you' ? 'You' : extra?.mode === 'rules' ? 'Finder (keyword match, not AI)' : `Finder (grounded AI${extra?.model ? `, ${extra.model.split('/').pop()}` : ''})`;
    const body = document.createElement('p');
    body.textContent = text;
    li.appendChild(who);
    li.appendChild(body);
    if (extra?.note) {
      const n = document.createElement('p');
      n.className = 'mono--lc faint';
      n.textContent = extra.note;
      li.appendChild(n);
    }
    if (extra?.services?.length) {
      const ul = document.createElement('ul');
      ul.className = 'list-reset cluster';
      for (const s of extra.services) {
        const a = document.createElement('a');
        a.className = 'badge';
        a.dataset.status = 'active';
        a.href = s.url;
        a.textContent = s.title;
        const item = document.createElement('li');
        item.appendChild(a);
        ul.appendChild(item);
      }
      li.appendChild(ul);
    }
    log.appendChild(li);
    li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message || busy) return;
    busy = true;
    send.disabled = true;
    send.setAttribute('aria-busy', 'true');
    status.textContent = 'Thinking…';
    add('you', message);
    input.value = '';
    try {
      const res = await fetch('/api/finder', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });
      const data = (await res.json()) as Ok | Fail;
      if (data.ok) {
        sessionId = data.sessionId;
        add('finder', data.answer, { services: data.services, mode: data.mode, model: data.model, note: data.note });
        meta.textContent = `${data.turnsLeft} turn${data.turnsLeft === 1 ? '' : 's'} left in this session.`;
        status.textContent = '';
        if (data.turnsLeft <= 0) {
          input.disabled = true;
          send.disabled = true;
          status.textContent = 'Session limit reached. Reload the page for a new session, or send the enquiry form.';
          return;
        }
      } else {
        if (data.sessionId) sessionId = data.sessionId;
        status.textContent = data.message;
        input.value = message;
      }
    } catch {
      status.textContent = 'Network error. Please try again.';
      input.value = message;
    } finally {
      busy = false;
      if (!input.disabled) send.disabled = false;
      send.removeAttribute('aria-busy');
    }
  });
}
