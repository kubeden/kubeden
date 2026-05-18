#!/usr/bin/env node
import { readPreviewMetadata, waitForUrl } from "./lib/preview.mjs";

const preview = await readPreviewMetadata();
const result = await waitForUrl(preview.url);
console.log(`Preview URL is reachable: ${result.detail}`);
