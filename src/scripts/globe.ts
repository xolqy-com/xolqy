/**
 * Homepage globe: a dotted, slowly turning Earth drawn on a <canvas>.
 *
 * - Land dots come from /globe/land-dots.bin (Int16 pairs: lat*100, lon*100),
 *   generated once by scripts/build-globe.mjs. Loaded only when the section
 *   approaches the viewport.
 * - When the section is visible the page calls /api/edge once, finds the
 *   Cloudflare location that answered, and centres a live pin on it.
 * - Arcs leaving the live pin are illustrative: Workers code is deployed to
 *   every location, the arcs do not represent real traffic.
 * - Respects prefers-reduced-motion (one static frame), pauses when hidden
 *   or off-screen, caps device pixel ratio at 2.
 */
import { COLOS, COLO_BY_CODE, type Colo } from './globe-colos';

type EdgeResponse = { servedBy?: { colo?: string | null }; local?: boolean };

const root = document.querySelector<HTMLElement>('[data-globe]');
if (root) init(root);

function init(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-globe-canvas]')!;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D2R = Math.PI / 180;

  const css = getComputedStyle(root);
  const FG = css.getPropertyValue('--fg').trim() || '#f5f5f0';
  const ACCENT = css.getPropertyValue('--accent').trim() || '#ff5a1f';
  const MONO = css.getPropertyValue('--font-mono').trim() || 'monospace';

  // ---- State ---------------------------------------------------------------
  let dots: { sinLat: Float32Array; cosLat: Float32Array; lon: Float32Array } | null = null;
  let lon0 = 20 * D2R; // centre longitude (Europe until /api/edge answers)
  let lat0 = 22 * D2R; // tilt
  let targetLon: number | null = null;
  let live: Colo | null = null;
  let w = 0, h = 0, dpr = 1, R = 0, cx = 0, cy = 0;
  let visible = false, running = false, last = 0, raf = 0;
  let dragging = false, dragX = 0, velocity = 0;

  type Arc = { a: Colo; b: Colo; born: number; dur: number };
  const arcs: Arc[] = [];
  let nextArc = 0;

  // ---- Geometry ------------------------------------------------------------
  // Orthographic projection around (lat0, lon0). Returns screen x, y and depth z (>0 is front).
  function project(sinLat: number, cosLat: number, lon: number, lift = 1) {
    const dl = lon - lon0;
    const cosDl = Math.cos(dl);
    const x = cosLat * Math.sin(dl);
    const y = Math.cos(lat0) * sinLat - Math.sin(lat0) * cosLat * cosDl;
    const z = Math.sin(lat0) * sinLat + Math.cos(lat0) * cosLat * cosDl;
    return { x: cx + R * lift * x, y: cy - R * lift * y, z, r2: lift * lift * (x * x + y * y) };
  }
  const toVec = (lat: number, lon: number) => [Math.cos(lat * D2R) * Math.cos(lon * D2R), Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R)];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(rect.width * dpr));
    h = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = w;
    canvas.height = h;
    R = Math.min(w * 0.46, h * 0.62);
    cx = w / 2;
    cy = R * 1.06; // the lower part of the globe falls below the fold and fades out (CSS mask)
    if (!running) draw(performance.now());
  }

  // ---- Drawing -------------------------------------------------------------
  function draw(now: number) {
    ctx!.clearRect(0, 0, w, h);

    // Sphere body and rim
    const g = ctx!.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, 'rgba(255,255,255,0.045)');
    g.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx!.fillStyle = g;
    ctx!.beginPath();
    ctx!.arc(cx, cy, R, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.strokeStyle = FG;
    ctx!.globalAlpha = 0.14;
    ctx!.lineWidth = dpr;
    ctx!.stroke();

    // Land dots, batched into alpha bands so fillStyle changes rarely
    if (dots) {
      ctx!.fillStyle = FG;
      const s = 1.6 * dpr;
      const bands = [
        { min: -0.45, max: 0, a: 0.08 },
        { min: 0, max: 0.35, a: 0.3 },
        { min: 0.35, max: 0.7, a: 0.55 },
        { min: 0.7, max: 1.01, a: 0.78 },
      ];
      const n = dots.lon.length;
      const xs = new Float32Array(n), ys = new Float32Array(n), zs = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const p = project(dots.sinLat[i]!, dots.cosLat[i]!, dots.lon[i]!);
        xs[i] = p.x; ys[i] = p.y; zs[i] = p.z;
      }
      for (const b of bands) {
        ctx!.globalAlpha = b.a;
        for (let i = 0; i < n; i++) {
          const z = zs[i]!;
          if (z >= b.min && z < b.max) ctx!.fillRect(xs[i]! - s / 2, ys[i]! - s / 2, s, s);
        }
      }
    }

    // Network locations (subset), front side only
    ctx!.fillStyle = ACCENT;
    for (const c of COLOS) {
      const p = project(Math.sin(c[2] * D2R), Math.cos(c[2] * D2R), c[3] * D2R);
      if (p.z <= 0.05) continue;
      ctx!.globalAlpha = 0.35 + 0.55 * p.z;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, 1.9 * dpr, 0, Math.PI * 2);
      ctx!.fill();
    }

    // Arcs
    ctx!.strokeStyle = ACCENT;
    ctx!.lineCap = 'round';
    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i]!;
      const t = reduceMotion ? 1 : (now - arc.born) / arc.dur;
      if (t > 1.6) { arcs.splice(i, 1); continue; }
      const head = Math.min(1, t);
      const fade = t > 1 ? 1 - (t - 1) / 0.6 : 1;
      drawArc(arc.a, arc.b, head, fade);
    }

    // Live pin
    if (live) {
      const p = project(Math.sin(live[2] * D2R), Math.cos(live[2] * D2R), live[3] * D2R);
      if (p.z > 0) {
        const pulse = reduceMotion ? 0.5 : (now % 2200) / 2200;
        ctx!.globalAlpha = (1 - pulse) * 0.7;
        ctx!.strokeStyle = ACCENT;
        ctx!.lineWidth = 1.5 * dpr;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, (6 + pulse * 22) * dpr, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = ACCENT;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 5 * dpr, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.font = `500 ${12 * dpr}px ${MONO}`;
        ctx!.fillStyle = FG;
        ctx!.fillText(`${live[0]} · ${live[1]}`, p.x + 12 * dpr, p.y - 10 * dpr);
      }
    }
    ctx!.globalAlpha = 1;
  }

  function drawArc(a: Colo, b: Colo, head: number, fade: number) {
    const va = toVec(a[2], a[3]), vb = toVec(b[2], b[3]);
    const [a0, a1, a2] = va as [number, number, number], [b0, b1, b2] = vb as [number, number, number];
    const dot = Math.max(-1, Math.min(1, a0 * b0 + a1 * b1 + a2 * b2));
    const omega = Math.acos(dot);
    if (omega < 0.01) return;
    const sinO = Math.sin(omega);
    const steps = 40;
    const height = 0.06 + 0.22 * (omega / Math.PI);
    ctx!.lineWidth = 1.4 * dpr;
    ctx!.globalAlpha = 0.75 * fade;
    ctx!.beginPath();
    let pen = false;
    for (let k = 0; k <= steps; k++) {
      const t = (k / steps) * head;
      const fa = Math.sin((1 - t) * omega) / sinO, fb = Math.sin(t * omega) / sinO;
      const x = fa * a0 + fb * b0, y = fa * a1 + fb * b1, z = fa * a2 + fb * b2;
      const lat = Math.asin(z), lon = Math.atan2(y, x);
      const p = project(Math.sin(lat), Math.cos(lat), lon, 1 + height * Math.sin(Math.PI * t));
      const shown = p.z > 0 || p.r2 > 1; // in front, or lifted beyond the rim
      if (shown) { pen ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y); pen = true; } else pen = false;
    }
    ctx!.stroke();
  }

  function spawnArc(now: number) {
    const pickColo = () => COLOS[Math.floor(Math.random() * COLOS.length)]!;
    const from = live ?? pickColo();
    // Prefer destinations on the visible side so the arc reads clearly
    for (let tries = 0; tries < 12; tries++) {
      const to = pickColo();
      if (to === from) continue;
      const p = project(Math.sin(to[2] * D2R), Math.cos(to[2] * D2R), to[3] * D2R);
      if (p.z > 0.15 || tries === 11) { arcs.push({ a: from, b: to, born: now, dur: 1500 + Math.random() * 900 }); return; }
    }
  }

  // ---- Loop ----------------------------------------------------------------
  function frame(now: number) {
    const dt = Math.min(64, now - (last || now));
    last = now;
    if (!dragging) {
      if (targetLon !== null) {
        let d = targetLon - lon0;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        lon0 += d * Math.min(1, dt / 600);
        if (Math.abs(d) < 0.002) targetLon = null;
      } else {
        lon0 += velocity * dt + 0.0000700 * dt; // gentle eastward spin
        velocity *= 0.94;
      }
    }
    if (now > nextArc && arcs.length < 6) { spawnArc(now); nextArc = now + 700 + Math.random() * 900; }
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true; last = 0; raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // ---- Data ----------------------------------------------------------------
  async function loadDots() {
    try {
      const res = await fetch('/globe/land-dots.bin');
      if (!res.ok) return;
      const raw = new Int16Array(await res.arrayBuffer());
      const n = raw.length / 2;
      const sinLat = new Float32Array(n), cosLat = new Float32Array(n), lon = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const la = (raw[i * 2]! / 100) * D2R;
        sinLat[i] = Math.sin(la); cosLat[i] = Math.cos(la); lon[i] = (raw[i * 2 + 1]! / 100) * D2R;
      }
      dots = { sinLat, cosLat, lon };
      root.dataset.globeReady = '';
      if (!running) draw(performance.now());
    } catch { /* the section still reads fine without the dots */ }
  }

  const setText = (k: string, v: string) => { const el = root.querySelector(`[data-globe-f="${k}"]`); if (el) el.textContent = v; };
  async function locate() {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/edge', { cache: 'no-store', headers: { accept: 'application/json' } });
      const rtt = Math.round(performance.now() - t0);
      const data = (await res.json()) as EdgeResponse;
      const code = data.servedBy?.colo ?? null;
      if (data.local || !code) {
        setText('colo', 'Local development');
        setText('rtt', `${rtt} ms`);
        return;
      }
      const colo = COLO_BY_CODE.get(code) ?? null;
      setText('colo', colo ? `${code} · ${colo[1]}` : code);
      setText('rtt', `${rtt} ms`);
      if (colo) {
        live = colo;
        targetLon = colo[3] * D2R;
        lat0 = Math.max(-35, Math.min(45, colo[2] * 0.7)) * D2R;
        if (reduceMotion) {
          lon0 = targetLon; targetLon = null;
          for (let i = 0; i < 4; i++) spawnArc(0);
          draw(performance.now());
        }
      }
    } catch {
      setText('colo', 'Unavailable');
      setText('rtt', 'n/a');
    }
  }

  // ---- Wiring --------------------------------------------------------------
  let loaded = false;
  const near = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && !loaded) { loaded = true; loadDots(); locate(); near.disconnect(); }
  }, { rootMargin: '400px 0px' });
  near.observe(root);

  const onScreen = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    visible ? start() : stop();
  });
  onScreen.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new ResizeObserver(resize).observe(canvas);

  // Horizontal drag to spin (vertical page scroll stays native: touch-action: pan-y)
  canvas.addEventListener('pointerdown', (e) => { dragging = true; dragX = e.clientX; velocity = 0; targetLon = null; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragX; dragX = e.clientX;
    const d = -(dx * dpr) / R;
    lon0 += d; velocity = d / 16;
    if (!running) draw(performance.now());
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  resize();
}

export {};
