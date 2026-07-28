# multirun

Fan out N isolated agent runs on the cluster — worktree + neon branch
per run, results in a database, nothing shared. Code and chart:
[a2wio/multirun](https://github.com/a2wio/multirun).

ArgoCD reads the chart straight from that repo (`infrastructure/chart`,
read-only deploy key; the repo credential is a SealedSecret in
`platform/argocd`). `base/` here holds only what must be sealed against
this cluster.

## secrets

`multirun-secrets` and `source-deploy-key` are SealedSecrets in
`base/secrets-sealed.yml`. Two arrive on their own:

- `registry-credentials` — kyverno clones it into every namespace
- `claude-creds` — rotates, so it is never a git object; it gets in via
  `multirun creds push` from a logged-in machine, and the controller
  keeps it fresh after that (see the multirun repo's deploy doc)

## shipping a new image

Pin the new sha in the chart's `values.yaml` on main, sync. No
`:latest`, no rollout restarts, nothing to re-render here.
