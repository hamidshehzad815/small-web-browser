import { describe, expect, it } from 'vitest';
import { htmlToText, prepareContent } from './content.js';

describe('htmlToText', () => {
  it('separates block elements so words do not run together', () => {
    expect(htmlToText('<p>tide</p><p>pool</p>')).toBe('tide pool');
  });

  it('decodes the entities the sanitizer emits and collapses whitespace', () => {
    expect(htmlToText('<p>1 &lt; 2 &amp;&amp;   &quot;ok&quot;</p>')).toBe('1 < 2 && "ok"');
  });

  it('does not decode &amp;lt; twice', () => {
    expect(htmlToText('<p>&amp;lt;</p>')).toBe('&lt;');
  });

  it('is not fooled by a ">" inside an attribute, because the sanitizer escapes it', () => {
    const { text } = prepareContent('<a href="tidepool.zz" title="a > b">link</a>');
    expect(text).toBe('link');
  });
});

describe('prepareContent', () => {
  it('returns searchable text with no markup and no script contents', () => {
    const { sanitizedHtml, text } = prepareContent(
      '<h1>Kelp</h1><script>secret()</script><p>Giant <b>kelp</b> grows fast</p>',
    );
    expect(sanitizedHtml).not.toContain('script');
    expect(text).toBe('Kelp Giant kelp grows fast');
  });
});
