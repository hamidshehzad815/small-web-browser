import { describe, expect, it } from 'vitest';
import { buildViewerDocument, newNonce } from './viewer-doc';

const NONCE = '0123456789abcdef0123456789abcdef';

describe('newNonce', () => {
  it('is 32 hex characters and different every time', () => {
    const a = newNonce();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(newNonce()).not.toBe(a);
  });
});

describe('buildViewerDocument', () => {
  const doc = buildViewerDocument({ html: '<h1>Hello</h1>', nonce: NONCE });

  it('puts the page inside <main>', () => {
    expect(doc).toContain('<main><h1>Hello</h1></main>');
  });

  it('declares a CSP that shuts everything but our nonce’d script and inline styles', () => {
    const csp = /Content-Security-Policy" content="([^"]+)"/.exec(doc)?.[1] ?? '';
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain(`script-src 'nonce-${NONCE}'`);
    expect(csp).not.toMatch(/script-src[^;]*unsafe/);
    for (const locked of [
      'base-uri',
      'form-action',
      'frame-src',
      'img-src',
      'connect-src',
      'font-src',
    ]) {
      expect(csp).toContain(`${locked} 'none'`);
    }
  });

  it('puts the CSP before any script or content', () => {
    expect(doc.indexOf('Content-Security-Policy')).toBeLessThan(doc.indexOf('<main>'));
    expect(doc.indexOf('Content-Security-Policy')).toBeLessThan(doc.indexOf('<script'));
  });

  it('contains exactly one script, carrying the nonce, and it identifies itself by that nonce', () => {
    expect(doc.match(/<script/g)).toHaveLength(1);
    expect(doc).toContain(`<script nonce="${NONCE}">`);
    expect(doc).toContain(`var NONCE = "${NONCE}"`);
  });

  it('only talks to the parent window and ignores messages from anywhere else', () => {
    expect(doc).toContain('event.source !== host');
    expect(doc).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|document\.cookie|eval\(/);
  });

  it.each(['', 'short', 'XYZ'.repeat(11), '0123456789abcdef0123456789abcde"', `${NONCE}0`])(
    'refuses a malformed nonce (%j)',
    (nonce) => {
      expect(() => buildViewerDocument({ html: '', nonce })).toThrow();
    },
  );
});
