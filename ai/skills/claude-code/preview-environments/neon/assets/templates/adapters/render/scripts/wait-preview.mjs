#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { readPreviewMetadata, requiredEnv, sleep, waitForUrl, secondsFromEnv } from "./lib/preview.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "render");
const preview = await readPreviewMetadata();

async function renderRequest(path) {
  const apiKey = requiredEnv("RENDER_API_KEY");
  const response = await fetch(`https://api.render.com/v1${path}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Render API ${response.status}: ${data?.message ?? response.statusText}`);
  return data;
}

if (preview.details?.serviceId && preview.resourceId && !String(preview.resourceId).startsWith("hook-") && process.env.RENDER_API_KEY) {
  const timeoutSeconds = secondsFromEnv("PREVIEW_WAIT_TIMEOUT_SECONDS", 600);
  const intervalSeconds = secondsFromEnv("PREVIEW_WAIT_INTERVAL_SECONDS", 10);
  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() <= deadline) {
    const deploy = await renderRequest(`/services/${preview.details.serviceId}/deploys/${preview.resourceId}`);
    const status = deploy.status || deploy.deploy?.status || "";
    console.log(`Render deploy status: ${status || "unknown"}`);
    if (["live", "succeeded"].includes(String(status).toLowerCase())) break;
    if (["failed", "canceled", "cancelled"].includes(String(status).toLowerCase())) {
      throw new Error(`Render deploy ended with status ${status}.`);
    }
    await sleep(intervalSeconds * 1000);
  }
}

if (!preview.url) {
  console.log("Render preview URL is not known; skipping URL polling.");
  process.exit(0);
}
const result = await waitForUrl(preview.url, { timeoutSeconds: adapter.urlTimeoutSeconds || undefined });
console.log(`Preview URL is reachable: ${result.detail}`);
