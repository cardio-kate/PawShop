# PawShop

Online store for cat supplies (EU, storefront in English and German — see `docs/architecture.md` §3.10).
Orders are submitted as inquiries with no built-in online payment; a lightweight admin panel for a single
administrator handles the rest.

Full documentation lives in [`/docs`](./docs):

- [`docs/tz-pawshop.md`](./docs/tz-pawshop.md) — product spec (technical requirements)
- [`docs/architecture.md`](./docs/architecture.md) — project architecture (see §9 for why `jose` instead of `bcrypt`/`jsonwebtoken` in `proxy.ts`, Next.js 16)
- [`docs/design.md`](./docs/design.md) — design system

## Stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · Zustand · Drizzle ORM · PostgreSQL (Neon) · Zod ·
custom auth (bcrypt + JWT/jose) · Telegram Bot API · Vercel Blob · `next-intl` (EN/DE) · deployed on Vercel.

## Status

The project is at the skeleton stage: folder structure, dependencies, and base configs are set up per
`docs/architecture.md` (section 2). Business logic, components, and server actions are not implemented yet.

## Getting started

```bash
npm install
cp .env.example .env
```

Fill in `.env` (Neon connection strings, `JWT_SECRET`, Telegram bot token, Vercel Blob token — see
`.env.example` and `docs/architecture.md`, section 5).

```bash
npm run db:generate   # generate migrations from lib/db/schema.ts
npm run db:migrate     # apply migrations (via DATABASE_URL_UNPOOLED)
npm run dev
```

After the first deploy/migration — one-off setup scripts (see `docs/architecture.md`, section 3.4, items 5–7):

```bash
npm run create-admin
npm run seed:categories
npm run seed:delivery-countries
```

## Scripts

| Command                                                  | Purpose                    |
| --------------------------------------------------------- | --------------------------- |
| `npm run dev`                                            | local development           |
| `npm run build` / `npm run start`                        | production build and start  |
| `npm run lint` / `npm run typecheck` / `npm run format`  | static checks                |
| `npm run db:generate` / `db:migrate` / `db:studio`       | Drizzle migrations           |
| `npm run test` / `test:unit` / `test:integration`        | Jest                          |

## Structure

Detailed folder layout and the reasoning behind each layer — in `docs/architecture.md` (section 2,
"Layered structure inside the monolith"): `UI (components) → Actions (thin) → Services (business logic) →
Queries/Repositories → Postgres`.
