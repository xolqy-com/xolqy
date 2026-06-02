// Source of the JS that visitors execute (served as /t.js).
// Tiny, no deps, no cookies. About ~1.5 KB minified.
//
// Lifecycle:
//   1) On script load: send `pageview` event with a freshly minted uuid → id.
//   2) Every 5s while the page is visible: send `ping` with duration so far.
//   3) On `pagehide` or `visibilitychange→hidden`: final ping via sendBeacon.
//   4) Outbound link clicks: fire-and-forget POST to /api/click.
//
// Time-on-page math:
//   We count only time when document.visibilityState === "visible".
//   When the tab is backgrounded we pause; when it's foregrounded we resume.

export const TRACKER_JS = `
(() => {
  if (typeof window === "undefined" || window.__xolqy__) return;
  window.__xolqy__ = 1;
  var endpoint = (document.currentScript && document.currentScript.dataset.endpoint) || (location.origin === "https://xolqy.com" ? "" : "https://xolqy.com");
  var site = (document.currentScript && document.currentScript.dataset.site) || location.hostname;

  // UUID v4 (no crypto.randomUUID polyfill needed in modern browsers, but be safe)
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16));
  }

  // Stable session id for this tab visit (sessionStorage scoped, no cookie)
  var session = sessionStorage.getItem("xq_s");
  if (!session) { session = uuid(); sessionStorage.setItem("xq_s", session); }

  var id = uuid();
  var startedAt = Date.now();
  var visibleMs = 0;
  var lastResume = document.visibilityState === "visible" ? startedAt : 0;
  var maxScroll = 0;

  function refScroll() {
    var h = document.documentElement;
    var b = document.body;
    var scrollTop = (h.scrollTop || b.scrollTop || 0);
    var viewport = window.innerHeight || h.clientHeight;
    var docHeight = Math.max(h.scrollHeight, b.scrollHeight, h.offsetHeight, b.offsetHeight);
    var pct = docHeight <= viewport ? 100 : Math.round(((scrollTop + viewport) / docHeight) * 100);
    if (pct > maxScroll) maxScroll = Math.min(100, pct);
  }

  function visibleNow() {
    if (lastResume) visibleMs += Date.now() - lastResume;
    lastResume = Date.now();
    return visibleMs;
  }

  function payload(type) {
    return JSON.stringify({
      t: type,
      id: id,
      site: site,
      path: location.pathname + location.search,
      session: session,
      duration_ms: visibleNow(),
      scroll_pct: maxScroll,
      ref: document.referrer || "",
      ua: navigator.userAgent,
      sw: screen.width
    });
  }

  function send(type, useBeacon) {
    var url = endpoint + "/api/event";
    var body = payload(type);
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { method: "POST", body: body, keepalive: true, headers: { "content-type": "application/json" } }).catch(()=>{});
    }
  }

  // Boot
  send("pageview", false);

  // Periodic heartbeat — every 15s while visible
  var hbTimer = null;
  function startHeartbeat() {
    if (hbTimer) return;
    hbTimer = setInterval(() => { if (document.visibilityState === "visible") send("ping", false); }, 15000);
  }
  function stopHeartbeat() {
    if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
  }
  startHeartbeat();

  // Pause/resume on visibility changes
  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "visible") {
      lastResume = Date.now();
      startHeartbeat();
    } else {
      visibleNow();
      lastResume = 0;
      stopHeartbeat();
      send("ping", true);
    }
  });

  // Scroll depth
  var scrollTimer = null;
  window.addEventListener("scroll", function() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => { refScroll(); scrollTimer = null; }, 200);
  }, { passive: true });

  // Final beacon on unload
  window.addEventListener("pagehide", function() { send("ping", true); }, { capture: true });

  // SPA support: re-fire pageview on history.pushState/replaceState
  (function() {
    var orig = history.pushState;
    history.pushState = function() {
      orig.apply(this, arguments);
      // finalize previous, start new
      send("ping", true);
      id = uuid(); startedAt = Date.now(); visibleMs = 0; lastResume = Date.now(); maxScroll = 0;
      send("pageview", false);
    };
  })();
  window.addEventListener("popstate", function() {
    send("ping", true);
    id = uuid(); startedAt = Date.now(); visibleMs = 0; lastResume = Date.now(); maxScroll = 0;
    send("pageview", false);
  });

  // Outbound link clicks
  document.addEventListener("click", function(e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.href;
    if (!href || href.indexOf("http") !== 0) return;
    try {
      var u = new URL(href);
      if (u.hostname === location.hostname) return;
      var body = JSON.stringify({ site: site, path: location.pathname, href: href });
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint + "/api/click", body);
      else fetch(endpoint + "/api/click", { method: "POST", body: body, keepalive: true });
    } catch(_) {}
  }, true);
})();
`;
