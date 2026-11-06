// Layer 2 of the containment: the document that goes into the sandboxed iframe's `srcdoc`.
// The iframe is `sandbox="allow-scripts"` with no `allow-same-origin`, so it gets an opaque origin:
// no cookies, no storage, no access to our DOM. This document adds a CSP so that the one script
// allowed to run is ours (matched by nonce), and nothing can load, connect, submit or frame anything.

const NONCE_PATTERN = /^[0-9a-f]{32}$/;

export function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const BASE_CSS = `
  :root { color-scheme: light; }
  html { background: #fff; }
  body { margin: 0; color: #1c1917; font: 17px/1.7 ui-serif, Georgia, 'Times New Roman', serif; }
  main { max-width: 42rem; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; overflow-wrap: anywhere; }
  h1, h2, h3, h4, h5, h6 { font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.25; margin: 1.6em 0 .5em; }
  h1 { font-size: 2rem; margin-top: 0; } h2 { font-size: 1.45rem; } h3 { font-size: 1.2rem; }
  p, ul, ol, dl, blockquote, pre, table, figure, details { margin: 0 0 1.1em; }
  ul, ol { padding-left: 1.4em; } li { margin: .25em 0; }
  a { color: #0f766e; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  a:hover { color: #115e59; }
  blockquote { border-left: 3px solid #d6d3d1; margin-left: 0; padding-left: 1em; color: #57534e; }
  code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; background: #f5f5f4; border-radius: 4px; }
  code { padding: .1em .35em; } pre { padding: 1em; overflow-x: auto; }
  table { border-collapse: collapse; } th, td { border: 1px solid #d6d3d1; padding: .4em .7em; text-align: left; }
  hr { border: 0; border-top: 1px solid #e7e5e4; margin: 2em 0; }
`;

// The only script that runs. It reports link clicks and scroll to the parent, and restores scroll.
// Author content cannot contain script (sanitized) and could not run it anyway (CSP nonce).
const bridgeScript = (nonce: string) => `
(function () {
  var NONCE = ${JSON.stringify(nonce)};
  var host = window.parent;
  function send(message) { message.nonce = NONCE; host.postMessage(message, '*'); }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var link = target.closest('a');
    if (!link) return;
    event.preventDefault();
    var address = link.getAttribute('data-address');
    if (address) send({ type: 'navigate', address: address });
  }, true);

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; send({ type: 'scroll', y: window.scrollY }); });
  }, { passive: true });

  window.addEventListener('message', function (event) {
    if (event.source !== host) return;
    var data = event.data;
    if (data && data.type === 'restore-scroll' && data.nonce === NONCE && typeof data.y === 'number') {
      window.scrollTo(0, data.y);
    }
  });

  window.addEventListener('load', function () { send({ type: 'ready' }); });
})();
`;

export function buildViewerDocument({ html, nonce }: { html: string; nonce: string }): string {
  if (!NONCE_PATTERN.test(nonce)) throw new Error('Viewer nonce must be 32 hex characters.');

  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    `script-src 'nonce-${nonce}'`,
    "base-uri 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "img-src 'none'",
    "connect-src 'none'",
    "font-src 'none'",
  ].join('; ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${BASE_CSS}</style>
</head>
<body>
<main>${html}</main>
<script nonce="${nonce}">${bridgeScript(nonce)}</script>
</body>
</html>`;
}
