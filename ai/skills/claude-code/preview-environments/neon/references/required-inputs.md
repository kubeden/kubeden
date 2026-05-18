# Required Inputs

Confirm these before installing or adapting templates.

## Repository

- App repository owner/name.
- Default integration branch. Use `development` unless the user chooses another branch.
- Whether PRs should be draft by default.
- Trusted GitHub users allowed to trigger the agent.
- Whether issue tags, slash commands, or both should trigger the agent.

## Runtime

- Package manager and install command.
- Migration command.
- Lint command.
- Test command.
- Build command.
- Output directory for static adapters, if applicable.
- Dockerfile path and image platform, if applicable.

## Neon

- Neon project ID.
- Parent branch ID or name.
- Database name.
- Role name.
- Whether pooled connection URIs should be used.
- Whether Neon Auth/Data API public URLs are required.
- Auth/Data API providers and trusted domains.
- Preview branch TTL.

## Preview Provider

- Provider: `argocd-gitops`, `vercel`, `cloudflare`, `railway`, `fly`, or `render`.
- Provider account/team/org/project/service names.
- Preview URL pattern.
- Required provider tokens.
- Cleanup behavior on PR close without merge and after merge.

## Production

- Whether merge should deploy production.
- Production deployment command or adapter.
- Production database URL secret.
- Production public URL.
- Whether production migrations should run on merge.
