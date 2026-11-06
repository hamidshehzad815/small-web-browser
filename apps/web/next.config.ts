import { resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// One .env at the repo root serves both apps.
loadEnvConfig(resolve(process.cwd(), '../..'));

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Nobody gets to frame the browser. Deliberately no `script-src`: a srcdoc iframe inherits
          // its parent's CSP, so a strict one here would also block the viewer's own nonce'd bridge.
          // The pages' policy lives in the document we build for the sandbox (lib/viewer-doc.ts).
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ];
  },
};

export default nextConfig;
