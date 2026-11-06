import { sanitizeSiteHtml } from './sanitize.js';

export const MAX_HTML_LENGTH = 200_000;
export const MAX_TITLE_LENGTH = 120;

const ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/**
 * Plain text of already-sanitized HTML, for search. Safe to strip with a regex because the sanitizer
 * escapes `<` and `>` everywhere except real tag delimiters.
 */
export function htmlToText(sanitizedHtml: string): string {
  const spaced = sanitizedHtml.replace(/<[^>]*>/g, ' ');
  const decoded = spaced.replace(
    /&(?:lt|gt|quot|#39|nbsp);/g,
    (entity) => ENTITIES[entity] ?? entity,
  );
  return decoded.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

export function prepareContent(html: string): { sanitizedHtml: string; text: string } {
  const sanitizedHtml = sanitizeSiteHtml(html);
  return { sanitizedHtml, text: htmlToText(sanitizedHtml) };
}
