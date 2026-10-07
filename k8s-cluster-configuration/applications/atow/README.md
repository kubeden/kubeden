# atow

`atow.org`: the atow AI safety research website. An Astro site built to
static HTML and served by `nginx:1.27-alpine` on 8080, packaged as
`registry.k6nis.dev/atow/website` by the build-push workflow in the site
repo (`kubeden/atow`, checked out at `~/Developer/atow/website`).
`www.atow.org` redirects to the apex.

The Deployment pins the short-sha tag the workflow pushed. To ship a
change: push to the site repo, wait for the build, set the new tag in
`base/deployment.yml`, push here and sync `atow`.

DNS: external-dns writes the records through Cloudflare, so the `atow.org`
zone has to be in the same Cloudflare account as the cluster's other zones
before the Gateway gets an address anyone can reach, and before
cert-manager can complete the certificate.
