import { parseAddress } from '@small-web/shared';
import sanitizeHtml from 'sanitize-html';

// Layer 1 of the containment in docs: an allowlist, applied when a site is published. Anything not
// listed here is dropped. Layer 2 (sandboxed iframe + CSP) assumes this layer can fail.

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'em',
  'strong',
  'i',
  'b',
  'u',
  's',
  'small',
  'sub',
  'sup',
  'mark',
  'abbr',
  'cite',
  'q',
  'time',
  'br',
  'hr',
  'dl',
  'dt',
  'dd',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'div',
  'span',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'main',
  'figure',
  'figcaption',
  'details',
  'summary',
]; // no script/style/img/svg/iframe/form/meta/link/base/object/embed/media

// Content of these is dropped entirely, not just the tags.
const NON_TEXT_TAGS = ['script', 'style', 'textarea', 'option', 'title', 'noscript', 'template'];

const COLOR = [
  /^#[0-9a-f]{3,8}$/i,
  /^[a-z]{3,20}$/i,
  /^rgba?\([\d\s,.%]+\)$/i,
  /^hsla?\([\d\s,.%]+\)$/i,
];
const LENGTH = [/^(?:-?\d+(?:\.\d+)?(?:px|em|rem|%|ch)?\s*){1,4}$/];

// `id` is deliberately not allowed: ids can clobber window/document properties (DOM clobbering).
const ALLOWED_ATTRIBUTES = {
  a: ['href', 'data-address', 'title'],
  th: ['colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
  '*': ['class', 'title', 'lang', 'style'],
};

// Inline styles only, from a short list, with value patterns that cannot express url() or @import.
const ALLOWED_STYLES = {
  '*': {
    color: COLOR,
    'background-color': COLOR,
    'text-align': [/^(?:left|right|center|justify)$/],
    'font-size': LENGTH,
    'font-weight': [/^(?:normal|bold|[1-9]00)$/],
    'font-style': [/^(?:normal|italic)$/],
    'text-decoration': [/^(?:none|underline|line-through)$/],
    'line-height': LENGTH,
    margin: LENGTH,
    padding: LENGTH,
    border: [/^[a-z0-9\s#.%-]+$/i],
  },
};

export function sanitizeSiteHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    nonTextTags: NON_TEXT_TAGS,
    transformTags: {
      // The only links that survive point at a small-web address. The browser reads `data-address`;
      // `href` is a dead "#". Anything else (http:, javascript:, paths, ...) becomes inert text.
      // Attributes are rebuilt from scratch, so an author cannot smuggle in their own data-address.
      a: (_tagName, attribs) => {
        const parsed = typeof attribs.href === 'string' ? parseAddress(attribs.href) : null;
        if (!parsed || !parsed.ok) return { tagName: 'span', attribs: {} };
        const rebuilt: Record<string, string> = { href: '#', 'data-address': parsed.address };
        if (attribs.title) rebuilt.title = attribs.title;
        return { tagName: 'a', attribs: rebuilt };
      },
    },
  });
}
