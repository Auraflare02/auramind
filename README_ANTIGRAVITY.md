# AuraMind — Antigravity Handoff

This package is the current AuraMind source for continued development.

## Run locally

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Open the local URL printed by Next.js.

## Environment
Copy `.env.example` to `.env.local` and provide the required server-side values.

Never commit `.env.local` or any real secrets.

## Supabase
Run `supabase/schema.sql` in the target Supabase project before using the persistence routes.

## Start here
Read `ANTIGRAVITY.md` before changing the project. It contains the product architecture, constraints, priorities and testing standard.
