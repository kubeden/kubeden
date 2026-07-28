# multirun

Fan out N isolated agent runs on the cluster — worktree + neon branch
per run, results in a database, nothing shared. Code and chart:
[a2wio/multirun](https://github.com/a2wio/multirun).

ArgoCD can't read that repo (private; the a2wio org has deploy keys
disabled), so `base/` holds the rendered manifests — same objects as
`infrastructure/chart` there, pinned image tags. Change the chart,
re-render, commit here; the cluster listens to this copy only.

## secrets

`multirun-secrets` and `source-deploy-key` are SealedSecrets in
`base/secrets-sealed.yml`. Two arrive on their own:

- `registry-credentials` — kyverno clones it into every namespace
- `claude-creds` — rotates, so it is never a git object; it gets in via
  `multirun creds push` from a logged-in machine, and the controller
  keeps it fresh after that (see the multirun repo's deploy doc)

## shipping a new image

Pin the new sha in the chart's `values.yaml`, re-render, update the two
tags in `base/deployment.yml`, sync. No `:latest`, no rollout restarts.
