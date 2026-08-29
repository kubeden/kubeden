# innkeeper-gateway

The hosted half of Innkeeper: an MCP gateway that is also the OAuth 2.1
authorization server, where the login and the risky tool calls are approved
on a phone. Source: `a2wio/innkeeper-private` (private).

This app owns the `innkeeper` namespace and the single HTTPRoute that splits
`innkeeper.a2w.io` three ways:

    /                             -> innkeeper-landing:80
    /app                          -> innkeeper-app:80
    /s/ /t/ /v1 /oauth
    /.well-known /pair            -> innkeeper-gateway:8080

All three backends are wired whether or not their Services exist; a missing
one answers 503, which is the honest thing for a page that has not shipped.

`/t/` is the one that looks wrong and is not. It is where the iPhone app
reaches a tenant: the app builds its base url from the pairing QR as
`host:port` and prefixes `http://` only when the host has no scheme, so a
hosted tenant's QR carries `h=https://innkeeper.a2w.io/t/<slug>` and `p=443`,
and the app calls `/t/<slug>:443/v1/health`. The gateway takes the port back
off the path.

## The image is interim

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

## One replica, and not a choice

Tenants are directories on a ReadWriteOnce volume, laid out exactly like a
self-hosted Innkeeper's home on a Mac, and a gated tool call holds its own
thread until a face answers. `Recreate` for the same reason: a new pod cannot
mount the volume while the old one holds it. Postgres and a shared store are
the named follow-up.

**Losing `innkeeper-data` is losing every pairing.** There is no second copy,
on purpose — a second copy of a pairing is a second thing that can approve.
There is also no cluster backup at all; see `craft/k6nis-cluster`.

## The secret

`innkeeper-secrets` holds `INNKEEPER_SECRET`, the key every access token this
service mints is signed with. Rotating it signs every MCP client out, which
is the correct blast radius. Sealed the way the relay's Upstash credentials
are.
