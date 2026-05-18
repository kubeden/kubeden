# Adapter Contracts

The core workflows call adapter scripts through configured commands.

## Deploy Script

Path after install: `scripts/deploy-preview.mjs`

Responsibilities:

- create or update the preview environment;
- build and/or deploy the current PR commit;
- pass branch-specific Neon public values at build time when required;
- write `.agent/runtime/preview-url.txt`;
- write `.agent/runtime/preview.json`;
- set GitHub outputs where useful.

Required environment:

- `PR_NUMBER`
- `HEAD_BRANCH`
- `DATABASE_URL`
- `VITE_NEON_AUTH_URL` or equivalent public auth URL when required
- `VITE_NEON_DATA_API_URL` or equivalent public Data API URL when required

## Preview Metadata

`.agent/runtime/preview.json`:

```json
{
  "provider": "provider-name",
  "url": "https://preview.example.com",
  "resourceName": "provider-resource-name",
  "resourceId": "provider-resource-id",
  "cleanup": {
    "enabled": true
  },
  "details": {}
}
```

## Wait Script

Path after install: `scripts/wait-preview.mjs`

Responsibilities:

- poll provider state when a provider API exists;
- always poll the final public URL;
- fail if the environment is not ready within the configured timeout.

## Cleanup Script

Path after install: `scripts/cleanup-preview.mjs`

Responsibilities:

- remove or disable provider-specific preview resources;
- tolerate missing resources;
- never delete production resources;
- set outputs or write logs describing what was removed.

## Production Deploy

Production deploy is intentionally not part of the preview adapter contract. Configure it separately in `agent.config.json.production.deployCommand`.
