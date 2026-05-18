# Railway Adapter

Use this adapter when the project is already configured for Railway services/environments.

## Required Facts

- Railway project ID/name.
- Service name or ID.
- Base environment name.
- Preview environment naming convention.
- Whether Railway PR Environments are enabled natively.
- How public domains are provisioned.

## Required Secrets

- `RAILWAY_TOKEN`

## Adapter Options

If Railway PR Environments are enabled, prefer native PR environments and use the workflow to ensure Neon branch env vars are available and to report the URL.

If using CLI-driven previews, the template targets an environment named from the PR, duplicates `adapters.railway.baseEnvironment` when the PR environment does not exist, stages branch-specific variables with `railway variables set --skip-deploys`, then runs `railway up --ci`. Adapt variable setting to the project's Railway setup.

Cleanup should remove or disable the PR environment when supported; otherwise leave a clear manual cleanup note.
