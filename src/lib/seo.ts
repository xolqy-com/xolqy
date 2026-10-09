import { SITE } from '@/data/site';

/** Absolute canonical URL on https://xolqy.com with a trailing slash for pages. */
export function canonical(pathname: string): string {
  const url = new URL(pathname, SITE.url);
  if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname += '/';
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function absolute(path: string): string {
  return new URL(path, SITE.url).toString();
}

export interface Crumb {
  name: string;
  href: string;
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: {
      '@type': 'ImageObject',
      url: absolute('/og/logo.png'),
      width: 512,
      height: 512,
    },
    description: SITE.description,
    slogan: SITE.tagline,
    knowsAbout: ['Cloudflare', 'Cloudflare Workers', 'Cloudflare OS', 'Edge computing', 'Web performance', 'Zero Trust', 'Cloudflare migration'],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: `${SITE.url}/`,
    name: SITE.name,
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'en',
  };
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: canonical(c.href),
    })),
  };
}

export function serviceJsonLd(input: { name: string; description: string; path: string; serviceType: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    url: canonical(input.path),
    provider: { '@id': `${SITE.url}/#organization` },
    areaServed: 'Worldwide',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: canonical('/contact/'),
    },
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: Date;
  updatedAt?: Date;
  image: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: canonical(input.path),
    mainEntityOfPage: canonical(input.path),
    datePublished: input.publishedAt.toISOString(),
    dateModified: (input.updatedAt ?? input.publishedAt).toISOString(),
    image: absolute(input.image),
    author: { '@id': `${SITE.url}/#organization` },
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'en',
  };
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** A wiki entry as a schema.org DefinedTerm inside the site's DefinedTermSet. */
export function definedTermJsonLd(input: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${canonical(input.path)}#term`,
    name: input.name,
    description: input.description,
    url: canonical(input.path),
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `${canonical('/wiki/')}#set`,
      name: 'Xolqy Cloudflare wiki',
      url: canonical('/wiki/'),
    },
  };
}

/** The wiki index as a DefinedTermSet listing every published term. */
export function definedTermSetJsonLd(terms: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${canonical('/wiki/')}#set`,
    name: 'Xolqy Cloudflare wiki',
    description: 'Short, factual entries on Cloudflare products and the terms around them, each linked to the services and articles where it matters.',
    url: canonical('/wiki/'),
    hasDefinedTerm: terms.map((t) => ({ '@type': 'DefinedTerm', name: t.name, url: canonical(t.path) })),
  };
}
