/**
 * Header and mobile-menu search. The index is fetched once from
 * /search-index.json. Voice input uses the browser speech API and is never
 * sent to this site. No cookies.
 */

type Entry = { title: string; kind: string; href: string; text: string };

interface SpeechAlt {
  readonly transcript: string;
}
interface SpeechHit {
  readonly isFinal: boolean;
  readonly 0: SpeechAlt;
}
interface SpeechRec extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((ev: { results: ArrayLike<SpeechHit> }) => void) | null;
}

const SpeechAPI = (window as Window & {
  SpeechRecognition?: new () => SpeechRec;
  webkitSpeechRecognition?: new () => SpeechRec;
}).SpeechRecognition ?? (window as Window & { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;

let index: Entry[] | null = null;
let loading: Promise<Entry[]> | null = null;
let activeRec: SpeechRec | null = null;

function loadIndex(): Promise<Entry[]> {
  if (index) return Promise.resolve(index);
  if (!loading) {
    loading = fetch('/search-index.json')
      .then((res) => {
        if (!res.ok) throw new Error('search index');
        return res.json() as Promise<Entry[]>;
      })
      .then((data) => {
        index = data;
        return data;
      });
  }
  return loading;
}

function rank(entries: Entry[], query: string): Entry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const scored: { entry: Entry; score: number }[] = [];
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const text = entry.text.toLowerCase();
    let score = 0;
    let ok = true;
    for (const term of terms) {
      if (title.includes(term)) score += 5;
      else if (text.includes(term)) score += 1;
      else ok = false;
    }
    if (ok && score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return scored.slice(0, 8).map((s) => s.entry);
}

function setup(form: HTMLFormElement): void {
  const input = form.querySelector<HTMLInputElement>('input[type="search"]');
  const list = form.querySelector<HTMLElement>('[data-results]');
  const status = form.querySelector<HTMLElement>('[data-search-status]');
  const mic = form.querySelector<HTMLButtonElement>('[data-speech]');
  if (!input || !list || !status) return;

  let active = -1;
  let matches: Entry[] = [];

  const setStatus = (text: string) => {
    status.textContent = text;
  };

  const close = () => {
    list.hidden = true;
    list.replaceChildren();
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
    matches = [];
  };

  const paint = (next: Entry[], query: string) => {
    matches = next;
    active = next.length > 0 ? 0 : -1;
    list.replaceChildren();
    if (query.trim() === '') {
      close();
      setStatus('');
      return;
    }
    if (next.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'site-search__empty';
      empty.textContent = 'No matches';
      list.appendChild(empty);
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      setStatus('No matches');
      return;
    }
    next.forEach((entry, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      const link = document.createElement('a');
      link.href = entry.href;
      link.id = `${input.id}-opt-${i}`;
      link.setAttribute('role', 'option');
      link.setAttribute('aria-selected', i === active ? 'true' : 'false');
      const kind = document.createElement('span');
      kind.className = 'site-search__kind';
      kind.textContent = entry.kind;
      const title = document.createElement('span');
      title.className = 'site-search__title';
      title.textContent = entry.title;
      link.appendChild(kind);
      link.appendChild(title);
      li.appendChild(link);
      list.appendChild(li);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    const current = list.querySelector<HTMLAnchorElement>('[aria-selected="true"]');
    if (current) input.setAttribute('aria-activedescendant', current.id);
    setStatus(`${next.length} ${next.length === 1 ? 'result' : 'results'}`);
  };

  const select = (indexToSelect: number) => {
    const links = list.querySelectorAll<HTMLAnchorElement>('a[role="option"]');
    links.forEach((link, i) => link.setAttribute('aria-selected', i === indexToSelect ? 'true' : 'false'));
    active = indexToSelect;
    const current = links[indexToSelect];
    if (current) input.setAttribute('aria-activedescendant', current.id);
  };

  const run = () => {
    const query = input.value;
    if (query.trim() === '') {
      close();
      setStatus('');
      return;
    }
    loadIndex()
      .then((entries) => {
        if (input.value !== query) return;
        paint(rank(entries, query), query);
      })
      .catch(() => {
        setStatus('Search is unavailable');
      });
  };

  input.addEventListener('input', run);
  input.addEventListener('focus', () => {
    void loadIndex();
    if (input.value.trim()) run();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && matches.length > 0) {
      event.preventDefault();
      select((active + 1) % matches.length);
    } else if (event.key === 'ArrowUp' && matches.length > 0) {
      event.preventDefault();
      select((active - 1 + matches.length) % matches.length);
    } else if (event.key === 'Escape') {
      close();
      activeRec?.stop();
    } else if (event.key === 'Enter' && matches.length > 0 && active >= 0) {
      event.preventDefault();
      const href = matches[active]?.href;
      if (href) location.href = href;
    }
  });

  form.addEventListener('submit', (event) => {
    if (matches.length > 0) {
      event.preventDefault();
      const href = matches[Math.max(active, 0)]?.href;
      if (href) location.href = href;
    }
  });

  document.addEventListener('click', (event) => {
    if (!form.contains(event.target as Node)) close();
  });

  if (!mic) return;
  if (!SpeechAPI) {
    mic.hidden = true;
    return;
  }
  const rec = new SpeechAPI();
  rec.lang = navigator.language || 'en-GB';
  rec.interimResults = true;
  rec.continuous = false;
  mic.addEventListener('click', () => {
    if (mic.getAttribute('aria-pressed') === 'true') {
      rec.stop();
      return;
    }
    activeRec?.stop();
    activeRec = rec;
    try {
      rec.start();
    } catch {
      mic.setAttribute('aria-pressed', 'false');
    }
  });
  rec.onstart = () => {
    mic.setAttribute('aria-pressed', 'true');
    mic.setAttribute('aria-label', 'Stop voice search');
    setStatus('Listening');
  };
  rec.onend = () => {
    mic.setAttribute('aria-pressed', 'false');
    mic.setAttribute('aria-label', 'Search by voice');
    if (activeRec === rec) activeRec = null;
  };
  rec.onerror = () => {
    mic.setAttribute('aria-pressed', 'false');
    mic.setAttribute('aria-label', 'Search by voice');
    setStatus('Voice search is unavailable');
  };
  rec.onresult = (event) => {
    const said = Array.from(event.results)
      .map((hit) => hit[0].transcript)
      .join(' ')
      .trim();
    input.value = said;
    run();
  };
}

function boot(): void {
  document.querySelectorAll<HTMLFormElement>('[data-site-search]').forEach(setup);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
