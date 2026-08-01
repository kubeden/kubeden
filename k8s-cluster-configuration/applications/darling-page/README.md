# darling-page

The presentation page for darling. Stock `nginx:1.27-alpine` serving four
mounted ConfigMaps — no image, no registry, no build.

**The page content is not in this repo.** It lives in the private
`a2wio/darling-page`, and the four ConfigMaps the Deployment mounts are
applied from there by hand:

    git clone git@github.com:a2wio/darling-page.git && cd darling-page
    kubectl apply -k . --server-side

`--server-side` is required: the dash ConfigMap is ~300 KB and client-side
apply would write all of it into a 262,144-byte annotation.

This repo is public and the page is deliberately unlisted — nothing links
to it, `robots.txt` disallows everything, and every response carries
`noindex`. Only the hostname is here, same as `darling.a2w.io` already is.

Editing the page is a commit in that repo and one `kubectl apply -k`.
Kubelet syncs a mounted ConfigMap in place, so the pod never restarts;
allow ~60s for the mount to catch up.

If it ever earns an image, `a2wio/darling-page` already carries a correct
`Dockerfile` and a build-push workflow; they need `REGISTRY_USERNAME` and
`REGISTRY_PASSWORD` on that repo, and then this Deployment should pin the
short-sha tag rather than `:latest` — see `applications/a2w` for why.
