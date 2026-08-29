# innkeeper-landing

The marketing page at the root of `innkeeper.a2w.io`. Stock
`nginx:1.27-alpine` serving three mounted ConfigMaps. No image, no registry,
no build.

**The page content is not in this repo.** It lives in `a2wio/innkeeper-landing`,
and the three ConfigMaps the Deployment mounts are applied from there:

    git clone git@github.com:a2wio/innkeeper-landing.git && cd innkeeper-landing
    kubectl apply -k . --server-side

`--server-side` is required: the assets ConfigMap is ~280 KB and a
client-side apply would write all of it into a 262,144-byte annotation.

Editing the page is a commit there and one `kubectl apply -k`. Kubelet syncs
a mounted ConfigMap in place, so the pod never restarts; allow ~60s for the
mount to catch up.

## What this app does not own

The `innkeeper` namespace and the HTTPRoute for `innkeeper.a2w.io` belong to
`applications/innkeeper-gateway`, which splits the host three ways: `/` to
this Service, `/app` to `innkeeper-app`, and `/s/`, `/oauth`, `/v1`,
`/.well-known` to the gateway itself. This app contributes one Service named
`innkeeper-landing` on port 80 and nothing else.

`CreateNamespace=true` is set anyway so a sync in the wrong order still
works. If both apps ever have the namespace in git they will fight over it;
the gateway is the one that should keep it.

## If it ever earns an image

`a2wio/innkeeper-landing` is a single HTML file, so it probably will not. If
it does, that repo needs `ZOT_ADMIN` and `ZOT_PASSWORD` as Actions secrets
(the same pair `a2wio/agentgrant` uses for the relay image), and this
Deployment should pin a short-sha tag rather than `:latest` — see
`applications/a2w` for why.
