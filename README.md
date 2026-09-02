# PawShop

A full-stack e-commerce store for cat supplies, built for the EU market with an English/German storefront. Orders
are submitted as inquiries — no online payment — and a single admin confirms and fulfills each one by hand.

<p align="center">
  <a href="https://paw-shop-eight.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-paw--shop--eight.vercel.app-6D4AFF?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
</p>

<p align="center">
  <a href="https://github.com/cardio-kate/PawShop/actions/workflows/ci.yml"><img src="https://github.com/cardio-kate/PawShop/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod">
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
</p>

<p align="center">
  <sub>Next.js 16 · TypeScript · Tailwind · Zustand · PostgreSQL (Neon) · Drizzle ORM · Zod · custom auth (bcrypt + jose) · next-intl · Vercel Blob · Telegram Bot API</sub>
</p>

<p align="center">
  <img src="public/readme/catalog-hero.png" alt="PawShop catalog page" width="760"><br>
  <sub>Catalog — category/age/price filters, real product photos</sub>
</p>

<p align="center">
  <img src="public/readme/cart-flow.gif" alt="Adding a product to the cart" width="760"><br>
  <sub>Picking a variant and adding it to the cart</sub>
</p>

## Features

- EN/DE storefront (`next-intl`), server-rendered for SEO — catalog with category/age/price filters, search,
  and per-product `generateMetadata`
- Cart & checkout as an inquiry, not a payment: the server always recalculates prices from the database,
  client-side totals are never trusted
- Custom auth (bcrypt + JWT via `jose`) protecting a single-admin dashboard, with session versioning and
  rate-limited login/password reset
- Admin dashboard for products & variants, delivery countries, orders, and incoming contact messages
- Telegram notifications on new orders and contact messages (outbound only)
- Jest unit + integration tests (integration runs against a dedicated Neon branch) wired into CI

Full documentation lives in [`/docs`](./docs):

- [`docs/product-spec.md`](./docs/product-spec.md) — product spec (technical requirements)
- [`docs/architecture.md`](./docs/architecture.md) — project architecture
- [`docs/design.md`](./docs/design.md) — design system

## Development process

This project was built with Claude Code as an AI pair programmer, working from written specs
([`docs/architecture.md`](./docs/architecture.md), [`docs/product-spec.md`](./docs/product-spec.md),
[`docs/design.md`](./docs/design.md)) and project engineering rules ([`CLAUDE.md`](./CLAUDE.md)).

## Getting started

```bash
npm install
cp .env.example .env    # fill in Neon connection strings, JWT_SECRET, Telegram bot token, Vercel Blob token
npm run db:generate && npm run db:migrate
npm run dev
```

First-time setup (after the first migration):

```bash
npm run create-admin
npm run seed:categories
npm run seed:delivery-countries
```

## Scripts

| Command                                                 | Purpose                    |
| -------------------------------------------------------- | --------------------------- |
| `npm run dev`                                           | local development          |
| `npm run build` / `npm run start`                       | production build and start |
| `npm run lint` / `npm run typecheck` / `npm run format` | static checks               |
| `npm run db:generate` / `db:migrate` / `db:studio`      | Drizzle migrations          |
| `npm run test` / `test:unit` / `test:integration`       | Jest                        |
