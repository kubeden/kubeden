# GitHub Actions

The core workflow model uses three workflows.

## Agent CI

`agent-codex.yml`

Triggers:

- issue opened/edited
- issue comment created
- manual dispatch

Main stages:

1. checkout base branch
2. prepare and authorize run
3. create/reuse work branch
4. upsert progress comment
5. create/reuse Neon branch
6. render prompt from full issue context
7. run Codex
8. run migrations/checks/build
9. commit/push/open draft PR
10. dispatch preview workflow

## Preview CI

`preview-neon.yml`

Triggers:

- PR opened/synchronized/reopened against the base branch
- manual dispatch from Agent CI

Main stages:

1. checkout PR commit
2. create/reuse Neon branch
3. run migrations/checks/build
4. run selected preview adapter
5. wait for provider/URL readiness
6. update PR and source issue progress comments

## Cleanup CI

`cleanup-neon.yml`

Triggers:

- PR closed against the base branch
- manual dispatch

Main stages:

1. if merged, optionally run production deploy command
2. delete Neon preview branch
3. run selected preview cleanup adapter
4. update PR and source issue comments

`pull_request_target` workflow definitions are read from the default branch. Keep cleanup workflow changes on the default branch.

The bundled workflows use current official `actions/checkout` and `actions/setup-node` major versions. If installing on self-hosted runners, confirm the runner version satisfies those actions' minimum runner requirements before upgrading.
