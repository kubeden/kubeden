#!/bin/bash

# Sync an ArgoCD Application without losing its syncOptions.
#
# There is no logged-in argocd CLI on this machine, so a sync is triggered by
# patching the Application:
#
#     kubectl -n argocd patch application <app> --type merge \
#       -p '{"operation":{"sync":{"revision":"main"}}}'
#
# That patch does NOT inherit spec.syncPolicy.syncOptions. The operation runs
# with no options at all, and the app's own options are silently dropped:
#
#   CreateNamespace=true   never runs; every object fails "namespaces not found"
#   ServerSideApply=true   falls back to client-side apply, which writes the
#                          whole object into last-applied-configuration and dies
#                          at the 262144-byte annotation limit. kyverno's
#                          policies/clusterpolicies CRDs are ~650KB — 2.5x over.
#   PruneLast=true         see the --prune note below; this one lies.
#
# So: read the options off the live Application and put them in the patch.
#
#   ./scripts/argocd-sync.sh <app> [revision] [--prune]
#
# Reads the app's own syncOptions and includes them. Prunes nothing unless you
# ask, and tells you what it is about to do before it does it.

set -euo pipefail

NS=argocd
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

APP="${1:-}"
REVISION="${2:-main}"
PRUNE=false
for arg in "$@"; do
  if [ "$arg" = "--prune" ]; then PRUNE=true; fi
done
if [ "$REVISION" = "--prune" ]; then REVISION=main; fi

if [ -z "$APP" ]; then
  echo "usage: $0 <app> [revision] [--prune]"
  echo
  kubectl -n "$NS" get applications -o custom-columns=APP:.metadata.name,SYNC:.status.sync.status --no-headers
  exit 1
fi

if ! kubectl -n "$NS" get application "$APP" >/dev/null 2>&1; then
  echo -e "${RED}No such Application: $APP${NC}"; exit 1
fi

# The app's own options — the whole point of this script.
OPTS=$(kubectl -n "$NS" get application "$APP" -o json | jq -c '.spec.syncPolicy.syncOptions // []')

if [ "$PRUNE" = true ]; then
  # PruneLast=true makes a patched sync report "successfully synced (no more
  # tasks)" while the prune task never runs — the resource is still there and
  # the parent stays OutOfSync. Success that is not success, so drop it for
  # this operation only. spec.syncPolicy is not touched.
  if echo "$OPTS" | jq -e 'index("PruneLast=true")' >/dev/null; then
    OPTS=$(echo "$OPTS" | jq -c 'map(select(. != "PruneLast=true"))')
    echo -e "${YELLOW}PruneLast=true dropped from this operation — with it the prune silently no-ops.${NC}"
  fi
fi

echo "app        : $APP"
echo "revision   : $REVISION"
echo "syncOptions: $(echo "$OPTS" | jq -r 'if length == 0 then "(none)" else join(", ") end')"
echo "prune      : $PRUNE"

if [ "$PRUNE" = true ]; then
  echo -e "${RED}Prune deletes resources that are no longer in git.${NC}"
  echo -n "Type the app name to confirm: "
  read -r confirm
  [ "$confirm" = "$APP" ] || { echo "Aborted."; exit 1; }
fi

PATCH=$(jq -nc --arg rev "$REVISION" --argjson opts "$OPTS" --argjson prune "$PRUNE" \
  '{operation:{sync:{revision:$rev,syncOptions:$opts,prune:$prune}}}')

kubectl -n "$NS" patch application "$APP" --type merge -p "$PATCH" >/dev/null
echo -e "${GREEN}Sync started.${NC}"

# status.operationState.operation is unreliable here — it has shown a stale
# resource selector from a previous run. syncResult.resources is the honest
# field: its length is what the sync actually touched.
for _ in $(seq 1 60); do
  sleep 2
  PHASE=$(kubectl -n "$NS" get application "$APP" -o jsonpath='{.status.operationState.phase}' 2>/dev/null || true)
  case "$PHASE" in
    Succeeded|Failed|Error)
      COUNT=$(kubectl -n "$NS" get application "$APP" -o json | jq '.status.operationState.syncResult.resources | length // 0')
      MSG=$(kubectl -n "$NS" get application "$APP" -o jsonpath='{.status.operationState.message}' 2>/dev/null || true)
      echo "phase      : $PHASE ($COUNT resources touched)"
      [ -n "$MSG" ] && echo "message    : $MSG"
      kubectl -n "$NS" get application "$APP" \
        -o custom-columns=SYNC:.status.sync.status,HEALTH:.status.health.status --no-headers
      [ "$PHASE" = "Succeeded" ] || exit 1
      exit 0
      ;;
  esac
done

echo -e "${YELLOW}Still running after 2 minutes — check with: kubectl -n $NS get application $APP${NC}"
