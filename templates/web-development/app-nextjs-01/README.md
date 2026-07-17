# neon-app-template

A reusable Next.js foundation for building web apps on [Neon](https://neon.com)'s
platform — **Auth**, **Data API**, **Object Storage**, and **AI Gateway** pre-wired
as thin, typed clients. Not a product: a clean starting point any project (SaaS,
internal tool, AI app) can be built on.

> **Beta note:** all four Neon platform services used here are in Beta and
> currently region-limited to `us-east-2`. APIs may drift; dependency pins are exact.

## Stack

- **Next.js 16** — App Router, `src/`, TypeScript, ESLint, `@/*` alias, `proxy.ts` gate
- **Tailwind CSS v4 + shadcn/ui** — neutral theme, Geist fonts, components in `src/components/ui`
- **Drizzle ORM + drizzle-kit** — schema in `src/db/schema.ts`, FKs into Neon Auth's `neon_auth."user"`
- **Neon SDKs** — `@neondatabase/auth` (+ `auth-ui`), `@neondatabase/neon-js` (Data API),
  `@neon/ai-sdk-provider` + Vercel AI SDK v6 (AI Gateway), AWS S3 SDK (Object Storage)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values (each key documents how)
npx drizzle-kit migrate      # apply src/db/migrations to your Neon database
npm run dev
```

Every key in `.env.local` has a comment explaining where to obtain it in the
[Neon console](https://console.neon.tech). The app builds and boots with an
empty env — service clients initialize lazily on first use.

## Layout

```
src/
  app/
    (marketing)/        # public landing — placeholder, built in a later stage
    dashboard/          # gated area — redirects to /login until authenticated
    login/              # auth entry point — drop-in UI mounted in a later stage
    api/
      auth/[...path]/   # Neon Auth handler (live)
      assets/           # object-storage upload seam (501 until implemented)
  components/
    landing/ dashboard/ # per-stage component dirs (empty seams)
    ui/                 # shadcn/ui
  lib/
    auth/server.ts      # getAuth() — lazy Neon Auth instance
    db/index.ts         # getDb() — Drizzle over Neon HTTP driver
    data-api.ts         # createDataApiClient() — PostgREST-style, RLS-aware
    storage/client.ts   # getStorage() — S3 client aimed at Neon Object Storage
    ai/gateway.ts       # gatewayModel() — AI SDK model via Neon AI Gateway
    avatar.ts           # gravatar helper
  db/
    schema.ts           # profiles + assets, scoped by auth user id
    migrations/         # drizzle-kit output
  proxy.ts              # route gate (Next 16's middleware successor)
PROJECT.md              # the project brief later build stages read
```

## Conventions

- **Server-authoritative mutations.** The Data API is for RLS-protected reads
  from the client; anything with business rules goes through our own API routes.
- **Lazy clients.** Service clients initialize on first use so builds and dev
  boots succeed before `.env.local` is filled in.
- **`neon_auth` is read-only.** Identity tables are owned by Neon Auth; app
  tables FK into `neon_auth."user"`. Never emit DDL for that schema — see the
  note in `src/db/schema.ts` about drizzle-kit `generate`.
- **npm date pin.** The repo `.npmrc` overrides a user-level `before=`
  supply-chain pin; bump its date deliberately when upgrading dependencies.

## Roadmap

`PROJECT.md` is the single source of truth for project-specific decisions.
Later stages fill the seams: landing page → app backend (auth flows, uploads,
AI calls) → dashboard → deploy.
