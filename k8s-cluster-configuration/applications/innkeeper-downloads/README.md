# innkeeper-downloads

The Mac app, at `innkeeper.a2w.io/download/Innkeeper.pkg` (the installer:
Continue, Continue, Install, and it is in /Applications and open) and
`/download/Innkeeper.dmg` (the disk image, for anyone who would rather drag).
Stock `nginx:1.27-alpine` serving one directory off a volume, and only
that directory: `/download/` is the whole of what it answers, the rest
is a 404, and `/healthz` is for the probes.

The file is not in git. It is signed with a Developer ID, notarized and
stapled on a Mac in `a2wio/innkeeper` (`apps/macos/Tools/make-dmg.sh`,
then notarytool and stapler), and copied into the volume by hand:

    pod=$(kubectl -n innkeeper get pod -l app=innkeeper-downloads -o jsonpath='{.items[0].metadata.name}')
    kubectl -n innkeeper cp Innkeeper.pkg "$pod":/usr/share/nginx/html/download/Innkeeper.pkg
    kubectl -n innkeeper cp Innkeeper.dmg "$pod":/usr/share/nginx/html/download/Innkeeper.dmg

The volume is a `local-path` claim, so it lives on the node the pod
runs on and survives a restart; a new build is the same copy again.
nginx says `Cache-Control: no-cache` on the file, and Cloudflare, which
sits in front of the host, replaces that with its own four-hour browser
TTL and keeps a copy at the edge. So after copying a new build in, purge
both URLs in the Cloudflare dashboard (Caching, Purge by URL), or the old build is what the next
download gets for a few hours.

## What this app does not own

The namespace and the HTTPRoute belong to `applications/innkeeper-gateway`;
that route sends exactly `/download/Innkeeper.pkg` and `/download/Innkeeper.dmg`
here and everything
else, `/download` the page included, to the landing. This app contributes one Service, `innkeeper-downloads` on port
80, a claim, and a ConfigMap with the nginx server block.
