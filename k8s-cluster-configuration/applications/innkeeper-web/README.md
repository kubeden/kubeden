# innkeeper-web

Everything at `innkeeper.a2w.io`, as one ArgoCD app: the `innkeeper`
namespace, the host (its certificate, its Gateway listener, and the one
HTTPRoute that splits it by path), and the four pods the paths land on.

    /                                       -> landing/    innkeeper-landing:80
    /app                                    -> app/        innkeeper-app:80
    /download/Innkeeper.pkg   .../Innkeeper.dmg -> downloads/  innkeeper-downloads:80
    /s/ /t/ /v1 /oauth /.well-known /pair   -> gateway/    innkeeper-gateway:8080

`base/` is `namespace.yml`, `host.yml`, and one directory per pod with its
Deployment, its Service, and whatever only it needs: the gateway's claim and
sealed secret, the downloads' claim and nginx server block. Traefik matches
the longest prefix first, so the order in `host.yml` is for reading, not
precedence. A backend whose Service is missing answers 503 on its own paths
and leaves the others alone.

The relay at `relay.a2w.io` is deliberately not here. `applications/
innkeeper-relay` has its own namespace, host and secrets, and nothing on this
host needs it to be up.

Until 2026-09-05 this was four Applications: `innkeeper-gateway`, which owned
the namespace and the route, and `innkeeper-landing`, `innkeeper-app` and
`innkeeper-downloads`, each contributing one Service into the same namespace
with `CreateNamespace=true` so a sync in the wrong order still worked. Three
of the four were the same nginx shell, and none of them was right unless the
gateway's route was, so they became one. No resource was renamed; the merge
moved ArgoCD's instance label and restarted nothing.

## gateway/ — the hosted MCP gateway

The hosted half of Innkeeper: an MCP gateway that is also the OAuth 2.1
authorization server, where the login and the risky tool calls are approved
on a phone. Source: `a2wio/innkeeper-private` (private).

`/t/` is the one that looks wrong and is not. It is where the iPhone app
reaches a tenant: the app builds its base url from the pairing QR as
`host:port` and prefixes `http://` only when the host has no scheme, so a
hosted tenant's QR carries `h=https://innkeeper.a2w.io/t/<slug>` and `p=443`,
and the app calls `/t/<slug>:443/v1/health`. The gateway takes the port back
off the path.

### The image is interim

`image: python:3.12-slim` with the package mounted from a ConfigMap, not a
built image. The source repo is private and its `build-push` workflow cannot
push `registry.k6nis.dev/innkeeper-gateway` until `ZOT_ADMIN` and
`ZOT_PASSWORD` are set on it. The stock python image carries the
`/usr/bin/openssl` that verifies a phone's signature, which is the only
binary the running service needs; `curl` is not there, so APNs push cannot
work until the built image is in.

The ConfigMap is applied from the private repo, never from here — this repo
is public:

    git clone git@github.com:a2wio/innkeeper-private.git
    cd innkeeper-private && ./deploy/apply.sh

### One replica, and not a choice

Tenants are directories on a ReadWriteOnce volume, laid out exactly like a
self-hosted Innkeeper's home on a Mac, and a gated tool call holds its own
thread until a face answers. `Recreate` for the same reason: a new pod cannot
mount the volume while the old one holds it. Postgres and a shared store are
the named follow-up.

**Losing `innkeeper-data` is losing every pairing.** There is no second copy,
on purpose — a second copy of a pairing is a second thing that can approve.
There is also no cluster backup at all; see `craft/k6nis-cluster`.

### The secret

`innkeeper-secrets` holds `INNKEEPER_SECRET`, the key every access token this
service mints is signed with. Rotating it signs every MCP client out, which
is the correct blast radius. Sealed the way the relay's Upstash credentials
are.

## landing/ — the page at `/`

The marketing page. Stock `nginx:1.27-alpine` serving three mounted
ConfigMaps. No image, no registry, no build.

**The page content is not in this repo.** It lives in `a2wio/innkeeper-landing`,
and the three ConfigMaps the Deployment mounts are applied from there:

    git clone git@github.com:a2wio/innkeeper-landing.git && cd innkeeper-landing
    kubectl apply -k . --server-side

`--server-side` is required: the assets ConfigMap is ~450 KB and a
client-side apply would write all of it into a 262,144-byte annotation.

Editing the page is a commit there and one `kubectl apply -k`. Kubelet syncs
a mounted ConfigMap in place, so the pod never restarts; allow ~60s for the
mount to catch up.

### Adding a page or an asset, which is not the same thing

The `site` volume is a projection with an explicit `items` list, so a new key
in the ConfigMap is not mounted until it is named here as well. `/docs` was a
404 for exactly that reason. Apply the ConfigMaps first — a listed key the
ConfigMap does not have keeps the pod from starting — then, in this order:

1. add the key to `landing/deployment.yml` and sync `innkeeper-web`;
2. if `nginx.conf` changed too — a new `location` block for the path —
   restart the Deployment. nginx reads its config once, at start, so a
   mounted config that changed underneath it is a config it is not serving.

### If it ever earns an image

`a2wio/innkeeper-landing` is a few HTML files, one script and a handful of
images, all small enough for ConfigMaps, so it probably will not. If it does,
that repo needs `ZOT_ADMIN` and `ZOT_PASSWORD` as Actions secrets (the same
pair `a2wio/agentgrant` uses for the relay image), and the Deployment should
pin a short-sha tag rather than `:latest` — see `applications/a2w` for why.

## app/ — the dashboard at `/app`

Stock `nginx:1.27-alpine` serving three mounted ConfigMaps. No image, no
registry, no build.

**The dashboard itself is not in this repo.** It lives in `a2wio/innkeeper-app`,
and the three ConfigMaps the Deployment mounts are applied from there:

    git clone git@github.com:a2wio/innkeeper-app.git && cd innkeeper-app
    kubectl apply -k . --server-side

Editing the dashboard is a commit there and one `kubectl apply -k`. Kubelet
syncs a mounted ConfigMap in place, so the pod never restarts; allow ~60s for
the mount to catch up. The exception is `nginx.conf`, which nginx will not
reload by itself — that one needs a `rollout restart`.

### The /app prefix

The HTTPRoute forwards `/app` to this Service **without** a URLRewrite filter,
so the pod sees `/app/audit`, not `/audit`. The dashboard's own `nginx.conf`
strips the prefix internally, and it also serves the same files at the root, so
adding a rewrite filter to the route later would not break it either way.

## downloads/ — the Mac app

`innkeeper.a2w.io/download/Innkeeper.pkg` (the installer: Continue, Continue,
Install, and it is in /Applications and open) and `/download/Innkeeper.dmg`
(the disk image, for anyone who would rather drag). Stock `nginx:1.27-alpine`
serving one directory off a volume, and only that directory: `/download/` is
the whole of what it answers, the rest is a 404, and `/healthz` is for the
probes. The route sends exactly those two paths here; `/download` the page
goes to the landing like everything else.

The file is not in git. It is signed with a Developer ID, notarized and
stapled on a Mac in `a2wio/innkeeper` (`apps/macos/Tools/make-pkg.sh` and
`make-dmg.sh`, then `notarize.sh`), and copied into the volume by hand:

    pod=$(kubectl -n innkeeper get pod -l app=innkeeper-downloads -o jsonpath='{.items[0].metadata.name}')
    kubectl -n innkeeper cp Innkeeper.pkg "$pod":/usr/share/nginx/html/download/Innkeeper.pkg
    kubectl -n innkeeper cp Innkeeper.dmg "$pod":/usr/share/nginx/html/download/Innkeeper.dmg

The volume is a `local-path` claim, so it lives on the node the pod runs on
and survives a restart; a new build is the same copy again. nginx says
`Cache-Control: no-cache` on the file, and Cloudflare, which sits in front of
the host, replaces that with its own four-hour browser TTL and keeps a copy
at the edge. So after copying a new build in, purge both URLs in the
Cloudflare dashboard (Caching, Purge by URL), or the old build is what the
next download gets for a few hours.
