/**
 * Live countdown to Black Friday 2026, 00:00 in Athens (UTC+2).
 * No cookies, storage or network calls. The deadline is also written in the banner HTML.
 */
const END = Date.parse('2026-11-27T00:00:00+02:00');
const node = document.querySelector<HTMLElement>('[data-sale-countdown]');
if (node && Number.isFinite(END)) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const render = () => {
    const left = END - Date.now();
    if (left <= 0) {
      node.textContent = 'Ended';
      return true;
    }
    const total = Math.floor(left / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    node.textContent = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    return false;
  };
  if (!render()) {
    const timer = window.setInterval(() => {
      if (render()) window.clearInterval(timer);
    }, 1000);
  }
}
