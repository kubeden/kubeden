---
name: neon-preview-environments
description: Install or adapt GitHub issue-driven Claude Code automation that creates Neon database branches, opens agent pull requests, deploys live preview environments, comments preview URLs, and cleans up previews across Argo CD/GitOps, Vercel, Cloudflare Pages, Railway, Fly.io, or Render.
when_to_use: Use when a user wants a Claude Code issue-to-PR workflow, Neon branch-per-preview databases, GitHub Actions CI/CD templates, provider-specific preview deployment adapters, or migration/check/build automation around pull request preview environments.
argument-hint: "[adapter] [base-branch]"
disable-model-invocation: true
---

# Neon Preview Environments

Build a repository-specific agent workflow:

`GitHub issue -> trusted @claude trigger -> Claude branch -> draft PR -> Neon preview branch -> live preview deployment -> review URL -> merge/close cleanup`

This skill is an installer and adaptation guide. Inspect the user's repo and deployment setup first; do not blindly copy templates.

This skill is manual-invocation only because it installs CI/CD automation and secrets-dependent deployment paths. Invoke it explicitly with `/neon-preview-environments`.

## Mandatory Discovery Gate

Before editing files, inspect the target application repo and any infra repo the user names:

- `git status --short --branch`
- package/runtime manifests
- existing GitHub Actions workflows
- deployment config (`vercel.json`, `wrangler.toml`, `railway.json`, `fly.toml`, `render.yaml`, Kubernetes manifests, Helm/Kustomize, Argo CD Application/ApplicationSet)
- migration tooling and env examples
- existing `CLAUDE.md`, `.claude/`, or repository agent instructions

Then summarize the intended install plan and ask for approval before writing files. If the user already gave explicit approval in the current turn, proceed.

## Adapter Selection

Read [references/adapter-selection.md](references/adapter-selection.md), then load only the provider reference that matches the user's infra:

- Argo CD/GitOps: [references/argocd-gitops.md](references/argocd-gitops.md)
- Vercel: [references/vercel.md](references/vercel.md)
- Cloudflare Pages: [references/cloudflare.md](references/cloudflare.md)
- Railway: [references/railway.md](references/railway.md)
- Fly.io: [references/fly.md](references/fly.md)
- Render: [references/render.md](references/render.md)

If the repo has multiple plausible deploy targets, ask which one is authoritative.

## Installation Workflow

1. Confirm required facts from [references/required-inputs.md](references/required-inputs.md).
2. Copy the core templates from `assets/templates/core/` into the app repo.
3. Copy exactly one adapter from `assets/templates/adapters/<adapter>/scripts/` into the app repo as:
   - `scripts/deploy-preview.mjs`
   - `scripts/wait-preview.mjs`
   - `scripts/cleanup-preview.mjs`
4. For Argo CD/GitOps only, optionally copy `assets/templates/adapters/argocd-gitops/appset-webhook/` into the infra repo and adapt it.
5. Edit `agent.config.json` for the actual project:
   - default base branch is `development`
   - package/migration/lint/test/build commands
   - allowed GitHub actors
   - selected preview adapter
   - provider-specific app/project/service names
   - public preview URL pattern
   - production deploy command, if merge deploy should be automated
6. Replace placeholders. Templates intentionally use placeholders such as `__APP_NAME__`, `__BASE_BRANCH__`, and `__PREVIEW_DOMAIN_SUFFIX__`.
7. Add `.agent/runtime/` to `.gitignore` if missing.
8. Validate syntax and run non-destructive checks.
9. Finish with an operator checklist: required secrets/vars, provider setup, webhook setup, commands run, and remaining manual steps.

## Core Files

Copy these core templates unless an equivalent file already exists and should be merged:

- `.github/workflows/agent-claude.yml`
- `.github/workflows/preview-neon.yml`
- `.github/workflows/cleanup-neon.yml`
- `.agent/prompts/implement-issue.md`
- `.agent/runtime/.gitkeep`
- `agent.config.json`
- `scripts/*.mjs`
- `scripts/lib/*.mjs`

Preserve user changes. If a target file exists, compare and merge.

## Adapter Contract

Each selected adapter must provide:

- `deploy-preview.mjs`: creates/updates the live preview and writes `.agent/runtime/preview.json`.
- `wait-preview.mjs`: waits until the preview is ready enough to review.
- `cleanup-preview.mjs`: removes or disables provider-specific preview resources.

The preview metadata file must contain at least:

```json
{
  "provider": "adapter-name",
  "url": "https://preview.example.com",
  "resourceName": "preview-resource",
  "details": {}
}
```

See [references/adapter-contracts.md](references/adapter-contracts.md) for the full contract.

## Claude Code Runtime

The installed `agent-claude.yml` template uses the Claude Code CLI in GitHub Actions, not the interactive local app. It expects one of these authentication paths:

- `CLAUDE_CODE_OAUTH_TOKEN` for subscription-backed CI usage, generated with `claude setup-token`.
- `ANTHROPIC_API_KEY` for direct Anthropic API usage.

The workflow runs Claude Code non-interactively with permission bypass inside the ephemeral GitHub runner, then the local scripts commit the resulting diff and open or update a draft PR.

## Security Rules

Always enforce these in the installed workflow:

- Issue triggers must be restricted to trusted actors.
- Issue/comment body text is untrusted input, even when the actor is trusted.
- Fork PRs must not receive secrets or deploy previews.
- Do not print database URLs, auth tokens, or provider tokens.
- Prefer draft PRs for agent-created changes.
- Do not run production deploys unless the user explicitly wants merge deploy automation.
- Keep preview cleanup scoped to the PR-specific Neon branch and provider resource.

Read [references/security-model.md](references/security-model.md) before changing trigger or token behavior.

## Validation

Run what is safe for the repo:

- YAML syntax check if available.
- `node --check` for copied `.mjs` scripts.
- configured lint/build/test commands that do not require missing secrets.
- a dry run of adapter selection and placeholder replacement.

Do not deploy, mutate production, or delete provider resources during installation unless the user explicitly asks.
