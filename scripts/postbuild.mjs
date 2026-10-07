// After `astro build`: serve the sitemap index at /sitemap.xml as well, because
// that is the address people (and some tools) type by habit. The canonical
// address stays /sitemap-index.xml, which robots.txt points at.
import { copyFileSync, existsSync } from 'node:fs';

const src = 'dist/client/sitemap-index.xml';
if (existsSync(src)) {
  copyFileSync(src, 'dist/client/sitemap.xml');
  console.log('postbuild: /sitemap.xml aliases /sitemap-index.xml');
} else {
  console.warn('postbuild: sitemap-index.xml not found, alias skipped');
}
