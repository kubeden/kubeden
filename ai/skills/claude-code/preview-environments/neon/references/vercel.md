# Vercel Adapter

Use this adapter when the app already deploys cleanly with Vercel CLI.

## Required Facts

- Vercel project is linked or `VERCEL_PROJECT_ID`/`VERCEL_ORG_ID` are available.
- Build command and framework output are correct for Vercel.
- Whether a stable alias should be assigned to each PR preview.
- Whether cleanup should be no-op, alias removal, or API deletion.

## Required Secrets

- `VERCEL_TOKEN`

## Notes

The deploy template uses Vercel CLI with preview deployments and passes branch-specific public Neon values as build env values. Project targeting is done through Vercel's project linking or `VERCEL_PROJECT_ID`/`VERCEL_ORG_ID`, not a deploy subcommand project flag.

If the project uses Git-based Vercel previews instead, the adapter should be changed to update Vercel project/env settings or rely on Vercel's native PR preview comments.

Cleanup is often a no-op for Vercel preview deployments unless the user wants aliases or deployments deleted explicitly.
