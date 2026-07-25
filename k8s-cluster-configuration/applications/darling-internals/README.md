# darling-internals

darling's emotion graph at [darling.a2w.io](https://darling.a2w.io).
App code: [a2wio/darling-internals](https://github.com/a2wio/darling-internals).
Next app + its own postgres (statefulset + pvc, app-only networkpolicy).
Data arrives outbound-only from the box darling runs on, via
`POST /api/ingest`; everything else needs the password.

## the secret (create once, never commit)

```sh
kubectl create namespace darling-internals
kubectl -n darling-internals create secret generic darling-internals-secrets \
  --from-literal=POSTGRES_USER=darling \
  --from-literal=POSTGRES_PASSWORD='<db password>' \
  --from-literal=DATABASE_URL='postgres://darling:<db password>@darling-internals-db:5432/darling_internals' \
  --from-literal=DARLING_PASSWORD='<login password>' \
  --from-literal=INGEST_TOKEN='<long random token>'
```

The app migrates its own schema on boot — an empty volume is fine.

## deploys

The deployment tracks `:latest` (the a2w lesson), so after an image push:

```sh
kubectl rollout restart deploy/darling-internals -n darling-internals
```

Or add `GITOPS_TOKEN` (PAT, push access to this repo) to the
a2wio/darling-internals repo secrets and its workflow commits the sha
tag straight into `base/deployment.yml` here — argocd syncs, no restart.
