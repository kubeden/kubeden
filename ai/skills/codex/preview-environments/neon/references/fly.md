# Fly.io Adapter

Use this adapter for Dockerized apps where one Fly app per PR is acceptable.

## Required Facts

- Fly organization.
- App name prefix.
- Region.
- Whether `fly.toml` exists or should be generated/overridden.
- Public URL pattern, usually `https://<app>.fly.dev`.

## Required Secrets

- `FLY_API_TOKEN`

## Adapter Behavior

- Create a Fly app if missing.
- Set secrets/runtime env for database and provider values.
- Deploy with `fly deploy --remote-only`.
- Write the Fly app URL to preview metadata.
- Cleanup destroys the PR-specific Fly app.

Be careful with persistent volumes. Do not destroy apps with shared volumes unless the user confirms the preview is disposable.
