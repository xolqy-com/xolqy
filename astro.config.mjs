// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// Marketing pages are prerendered at build time and served as static assets by
// the Worker. Routes that need the runtime (API endpoints, the staff view) opt
// out with `export const prerender = false`.
export default defineConfig({
  site: 'https://xolqy.com',
  trailingSlash: 'ignore',
  output: 'static',
  adapter: cloudflare({
    // Raster media (the case-study screenshots in src/assets/work) is served
    // through Cloudflare Images: every <Image> becomes a /cdn-cgi/image/ URL and
    // the edge produces each width and format on request, so the repository
    // keeps one master per picture. Requires "Transformations" enabled for the
    // zone (Images > Transformations). During `astro dev` the originals are
    // served untouched.
    imageService: 'cloudflare',
    // Workers AI and Vectorize have no local simulation. By default they are
    // local stubs (the finder falls back to its rule-based mode). Run
    // `CF_REMOTE_BINDINGS=true npm run dev` after `wrangler login` to use the
    // real services during development.
    remoteBindings: process.env.CF_REMOTE_BINDINGS === 'true',
  }),
  // No cookie sessions: the AI finder keeps its bounded state in a Durable
  // Object and enquiries live in D1. Disabling sessions also avoids the
  // adapter auto-provisioning a SESSION KV namespace.
  session: false,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/contact/received') && !page.includes('/shop/thanks') && !page.includes('search-index'),
    }),
  ],
  build: {
    inlineStylesheets: 'never',
    format: 'directory',
  },
  // The Content-Security-Policy (public/_headers) allows no inline scripts, so
  // every script, however small, must be emitted as a file.
  vite: {
    build: { assetsInlineLimit: 0 },
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  env: {
    schema: {
      // Build-time, public. Set in `.env` locally or as a build variable in the
      // Cloudflare dashboard (Workers Builds). Test sitekeys are documented in README.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      // Cloudflare Web Analytics beacon token (Analytics & Logs > Web Analytics).
      PUBLIC_CF_BEACON_TOKEN: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
