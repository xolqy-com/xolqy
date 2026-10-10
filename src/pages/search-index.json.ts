/**
 * Static search index for the header. Built from published content only.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SHOP } from '@/data/shop';
import { insightHref } from '@/lib/insights';

export const prerender = true;

type Item = { title: string; kind: string; href: string; text: string };

const PAGES: Item[] = [
  { title: 'Cloudflare OS Implementation by Xolqy', kind: 'Page', href: '/cloudflare-os/', text: 'Cloudflare OS is Cloudflare’s open-source AI workspace. Xolqy implements it, and designs compute, data, security, AI and delivery in an account you own.' },
  { title: 'Services', kind: 'Page', href: '/services/', text: 'Websites, migration, performance, security, AI and managed Cloudflare.' },
  { title: 'Work', kind: 'Page', href: '/work/', text: 'Case studies and client projects.' },
  { title: 'Our stack', kind: 'Page', href: '/stack/', text: 'How this website runs on Cloudflare.' },
  { title: 'Labs', kind: 'Page', href: '/labs/', text: 'Edge inspector, solution finder, enquiry pipeline and R2 delivery.' },
  { title: 'Insights', kind: 'Page', href: '/insights/', text: 'Articles on running a business on Cloudflare.' },
  { title: 'Research', kind: 'Page', href: '/insights/research/', text: 'Long-form research. The edge cloud landscape: Cloudflare compared with hyperscalers, edge networks, app hosts and backend services.' },
  { title: 'Wiki', kind: 'Page', href: '/wiki/', text: 'Cloudflare products and terms, one at a time.' },
  { title: 'Shop', kind: 'Page', href: '/shop/', text: 'Fixed-scope packages, subscriptions and kits.' },
  { title: 'About', kind: 'Page', href: '/about/', text: 'Independent Cloudflare-focused agency.' },
  { title: 'Contact', kind: 'Page', href: '/contact/', text: 'Start a project enquiry.' },
  { title: 'Health check', kind: 'Page', href: '/health-check/', text: 'HTTPS, DNSSEC, email authentication and security headers.' },
  { title: 'Privacy', kind: 'Page', href: '/privacy/', text: 'What this site stores and why.' },
  { title: 'Security', kind: 'Page', href: '/security/', text: 'How we protect accounts, code and data.' },
];

export const GET: APIRoute = async () => {
  const items: Item[] = [...PAGES];

  const wiki = await getCollection('wiki', ({ data }) => !data.draft);
  for (const entry of wiki) {
    items.push({
      title: entry.data.term,
      kind: 'Wiki',
      href: `/wiki/${entry.id}/`,
      text: entry.data.summary,
    });
  }

  const insights = await getCollection('insights', ({ data }) => !data.draft);
  for (const post of insights) {
    items.push({
      title: post.data.title,
      kind: post.data.type === 'research' ? 'Research' : 'Insight',
      href: insightHref(post),
      text: post.data.description,
    });
  }

  const services = await getCollection('services', ({ data }) => !data.draft);
  for (const service of services) {
    items.push({
      title: service.data.title,
      kind: 'Service',
      href: `/services/${service.id}/`,
      text: service.data.summary,
    });
  }

  const work = await getCollection('work', ({ data }) => !data.draft);
  for (const study of work) {
    items.push({
      title: study.data.title,
      kind: 'Work',
      href: `/work/${study.id}/`,
      text: study.data.summary,
    });
  }

  for (const item of SHOP) {
    items.push({
      title: item.name,
      kind: 'Shop',
      href: `/shop/#${item.id}`,
      text: `${item.tagline} ${item.forWho}`,
    });
  }

  return new Response(JSON.stringify(items), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
