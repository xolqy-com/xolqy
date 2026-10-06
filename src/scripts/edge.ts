type EdgeResponse = {
  ok: boolean;
  servedBy: { colo: string | null; city: string | null; region: string | null; country: string | null; continent: string | null; timezone: string | null };
  connection: { httpProtocol: string | null; tlsVersion: string | null; tlsCipher: string | null; asn: number | null; asOrganization: string | null };
  rayId: string | null;
  local: boolean;
};

const root = document.querySelector<HTMLElement>('[data-edge]');
if (root) {
  const button = root.querySelector<HTMLButtonElement>('[data-edge-run]')!;
  const status = root.querySelector<HTMLElement>('[data-edge-status]')!;
  const result = root.querySelector<HTMLElement>('[data-edge-result]')!;
  const set = (f: string, v: string) => {
    const el = root.querySelector<HTMLElement>(`[data-f="${f}"]`);
    if (el) el.textContent = v;
  };

  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = 'Requesting…';
    const t0 = performance.now();
    try {
      const res = await fetch('/api/edge', { cache: 'no-store', headers: { accept: 'application/json' } });
      const t1 = performance.now();
      const data = (await res.json()) as EdgeResponse;
      const place = [data.servedBy.city, data.servedBy.country].filter(Boolean).join(', ');
      set('servedBy', data.local ? 'Local development (no Cloudflare metadata)' : `${data.servedBy.colo ?? '?'}${place ? ` (${place})` : ''}`);
      set('httpProtocol', data.connection.httpProtocol ?? 'n/a');
      set('tls', [data.connection.tlsVersion, data.connection.tlsCipher].filter(Boolean).join(' · ') || 'n/a');
      set('asn', data.connection.asn ? `AS${data.connection.asn} ${data.connection.asOrganization ?? ''}`.trim() : 'n/a');
      set('rayId', data.rayId ?? 'n/a');
      set('rtt', `${Math.round(t1 - t0)} ms (browser-measured, includes your network)`);
      result.hidden = false;
      status.textContent = `Answered at ${new Date().toLocaleTimeString()}.`;
    } catch {
      status.textContent = 'The request failed. Check your connection and try again.';
    } finally {
      button.disabled = false;
    }
  });
}
export {};
