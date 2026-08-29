# innkeeper-app

The dashboard at `innkeeper.a2w.io/app`. Stock `nginx:1.27-alpine` serving
three mounted ConfigMaps. No image, no registry, no build.

**The dashboard itself is not in this repo.** It lives in `a2wio/innkeeper-app`,
and the three ConfigMaps the Deployment mounts are applied from there:

    git clone git@github.com:a2wio/innkeeper-app.git && cd innkeeper-app
    kubectl apply -k . --server-side

Editing the dashboard is a commit there and one `kubectl apply -k`. Kubelet
syncs a mounted ConfigMap in place, so the pod never restarts; allow ~60s for
the mount to catch up. The exception is `nginx.conf`, which nginx will not
reload by itself — that one needs a `rollout restart`.

## The /app prefix

The HTTPRoute forwards `/app` to this Service **without** a URLRewrite filter,
so the pod sees `/app/audit`, not `/audit`. The dashboard's own `nginx.conf`
strips the prefix internally, and it also serves the same files at the root, so
adding a rewrite filter to the route later would not break it either way.

## What this app does not own

The `innkeeper` namespace and the HTTPRoute for `innkeeper.a2w.io` belong to
`applications/innkeeper-gateway`, which splits the host three ways: `/` to
`innkeeper-landing`, `/app` to this Service, and `/s/`, `/t/`, `/oauth`, `/v1`,
`/.well-known`, `/pair` to the gateway itself. This app contributes one Service
named `innkeeper-app` on port 80 and nothing else.

`CreateNamespace=true` is set anyway so a sync in the wrong order still works.
If both apps ever have the namespace in git they will fight over it; the gateway
is the one that should keep it.
