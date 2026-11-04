# The Small Web

Next.js + NestJS + MongoDB + TypeScript.

Prerequisites: Node 20+, npm 10+, MongoDB (local or Docker).

```bash
cp .env.example .env
npm install
npm run db:up       # MongoDB via Docker (skip if you already run MongoDB locally)
npm run seed        # deterministic, safe to run repeatedly
npm run dev:api     # NestJS  → http://localhost:4000
npm run dev:web     # Next.js → http://localhost:3000
```

Other commands: `npm run test`, `npm run lint`, `npm run typecheck`.
