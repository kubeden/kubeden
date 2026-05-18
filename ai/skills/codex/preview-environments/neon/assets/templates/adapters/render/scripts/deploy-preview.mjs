#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { requiredEnv, writePreviewMetadata } from "./lib/preview.mjs";
import { setOutput } from "./lib/output.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "render");
const prNumber = requiredEnv("PR_NUMBER");
const deployHookUrl = process.env.RENDER_DEPLOY_HOOK_URL || adapter.deployHookUrl || "";
const apiKey = process.env.RENDER_API_KEY || "";
const serviceId = process.env.RENDER_SERVICE_ID || adapter.serviceId || "";

async function renderRequest(path, options = {}) {
  if (!apiKey) throw new Error("RENDER_API_KEY is required for Render API mode.");
  const response = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Render API ${response.status}: ${data?.message ?? response.statusText}`);
  return data;
}

let deploymentId = "";
if (serviceId && apiKey) {
  for (const [key, value] of Object.entries({
    DATABASE_URL: process.env.DATABASE_URL,
    VITE_NEON_AUTH_URL: process.env.VITE_NEON_AUTH_URL,
    VITE_NEON_DATA_API_URL: process.env.VITE_NEON_DATA_API_URL
  })) {
    if (!value) continue;
    await renderRequest(`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value })
    });
  }
}

if (deployHookUrl) {
  const response = await fetch(deployHookUrl, { method: "POST" });
  if (!response.ok) throw new Error(`Render deploy hook failed: ${response.status} ${response.statusText}`);
  deploymentId = `hook-${Date.now()}`;
} else if (serviceId) {
  const deploy = await renderRequest(`/services/${serviceId}/deploys`, {
    method: "POST",
    body: JSON.stringify({ clearCache: "do_not_clear" })
  });
  deploymentId = deploy.id || deploy.deploy?.id || "";
} else {
  throw new Error("Render adapter requires RENDER_DEPLOY_HOOK_URL or RENDER_SERVICE_ID.");
}

const url = process.env.PREVIEW_URL || adapter.previewUrl || "";
await writePreviewMetadata({
  provider: "render",
  url,
  resourceName: serviceId || `render-pr-${prNumber}`,
  resourceId: deploymentId,
  cleanup: { enabled: false },
  details: { serviceId, deploymentId }
});

setOutput("url", url);
setOutput("deployment_id", deploymentId);
console.log(url ? `Preview URL: ${url}` : "Render deploy triggered. Set PREVIEW_URL or adapters.render.previewUrl to enable URL polling.");
