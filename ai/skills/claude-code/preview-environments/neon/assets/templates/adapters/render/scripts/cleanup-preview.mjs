#!/usr/bin/env node
import { readPreviewMetadata } from "./lib/preview.mjs";

const preview = await readPreviewMetadata({});
console.log(`Render cleanup is a no-op in the template. Resource: ${preview.resourceName || "unknown"}.`);
console.log("Adapt this script only if your Render setup creates disposable PR-specific services.");
