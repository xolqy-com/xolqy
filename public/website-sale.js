/* Reveal the regular website price once the pre-Black Friday sale has ended.
   No cookies. Runs from the head, before paint, so a page built during the
   sale does not keep a struck-through $700 on screen after the deadline.

   Must match src/data/website-sale.ts:
   END 2026-11-27T00:00:00+02:00, sale display $700 (70000 cents),
   regular display $1,200 (120000 cents). */
(function () {
  var END = Date.parse('2026-11-27T00:00:00+02:00');
  var SALE_DISPLAY = '$700';
  var REGULAR_DISPLAY = '$1,200';
  if (!Number.isFinite(END) || Date.now() < END) return;
  document.documentElement.setAttribute('data-website-sale', 'ended');
  document.documentElement.setAttribute('data-website-sale-display', SALE_DISPLAY);
  document.documentElement.setAttribute('data-website-regular-display', REGULAR_DISPLAY);
})();
