/* Session dismissal for the sale banner. No cookies. Runs from the head, before paint. */
(function () {
  var key = 'xolqy-sale-banner';
  try {
    if (sessionStorage.getItem(key) === 'closed') {
      document.documentElement.setAttribute('data-sale-banner', 'closed');
    }
  } catch (e) {}

  function bind() {
    var button = document.querySelector('[data-sale-close]');
    if (!button) return;
    button.addEventListener('click', function () {
      try {
        sessionStorage.setItem(key, 'closed');
      } catch (e) {}
      document.documentElement.setAttribute('data-sale-banner', 'closed');
      var brand = document.querySelector('.site-header__brand');
      if (brand) brand.focus({ preventScroll: true });
      window.dispatchEvent(new Event('sale-banner-closed'));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
