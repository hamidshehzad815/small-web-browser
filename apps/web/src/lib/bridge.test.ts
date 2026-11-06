import { describe, expect, it } from 'vitest';
import { parseBridgeMessage } from './bridge';

const NONCE = 'abc123';
const parse = (data: unknown) => parseBridgeMessage(data, NONCE);

describe('parseBridgeMessage', () => {
  it('accepts well-formed messages from the current document', () => {
    expect(parse({ type: 'ready', nonce: NONCE })).toEqual({ type: 'ready' });
    expect(parse({ type: 'scroll', y: 120, nonce: NONCE })).toEqual({ type: 'scroll', y: 120 });
    expect(parse({ type: 'navigate', address: 'tidepool.zz', nonce: NONCE })).toEqual({
      type: 'navigate',
      address: 'tidepool.zz',
    });
  });

  it('normalizes the address again instead of trusting the page', () => {
    expect(parse({ type: 'navigate', address: ' HTTP://Kelp.ZZ/ ', nonce: NONCE })).toEqual({
      type: 'navigate',
      address: 'kelp.zz',
    });
  });

  it.each([
    ['wrong nonce (an earlier document)', { type: 'ready', nonce: 'old' }],
    ['no nonce (a forged message)', { type: 'ready' }],
    ['not an object', 'navigate'],
    ['null', null],
    ['unknown type', { type: 'eval', code: 'x', nonce: NONCE }],
    ['navigate without an address', { type: 'navigate', nonce: NONCE }],
    ['navigate to a non-string', { type: 'navigate', address: 42, nonce: NONCE }],
    ['navigate to javascript:', { type: 'navigate', address: 'javascript:alert(1)', nonce: NONCE }],
    ['navigate to a URL', { type: 'navigate', address: 'https://evil.example/', nonce: NONCE }],
    ['navigate to a path', { type: 'navigate', address: 'tidepool.zz/admin', nonce: NONCE }],
    ['scroll that is not a number', { type: 'scroll', y: '10', nonce: NONCE }],
    ['negative scroll', { type: 'scroll', y: -5, nonce: NONCE }],
    ['non-finite scroll', { type: 'scroll', y: Number.POSITIVE_INFINITY, nonce: NONCE }],
  ])('rejects %s', (_label, data) => {
    expect(parse(data)).toBeNull();
  });
});
