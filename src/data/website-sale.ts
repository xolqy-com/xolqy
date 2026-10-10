/**
 * Pre-Black Friday price for the website package (`web-design-starter`).
 *
 * The sale is active while `now < END`. At and after END the regular price
 * applies. Checkout (request time) and the prerendered pages import this
 * module so the deadline and the two amounts are not copied in three places.
 *
 * `public/website-sale.js` cannot import this file. It duplicates
 * `WEBSITE_SALE_END_ISO`, `WEBSITE_SALE_DISPLAY` and `WEBSITE_REGULAR_DISPLAY`
 * and must stay identical.
 */
export const WEBSITE_ITEM_ID = 'web-design-starter';

/** Black Friday 2026, 00:00 in Athens (UTC+2). */
export const WEBSITE_SALE_END_ISO = '2026-11-27T00:00:00+02:00';
export const WEBSITE_SALE_END = Date.parse(WEBSITE_SALE_END_ISO);

/** Charged at and after END. USD cents. */
export const WEBSITE_REGULAR_CENTS = 120000;
/** Charged while `now < END`. USD cents. */
export const WEBSITE_SALE_CENTS = 70000;

function usd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** "$1,200". Must match the client script. */
export const WEBSITE_REGULAR_DISPLAY = usd(WEBSITE_REGULAR_CENTS);
/** "$700". Must match the client script. */
export const WEBSITE_SALE_DISPLAY = usd(WEBSITE_SALE_CENTS);

export function websiteSaleActive(now = Date.now()): boolean {
  return Number.isFinite(WEBSITE_SALE_END) && now < WEBSITE_SALE_END;
}

/** Stripe `unit_amount` for `web-design-starter`, in USD cents. */
export function websiteChargeCents(now = Date.now()): number {
  return websiteSaleActive(now) ? WEBSITE_SALE_CENTS : WEBSITE_REGULAR_CENTS;
}
