// Addresses are `<name>.zz`: one page per address, no paths, queries or subdomains.
export const ADDRESS_TLD = 'zz';

declare const brand: unique symbol;
export type Address = string & { readonly [brand]: 'Address' };

export type AddressParse =
  { ok: true; address: Address } | { ok: false; reason: 'empty' | 'invalid' };

const MAX_INPUT_LENGTH = 300;
// Only schemes a person might plausibly type. Anything else (javascript:, data:, ftp:) must stay invalid.
const SCHEME = /^(?:https?|zz):\/\//;
const NAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;

const invalid = { ok: false, reason: 'invalid' } as const;

export function parseAddress(input: string): AddressParse {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  // Reject non-ASCII before lowercasing: e.g. U+212A (Kelvin sign) lowercases to a plain "k".
  if (trimmed.length > MAX_INPUT_LENGTH || !PRINTABLE_ASCII.test(trimmed)) return invalid;

  let rest = trimmed.toLowerCase().replace(SCHEME, '');
  const hash = rest.indexOf('#');
  if (hash !== -1) rest = rest.slice(0, hash);
  rest = rest.replace(/\/+$/, '');

  const suffix = `.${ADDRESS_TLD}`;
  if (!rest.endsWith(suffix)) return invalid;
  const name = rest.slice(0, -suffix.length);
  if (!NAME.test(name)) return invalid;
  return { ok: true, address: rest as Address };
}
