# Cloudflare Pages Adapter

Use this adapter for Cloudflare Pages direct-upload previews.

## Required Facts

- Cloudflare account ID.
- Pages project name.
- Build command and output directory.
- Branch name used for the Pages preview deployment.
- Whether custom preview aliases/routes are needed.

## Required Secrets

- `CLOUDFLARE_API_TOKEN`
- optionally `CLOUDFLARE_ACCOUNT_ID` as a secret, or use a repo variable.

## Adapter Behavior

- Run the configured build command after Neon URLs are in the environment.
- Deploy the output directory using Wrangler Pages.
- Parse the preview URL from Wrangler output when possible.
- Poll the public URL.

Cleanup can delete a Pages deployment if the deployment ID is known. Otherwise it should no-op and rely on Cloudflare retention.
