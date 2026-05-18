#!/usr/bin/env node
import { readPreviewMetadata } from "./lib/preview.mjs";

const preview = await readPreviewMetadata({});
console.log(`Cloudflare Pages cleanup is a no-op in the template. Preview resource: ${preview.resourceName || "unknown"}.`);
console.log("Adapt this script to delete deployments if your Cloudflare retention policy requires immediate cleanup.");
