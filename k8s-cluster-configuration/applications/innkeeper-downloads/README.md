# innkeeper-downloads

The Mac app's disk image, at `innkeeper.a2w.io/download/Innkeeper.dmg`.
Stock `nginx:1.27-alpine` serving one directory off a volume, and only
that directory: `/download/` is the whole of what it answers, the rest
is a 404, and `/healthz` is for the probes.

The file is not in git. It is signed with a Developer ID, notarized and
stapled on a Mac in `a2wio/innkeeper` (`apps/macos/Tools/make-dmg.sh`,
then notarytool and stapler), and copied into the volume by hand:

    pod=$(kubectl -n innkeeper get pod -l app=innkeeper-downloads -o jsonpath='{.items[0].metadata.name}')
    kubectl -n innkeeper cp Innkeeper.dmg "$pod":/usr/share/nginx/html/download/Innkeeper.dmg

The volume is a `local-path` claim, so it lives on the node the pod
runs on and survives a restart; a new build is the same copy again.
`Cache-Control: no-cache` on the file, so a new build is what the next
download gets — Cloudflare sits in front of the host and would
otherwise keep the old one.

## What this app does not own

The namespace and the HTTPRoute belong to `applications/innkeeper-gateway`;
that route sends `/download/` here and `/download` (the page) to the
landing. This app contributes one Service, `innkeeper-downloads` on port
80, a claim, and a ConfigMap with the nginx server block.
