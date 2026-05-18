#!/usr/bin/env node
import { readPreviewMetadata, waitForUrl } from "./lib/preview.mjs";

const preview = await readPreviewMetadata();
if (!preview.url) {
  console.log("Railway preview URL is not known; skipping URL polling. Configure adapters.railway.domainSuffix or PREVIEW_URL for automatic polling.");
  process.exit(0);
}
const result = await waitForUrl(preview.url);
console.log(`Preview URL is reachable: ${result.detail}`);
