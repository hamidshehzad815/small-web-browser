import { describe, expect, it } from 'vitest';
import { sanitizeSiteHtml } from './sanitize.js';

// Whatever goes in, these must never come out. This is the contract the viewer's CSP is a backstop for.
function assertContained(output: string) {
  const forbiddenTags =
    /<\s*(script|iframe|frame|img|svg|math|form|input|button|textarea|select|meta|base|link|object|embed|style|video|audio|source|template|noscript|title)\b/i;
  expect(output, 'forbidden tag').not.toMatch(forbiddenTags);
  expect(output, 'event handler').not.toMatch(/<[^>]*\son[a-z]+\s*=/i);
  expect(output, 'dangerous scheme in a tag').not.toMatch(/<[^>]*(javascript|vbscript|data)\s*:/i);
  expect(output, 'css escape hatch').not.toMatch(
    /<[^>]*(url\s*\(|@import|expression\s*\(|position\s*:)/i,
  );
  expect(output, 'id attribute').not.toMatch(/<[^>]*\sid\s*=/i);
  expect(output, 'srcdoc').not.toMatch(/srcdoc/i);
  for (const match of output.matchAll(/\shref="([^"]*)"/g)) {
    expect(match[1], 'every href must be the inert "#"').toBe('#');
  }
}

describe('sanitizeSiteHtml: hostile payloads', () => {
  const payloads: [string, string][] = [
    ['script tag', '<script>alert(1)</script><p>hi</p>'],
    ['script with src', '<script src="https://evil/x.js"></script>'],
    ['img onerror', '<img src=x onerror=alert(1)>'],
    ['svg onload', '<svg onload=alert(1)><circle/></svg>'],
    [
      'math/mglyph mXSS',
      '<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;img src=1 onerror=alert(1)&gt;">',
    ],
    ['noscript mXSS', '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
    ['javascript: link', '<a href="javascript:alert(1)">x</a>'],
    ['mixed-case javascript: link', '<a href="JaVaScRiPt:alert(1)">x</a>'],
    ['leading-space javascript: link', '<a href="  javascript:alert(1)">x</a>'],
    ['tab inside javascript: link', '<a href="java\tscript:alert(1)">x</a>'],
    ['entity-encoded javascript: link', '<a href="&#106;avascript:alert(1)">x</a>'],
    ['data: link', '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
    ['vbscript: link', '<a href="vbscript:msgbox(1)">x</a>'],
    ['http link', '<a href="http://evil.example/">x</a>'],
    ['protocol-relative link', '<a href="//evil.example/">x</a>'],
    [
      'link with attribute break-out',
      '<a href="tidepool.zz" title=\'"><script>alert(1)</script>\'>x</a>',
    ],
    ['iframe', '<iframe src="https://evil.example"></iframe>'],
    ['iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
    ['object and embed', '<object data="x"></object><embed src="x">'],
    ['video onerror', '<video src=x onerror=alert(1)></video>'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
    ['base href', '<base href="https://evil.example/"><a href="tidepool.zz">x</a>'],
    ['stylesheet link', '<link rel="stylesheet" href="//evil.example/x.css">'],
    ['form', '<form action="https://evil.example"><input name=q><button>go</button></form>'],
    [
      'style element with @import',
      '<style>@import url(https://evil.example/x.css);body{position:fixed}</style><p>t</p>',
    ],
    [
      'fixed overlay inline style',
      '<p style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:url(https://evil.example/x.png)">overlay</p>',
    ],
    [
      'javascript url in style',
      '<h1 style="color:red;background-image:url(javascript:alert(1))">x</h1>',
    ],
    ['expression() in style', '<p style="width:expression(alert(1))">x</p>'],
    ['event handler on allowed tag', '<p onclick=alert(1) onmouseover=alert(2)>x</p>'],
    ['details ontoggle', '<details open ontoggle=alert(1)><summary>s</summary></details>'],
    ['id for DOM clobbering', '<div id="addEventListener" class="x">x</div>'],
    ['textarea hiding a script', '<textarea><script>alert(1)</script></textarea>'],
    ['title element', '<title>Injected</title>'],
    ['null bytes in tag name', '<scr\u0000ipt>alert(1)</scr\u0000ipt>'],
    ['double-bracket trick', '<<script>script>alert(1)<</script>/script>'],
    ['unclosed tags', '<p><b>unclosed <i>tags'],
    ['author-supplied data-address', '<span data-address="evil.zz">x</span>'],
  ];

  it.each(payloads)('%s', (_name, payload) => {
    assertContained(sanitizeSiteHtml(payload));
  });

  it('drops script contents entirely, not just the tags', () => {
    const out = sanitizeSiteHtml('<script>alert(1)</script><p>hi</p>');
    expect(out).toBe('<p>hi</p>');
  });

  it('survives a 5,000-deep nest and a 200 KB document without throwing', () => {
    const deep = '<div>'.repeat(5000) + 'x' + '</div>'.repeat(5000);
    expect(() => sanitizeSiteHtml(deep)).not.toThrow();
    const wide = '<p>word </p>'.repeat(20_000);
    expect(sanitizeSiteHtml(wide).length).toBeGreaterThan(0);
  });
});

describe('sanitizeSiteHtml: what authors keep', () => {
  it('rewrites small-web links to an inert href plus a normalized data-address', () => {
    const out = sanitizeSiteHtml(
      '<a href="HTTP://Tidepool.ZZ/" class="c" onclick="alert(1)" data-address="evil.zz">ok</a>',
    );
    expect(out).toBe('<a href="#" data-address="tidepool.zz">ok</a>');
  });

  it('keeps links to addresses that do not exist (they become Nowhere in the browser)', () => {
    expect(sanitizeSiteHtml('<a href="lanternfish.zz">x</a>')).toBe(
      '<a href="#" data-address="lanternfish.zz">x</a>',
    );
  });

  it('turns links that are not addresses into plain text, keeping the words', () => {
    expect(sanitizeSiteHtml('<a href="http://example.com">read more</a>')).toBe(
      '<span>read more</span>',
    );
    expect(sanitizeSiteHtml('<a href="tidepool.zz/gallery">gallery</a>')).toBe(
      '<span>gallery</span>',
    );
  });

  it('keeps structure, text and the safe style subset', () => {
    const html =
      '<h1>Title</h1><p style="color: #2f5d62; text-align:center; font-size: 18px">Hello <em>there</em></p><ul><li>one</li></ul>';
    expect(sanitizeSiteHtml(html)).toBe(
      '<h1>Title</h1><p style="color:#2f5d62;text-align:center;font-size:18px">Hello <em>there</em></p><ul><li>one</li></ul>',
    );
  });

  it('escapes angle brackets in text so the output cannot be re-parsed into tags', () => {
    expect(sanitizeSiteHtml('<p>1 &lt; 2 &amp;&amp; 3 &gt; 2</p>')).toBe(
      '<p>1 &lt; 2 &amp;&amp; 3 &gt; 2</p>',
    );
  });
});
