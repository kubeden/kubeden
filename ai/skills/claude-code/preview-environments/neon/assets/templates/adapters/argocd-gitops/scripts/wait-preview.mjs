#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { readPreviewMetadata, secondsFromEnv, sleep, waitForUrl } from "./lib/preview.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "argocd-gitops");
const preview = await readPreviewMetadata();
const argoServer = (process.env.ARGOCD_SERVER || adapter.argocdServer || "").replace(/\/+$/, "");
const argoToken = process.env.ARGOCD_AUTH_TOKEN || "";
const appName = preview.resourceName;
const appNamespace = process.env.ARGOCD_APPLICATION_NAMESPACE || adapter.applicationNamespace || "argocd";

async function fetchArgoApplication() {
  const url = new URL(`/api/v1/applications/${encodeURIComponent(appName)}`, argoServer);
  if (appNamespace) url.searchParams.set("appNamespace", appNamespace);
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${argoToken}`
    }
  });
  const text = await response.text();
  if (response.status === 404) return { exists: false, detail: "application has not been created yet" };
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw new Error(`Argo CD API ${response.status}: ${text}`);
    return { exists: false, transient: true, detail: `Argo CD API ${response.status}: ${text}` };
  }
  return { exists: true, app: text ? JSON.parse(text) : {} };
}

if (argoServer && argoToken) {
  const timeoutSeconds = secondsFromEnv("PREVIEW_WAIT_TIMEOUT_SECONDS", 600);
  const intervalSeconds = secondsFromEnv("PREVIEW_WAIT_INTERVAL_SECONDS", 5);
  const deadline = Date.now() + timeoutSeconds * 1000;
  let healthy = false;
  while (Date.now() <= deadline) {
    const result = await fetchArgoApplication();
    if (result.exists) {
      const sync = result.app?.status?.sync?.status || "Unknown";
      const health = result.app?.status?.health?.status || "Unknown";
      console.log(`${appName}: sync=${sync} health=${health}`);
      if (sync === "Synced" && health === "Healthy") {
        healthy = true;
        break;
      }
    } else {
      console.log(`${appName}: ${result.detail}`);
    }
    await sleep(intervalSeconds * 1000);
  }
  if (!healthy) throw new Error(`Argo CD app ${appName} did not become Synced and Healthy within ${timeoutSeconds}s.`);
} else {
  console.log("ARGOCD_SERVER or ARGOCD_AUTH_TOKEN not configured; falling back to URL-only polling.");
}

const result = await waitForUrl(preview.url);
console.log(`Preview URL is reachable: ${result.detail}`);
