#!/bin/bash
set -euo pipefail

SRC="registry.digitalocean.com/kubeden"
DST="registry.k6nis.dev"

# Log in to both registries
echo "==> Logging in to DigitalOcean registry..."
doctl registry login

echo "==> Logging in to Zot registry..."
podman login "$DST"

REPOS=(
  "a2w-sre:v0.3"
  "a2w-sre-agent:v0.1"
  "a2w-sre-dashboard:v0.1,v0.2"
  "a2w/landing:v3,v2,v1"
  "a2w/lucas:v0.1"
  "a2w/lucas-dashboard:v0.1"
  "a2w/lucas-docs:v1"
  "clopus-watcher:v0.3,v0.2,v0.1"
  "clopus-watcher-dashboard:v0.2,v0.1"
  "globchess:latest"
  "kubeden-api:f45fe6b,375181e,3bc1594,a2ca675,c51d56b,220f722,5f7e3a5,521eeea,b382480,2270519"
  "kubeden-client:f45fe6b,2270519"
  "kubeden-unemployment:latest"
  "markdown-editor:pr-16,pr-14,pr-6,pr-5,pr-4,pr-3,pr-2,pr-1"
  "notate:latest"
  "txtwrite:breakable,intentional-error,intentional-error-v2,latest"
)

FAILED=()

for entry in "${REPOS[@]}"; do
  repo="${entry%%:*}"
  tags_str="${entry#*:}"
  IFS=',' read -ra tags <<< "$tags_str"

  for tag in "${tags[@]}"; do
    src_image="$SRC/$repo:$tag"
    dst_image="$DST/$repo:$tag"

    echo ""
    echo "==> Migrating $src_image -> $dst_image"

    if podman pull "$src_image" && \
       podman tag "$src_image" "$dst_image" && \
       podman push "$dst_image"; then
      echo "    OK"
      podman rmi "$src_image" "$dst_image" 2>/dev/null || true
    else
      echo "    FAILED: $src_image"
      FAILED+=("$src_image")
    fi
  done
done

echo ""
echo "==> Migration complete!"
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "Failed images:"
  for img in "${FAILED[@]}"; do
    echo "  - $img"
  done
else
  echo "All images migrated successfully."
fi
