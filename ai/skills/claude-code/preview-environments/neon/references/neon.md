# Neon

The core templates create one Neon branch per agent/PR preview.

## Branch Naming

Default:

- issue/agent run: derived from the agent branch
- PR preview: `preview-pr-<number>`

Keep names deterministic so preview workflows can reuse branches and cleanup can find them.

## Migration Timing

Run migrations after the agent has edited code and before opening/updating the PR. Run migrations again in Preview CI against the same preview branch before deploying the live preview.

On merge, run production migrations against the production database only if the user enabled production deploy automation.

## Public URLs

Some apps need public Neon Auth/Data API URLs at build time. Use:

- `NEON_GET_AUTH_URL`
- `NEON_GET_DATA_API_URL`
- `NEON_PROVISION_AUTH`
- `NEON_PROVISION_DATA_API`
- `NEON_REQUIRE_PUBLIC_URLS`

If public URLs are required and cannot be resolved, fail before build/deploy.

When provisioning Neon Auth, use one of Neon's current branch Auth providers such as `better_auth`, `stack_v2`, `stack`, or `mock`. When provisioning the Neon Data API, use `neon_auth` or `external`.

## Cleanup

Delete the Neon preview branch on PR close or merge when `neon.deleteOnPrClose` is true. Do not merge Neon preview branches into production; production migrations should replay the schema change against the production branch.
