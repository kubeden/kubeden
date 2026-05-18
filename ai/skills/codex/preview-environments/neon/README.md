# Neon Preview Environments Skill

This Codex skill helps install an issue-driven preview environment workflow into an application repository:

```text
GitHub issue -> trusted agent trigger -> Codex branch -> pull request -> Neon preview branch -> live preview URL -> cleanup on merge/close
```

It is a template and adaptation skill. It gives Codex provider-specific workflow templates, scripts, and references, but the installing agent must still inspect the target repo and replace placeholders with that user's real project details.

## Install

Copy or symlink this directory into the local Codex skills directory:

```bash
mkdir -p ~/.codex/skills
cp -R ai/skills/codex/preview-environments/neon ~/.codex/skills/neon-preview-environments
```

Restart Codex after installing so the skill is discovered.

## Use

Open Codex in the target application repository and ask it to use the skill explicitly:

```text
Use the neon-preview-environments skill to install an issue-driven Codex preview workflow in this repo.

Base branch: development
Preview provider: vercel
Database: Neon branch per PR
Do not push changes. Install the templates and tell me which GitHub secrets and variables I need.
```

For Argo CD/GitOps installs, include the infra repository path:

```text
Use the neon-preview-environments skill to install the Neon preview workflow.

App repo: current repo
Infra/GitOps repo: ../infra
Preview provider: argocd-gitops
Base branch: development
Do not push changes.
```

Supported preview adapters:

- `argocd-gitops`
- `vercel`
- `cloudflare`
- `railway`
- `fly`
- `render`

## What Codex Should Do

When invoked, Codex should:

1. Inspect the target app repo and any named infra repo.
2. Identify the package manager, migration command, test/build commands, and existing deployment config.
3. Select one preview adapter.
4. Copy the core templates from `assets/templates/core/`.
5. Copy the selected adapter scripts into the app repo as `scripts/deploy-preview.mjs`, `scripts/wait-preview.mjs`, and `scripts/cleanup-preview.mjs`.
6. Replace placeholders in workflows, scripts, and `agent.config.json`.
7. Configure the allowed GitHub actors and base branch.
8. Add or update `.gitignore` for `.agent/runtime/`.
9. Run syntax validation and safe local checks.
10. Report the required GitHub secrets, variables, provider setup, and remaining manual steps.

## Required Project Inputs

The installer needs these facts from the target project:

- GitHub username(s) allowed to trigger the agent.
- Base branch, defaulting to `development`.
- Install command, migration command, lint command, test command, and build command.
- Neon project ID, parent branch ID, database name, role name, and pooled/direct connection preference.
- Preview adapter and provider-specific project/service/app names.
- Public preview URL pattern or provider URL discovery method.
- Whether production deploy automation should be enabled after merge.

## Common GitHub Secrets And Variables

Core secrets:

- `CODEX_AUTH_JSON`
- `NEON_API_KEY`

Core repository variables:

- `NEON_PROJECT_ID`
- `NEON_PARENT_BRANCH_ID`
- `NEON_DATABASE_NAME`
- `NEON_ROLE_NAME`
- `NEON_POOLED`
- `NEON_DEFAULT_TTL_HOURS`

Adapter secrets, depending on provider:

- `GITOPS_TOKEN`
- `VERCEL_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `RAILWAY_TOKEN`
- `FLY_API_TOKEN`
- `RENDER_API_KEY`
- `ARGOCD_AUTH_TOKEN`

Provider variables commonly include:

- `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`
- `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE`
- `FLY_ORG`, `FLY_REGION`
- `RENDER_SERVICE_ID`
- `ARGOCD_SERVER`, `ARGOCD_APPLICATION_NAMESPACE`

## Installed Workflow Shape

The core templates install three GitHub workflows:

- `agent-codex.yml`: trusted issue/comment trigger, full issue context collection, Codex implementation, checks, PR creation.
- `preview-neon.yml`: PR preview branch creation, migrations/checks/build, provider preview deploy, URL/status comments.
- `cleanup-neon.yml`: PR close/merge cleanup, Neon branch deletion, provider cleanup, optional production deploy comment.

The workflow keeps progress in a single reusable GitHub comment where possible, instead of creating a new comment for every stage.

## Security Notes

- Only trusted GitHub actors should be allowed to trigger the agent.
- Fork PRs should not receive secrets or preview deploys.
- Issue and comment text is untrusted input even when the trigger actor is trusted.
- Do not print database URLs, Codex auth JSON, provider tokens, or registry credentials.
- Keep cleanup scoped to PR-specific Neon branches and preview resources.
- Enable production deploy automation only when the repository owner explicitly wants it.

## Validate The Skill Itself

From this repository:

```bash
python3 ai/skills/codex/preview-environments/neon/scripts/validate_skill.py
```

The validator checks the skill frontmatter, default branch placeholder expectations, forbidden project-specific literals, YAML syntax, and JavaScript syntax for bundled `.mjs` templates.
