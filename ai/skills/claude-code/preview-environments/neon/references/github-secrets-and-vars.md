# GitHub Secrets And Variables

The exact names can be changed, but keep the workflow and `agent.config.json` aligned.

## Required Claude Runtime Secret

Choose one:

- `CLAUDE_CODE_OAUTH_TOKEN`: long-lived Claude subscription token from `claude setup-token`. Use this when the workflow should draw from a Claude subscription-backed CI token.
- `ANTHROPIC_API_KEY`: direct Anthropic API key. Use this when the workflow should bill through the Anthropic API instead of a Claude subscription token.

## Required Core Secrets

- `NEON_API_KEY`: Neon API token.
- Provider token for the selected adapter:
  - `GITOPS_TOKEN`
  - `VERCEL_TOKEN`
  - `CLOUDFLARE_API_TOKEN`
  - `RAILWAY_TOKEN`
  - `FLY_API_TOKEN`
  - `RENDER_API_KEY`

## Required Core Variables

- `NEON_PROJECT_ID`
- `NEON_PARENT_BRANCH_ID`
- `NEON_DATABASE_NAME`
- `NEON_ROLE_NAME`
- `NEON_POOLED`
- `NEON_DEFAULT_TTL_HOURS`

## Optional Neon Public URL Variables

- `NEON_GET_AUTH_URL`
- `NEON_GET_DATA_API_URL`
- `NEON_REQUIRE_PUBLIC_URLS`
- `NEON_PROVISION_AUTH`
- `NEON_PROVISION_DATA_API`
- `NEON_AUTH_PROVIDER`
- `NEON_DATA_API_AUTH_PROVIDER`

## Production Secrets

Only add these if merge deploy automation is enabled:

- `PROD_DATABASE_URL`
- provider production token/secrets
- production public build-time env values such as `PROD_VITE_NEON_AUTH_URL`

## Provider Variables

Keep provider project/service names in repository variables when possible. Keep tokens in secrets.

Common examples:

- `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`
- `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE`
- `FLY_ORG`, `FLY_REGION`
- `RENDER_SERVICE_ID`
- `ARGOCD_SERVER`, `ARGOCD_APPLICATION_NAMESPACE`
