import { describe, expect, it } from 'vitest';
import { parseAddress } from './address';

describe('parseAddress', () => {
  it.each([
    ['tidepool.zz', 'tidepool.zz'],
    ['TidePool.ZZ', 'tidepool.zz'],
    ['  tidepool.zz  ', 'tidepool.zz'],
    ['http://tidepool.zz', 'tidepool.zz'],
    ['HTTPS://tidepool.zz/', 'tidepool.zz'],
    ['zz://tidepool.zz', 'tidepool.zz'],
    ['tidepool.zz///', 'tidepool.zz'],
    ['tidepool.zz/#section', 'tidepool.zz'],
    ['tidepool.zz#section', 'tidepool.zz'],
    ['a.zz', 'a.zz'],
    ['a-b.zz', 'a-b.zz'],
    ['9lives.zz', '9lives.zz'],
    [`${'a'.repeat(63)}.zz`, `${'a'.repeat(63)}.zz`],
  ])('accepts %j as %j', (input, expected) => {
    expect(parseAddress(input)).toEqual({ ok: true, address: expected });
  });

  it.each(['', '   ', '\t\n'])('reports %j as empty', (input) => {
    expect(parseAddress(input)).toEqual({ ok: false, reason: 'empty' });
  });

  it.each([
    'tidepool',
    'tidepool.com',
    'tidepool.zz.com',
    'sub.tidepool.zz',
    'x.zz.zz',
    'tidepool.zz/page',
    'tidepool.zz?x=1',
    '.zz',
    'x..zz',
    '-a.zz',
    'a-.zz',
    'ex ample.zz',
    'ex_ample.zz',
    'x.zz\\',
    `${'a'.repeat(64)}.zz`,
    `${'a'.repeat(400)}.zz`,
    '//x.zz',
    'ftp://x.zz',
    'javascript:alert(1)',
    'javascript://x.zz',
    'data:text/html,<b>x</b>',
    'vbscript:x.zz',
    'Kelp.zz', // Kelvin sign: would lowercase to "kelp" if not rejected first
    'café.zz',
    'x.zz\u0000',
    '<script>.zz',
  ])('rejects %j as invalid', (input) => {
    expect(parseAddress(input)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('is idempotent: parsing a normalized address returns it unchanged', () => {
    const first = parseAddress(' HTTP://Tidepool.ZZ/ ');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(parseAddress(first.address)).toEqual(first);
  });
});
