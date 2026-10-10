/**
 * Public URL for a service.
 * Web design is served at /web-design/. Every other service stays at /services/<id>/.
 * The collection entry is the only copy of the content.
 */
export function serviceHref(id: string): string {
  if (id === 'web-design') return '/web-design/';
  return `/services/${id}/`;
}
