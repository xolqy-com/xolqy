import type { CollectionEntry } from 'astro:content';

/** Public path for an insight. Research lives under /insights/research/. */
export function insightHref(entry: Pick<CollectionEntry<'insights'>, 'id' | 'data'>): string {
  return entry.data.type === 'research' ? `/insights/research/${entry.id}/` : `/insights/${entry.id}/`;
}
