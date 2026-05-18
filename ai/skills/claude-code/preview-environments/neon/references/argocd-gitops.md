# Argo CD / GitOps Adapter

Use this adapter when previews are Kubernetes resources managed by Argo CD/ApplicationSet and a GitOps repository.

## Required Facts

- GitOps repository owner/name.
- GitOps preview branch.
- GitOps production branch if production deploy is automated.
- Preview manifests root path.
- ApplicationSet path/namespace behavior.
- Image registry and image platform.
- Preview hostname pattern.
- Gateway/Ingress/certificate mechanism.
- Argo CD server URL and application namespace.

## Required Secrets

- `GITOPS_TOKEN`
- registry username/password if images are pushed from Actions
- `ARGOCD_AUTH_TOKEN` if the workflow should poll Argo CD API

## Recommended Webhook

Configure a GitHub webhook on the GitOps repository, not the app repository, because ApplicationSet watches the GitOps repo. Send push events to Argo CD's ApplicationSet webhook endpoint and use a shared webhook secret.

## Adapter Behavior

- Build/push a per-PR image.
- Generate Kubernetes manifests under the PR-specific preview path.
- Commit/push manifests to the GitOps preview branch.
- Poll Argo CD Application status.
- Poll the public URL.
- Cleanup deletes the preview path from the GitOps preview branch.
