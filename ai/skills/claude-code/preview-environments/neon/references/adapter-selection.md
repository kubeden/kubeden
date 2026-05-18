# Adapter Selection

Pick one preview adapter for the initial install.

## Strong Signals

- `ApplicationSet`, `Application`, `kustomization.yml`, Helm charts, Kubernetes manifests, or a separate infra repo: use `argocd-gitops`.
- `vercel.json`, `.vercel/`, or existing Vercel workflows: use `vercel`.
- `wrangler.toml`, `pages_build_output_dir`, or Cloudflare Pages docs/scripts: use `cloudflare`.
- `railway.json` or Railway project/service references: use `railway`.
- `fly.toml`: use `fly`.
- `render.yaml` or Render deploy hooks/API references: use `render`.

Signals are not authority. Ask when more than one exists or when the user has not confirmed hosting.

## Adapter Fit

- `argocd-gitops`: best when infra is GitOps-driven and previews are Kubernetes namespaces/apps.
- `vercel`: best for frontend/static/serverless apps already configured for Vercel CLI deployments.
- `cloudflare`: best for static Pages or Workers-compatible frontend builds.
- `railway`: best when the Railway project already uses services/environments or PR environments.
- `fly`: best for Dockerized apps where one app per PR is acceptable.
- `render`: best when Render services or blueprints already manage deploys.

## Build-Time Public Env Values

If the app compiles public env vars into client assets (`VITE_*`, `NEXT_PUBLIC_*`, `PUBLIC_*`, `REACT_APP_*`), ensure the preview build receives branch-specific Neon values before building. Runtime env vars are not enough for static bundles.
