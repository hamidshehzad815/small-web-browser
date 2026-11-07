# The Small Web

Next.js + NestJS + MongoDB + TypeScript.

Prerequisites: Node 20.12+ (22 recommended), npm 10+, and Docker (or a MongoDB you already run on `localhost:27017`).

```bash
cp .env.example .env
npm install
npm run db:up       # MongoDB via Docker, waits until ready (skip if you run MongoDB yourself)
npm run seed        # deterministic, safe to run repeatedly
npm run dev:api     # NestJS  → http://localhost:4000
```

In a second terminal:

```bash
npm run dev:web     # Next.js → http://localhost:3000
```

Open http://localhost:3000. Other commands: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:down`.
