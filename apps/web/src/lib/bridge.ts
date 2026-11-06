import { parseAddress, type Address } from '@small-web/shared';

// Messages from the sandboxed page to the browser. The page runs in an opaque origin, so these
// cannot be trusted: every one is shape-checked and tagged with the nonce of the exact document
// that is currently showing. A message from a previous document (or a forged one) is dropped.

export type BridgeMessage =
  { type: 'ready' } | { type: 'scroll'; y: number } | { type: 'navigate'; address: Address };

export function parseBridgeMessage(data: unknown, nonce: string): BridgeMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const message = data as Record<string, unknown>;
  if (message.nonce !== nonce) return null;

  switch (message.type) {
    case 'ready':
      return { type: 'ready' };
    case 'scroll': {
      const y = message.y;
      if (typeof y !== 'number' || !Number.isFinite(y) || y < 0) return null;
      return { type: 'scroll', y };
    }
    case 'navigate': {
      // Never trust the page's idea of an address: normalize it again here.
      if (typeof message.address !== 'string') return null;
      const parsed = parseAddress(message.address);
      return parsed.ok ? { type: 'navigate', address: parsed.address } : null;
    }
    default:
      return null;
  }
}
