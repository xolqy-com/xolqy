/**
 * Enquiry form enhancement: inline validation, lazy Turnstile, fetch submit
 * with accessible loading/error/success states. The form also works as a
 * plain HTML POST when this script does not run.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    onTurnstileReady?: () => void;
  }
}

type ApiError = { ok: false; error: string; message: string; errors?: Record<string, string> };
type ApiOk = { ok: true; reference: string; trackUrl: string };

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileReady&render=explicit';
let turnstileLoading: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileLoading) return turnstileLoading;
  turnstileLoading = new Promise<void>((resolve, reject) => {
    window.onTurnstileReady = () => resolve();
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error('turnstile-load-failed'));
    document.head.appendChild(s);
  });
  return turnstileLoading;
}

function setup(form: HTMLFormElement): void {
  const siteKey = form.dataset.sitekey ?? '';
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const holder = form.querySelector<HTMLElement>('[data-turnstile]')!;
  const done = form.querySelector<HTMLElement>('[data-done]')!;
  const brief = form.querySelector<HTMLTextAreaElement>('textarea[name="brief"]')!;
  const counter = form.querySelector<HTMLElement>('[data-counter]');
  const interest = form.querySelector('[data-interest]') as HTMLSelectElement | null;

  let token = '';
  let widgetId: string | undefined;
  let busy = false;

  // Preselect the service from ?interest=
  const wanted = new URLSearchParams(location.search).get('interest');
  if (wanted && interest && Array.from(interest.options).some((o) => o.value === wanted)) interest.value = wanted;

  // Arriving from the shop: start the brief with the package name.
  const pkg = (new URLSearchParams(location.search).get('package') ?? '').replace(/[^\p{L}\p{N} &+.,()-]/gu, '').slice(0, 80);
  if (pkg && !brief.value) brief.value = `Package: ${pkg}\n\nWebsite and what we need: `;

  // Live character count for the brief
  const updateCounter = () => {
    if (!counter) return;
    const n = brief.value.length;
    counter.textContent = n === 0 ? 'Required, 40 to 2000 characters' : `${n} / 2000 characters${n < 40 ? ` (${40 - n} more needed)` : ''}`;
  };
  brief.addEventListener('input', updateCounter);

  const setStatus = (msg: string, tone: 'info' | 'error' = 'info') => {
    status.textContent = msg;
    status.dataset.tone = tone;
  };

  const showErrors = (errors: Record<string, string>) => {
    let first: HTMLElement | null = null;
    for (const [field, msg] of Object.entries(errors)) {
      const el = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
      const input = form.elements.namedItem(field) as HTMLElement | null;
      if (el) {
        el.textContent = msg;
        el.hidden = false;
        el.id ||= `${form.id}-${field}-error`;
      }
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        if (el) input.setAttribute('aria-describedby', el.id);
        first ??= input;
      }
    }
    first?.focus();
  };

  const clearErrors = () => {
    form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((el) => {
      el.hidden = true;
      el.textContent = '';
    });
    form.querySelectorAll<HTMLElement>('[aria-invalid]').forEach((el) => {
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const v = (name: string) => ((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '').trim();
    if (v('name').length < 2) errors.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) errors.email = 'Please enter a valid email address.';
    const site = v('website');
    if (site && !/^https?:\/\/[^\s]+\.[^\s]{2,}$/i.test(site)) errors.website = 'Please enter a full URL starting with https://';
    if (!v('service')) errors.service = 'Please choose the service you are interested in.';
    const b = v('brief');
    if (b.length < 40) errors.brief = 'Please write at least 40 characters so we can respond usefully.';
    if (b.length > 2000) errors.brief = 'Please keep the brief under 2000 characters.';
    return errors;
  };

  // Turnstile: load when the form is near the viewport or first focused.
  const mountTurnstile = async () => {
    if (widgetId !== undefined || !siteKey) return;
    try {
      await loadTurnstile();
    } catch {
      setStatus('Verification could not load. Check your connection or content blockers and try again.', 'error');
      return;
    }
    const theme = form.closest<HTMLElement>('[data-theme]')?.dataset.theme === 'light' ? 'light' : 'dark';
    widgetId = window.turnstile!.render(holder, {
      sitekey: siteKey,
      action: 'enquiry',
      theme,
      appearance: 'always',
      callback: (t: string) => {
        token = t;
        if (status.dataset.tone !== 'error') setStatus('');
      },
      'expired-callback': () => {
        token = '';
      },
      'error-callback': () => {
        token = '';
        setStatus('Verification failed. Please retry.', 'error');
      },
    });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        void mountTurnstile();
      }
    }, { rootMargin: '200px' });
    io.observe(form);
  } else {
    void mountTurnstile();
  }
  form.addEventListener('focusin', () => void mountTurnstile(), { once: true });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    clearErrors();
    const errors = validate();
    if (Object.keys(errors).length) {
      showErrors(errors);
      setStatus('Please correct the highlighted fields.', 'error');
      return;
    }
    if (!siteKey) {
      setStatus('This form cannot be sent: verification is not configured on this build.', 'error');
      return;
    }
    if (!token) {
      await mountTurnstile();
      setStatus('Waiting for verification to complete, then press Send again.', 'info');
      return;
    }

    busy = true;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submitLabel.textContent = 'Sending';
    setStatus('Sending your enquiry.');

    const fd = new FormData(form);
    const payload: Record<string, string> = {};
    fd.forEach((value, key) => {
      if (typeof value === 'string') payload[key] = value;
    });
    payload['cf-turnstile-response'] = token;

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as ApiOk | ApiError | null;
      if (res.ok && data && data.ok) {
        form.dataset.state = 'done';
        form.querySelector<HTMLElement>('[data-ref]')!.textContent = data.reference;
        const link = form.querySelector<HTMLAnchorElement>('[data-track-link]');
        if (link) link.href = data.trackUrl;
        done.hidden = false;
        done.focus();
        setStatus('');
        return;
      }
      token = '';
      if (widgetId !== undefined) window.turnstile?.reset(widgetId);
      if (data && !data.ok) {
        if (data.errors) showErrors(data.errors);
        setStatus(data.message || 'The enquiry could not be sent.', 'error');
      } else {
        setStatus(`The enquiry could not be sent (HTTP ${res.status}). Please try again.`, 'error');
      }
    } catch {
      token = '';
      if (widgetId !== undefined) window.turnstile?.reset(widgetId);
      setStatus('Network error. Your text is still here; please try again.', 'error');
    } finally {
      busy = false;
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submitLabel.textContent = 'Send enquiry';
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-enquiry]').forEach(setup);

export {};
