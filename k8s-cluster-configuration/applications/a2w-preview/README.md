# A2W landing preview

Independent Next.js landing preview. Source: `a2wio/website`, branch `preview/a2w-landing`.

The website workflow builds immutable image tags. Update `base/deployment.yml` with the successful build commit, then sync this Argo CD application. No automatic synchronization is enabled.

Bootstrap the namespace with a `registry-credentials` image-pull secret using the existing cluster registry credentials; never commit credentials. DNS is managed by ExternalDNS, TLS by cert-manager. Both the app and HTTPRoute send noindex headers. The hostname is public in DNS, certificate transparency, and this repository; this is unlisted, not private.
