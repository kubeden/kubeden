#!/usr/bin/env node
import { readPreviewMetadata, run, requiredEnv, tryRun } from "./lib/preview.mjs";

requiredEnv("FLY_API_TOKEN");
if (!tryRun("fly", ["version"])) {
  run("bash", ["-lc", "curl -L https://fly.io/install.sh | sh"]);
  process.env.PATH = `${process.env.HOME}/.fly/bin:${process.env.PATH}`;
}
const preview = await readPreviewMetadata({});
const appName = preview.details?.appName || preview.resourceName || "";
if (!appName) {
  console.log("No Fly app was recorded; cleanup skipped.");
  process.exit(0);
}
run("fly", ["apps", "destroy", appName, "--yes"]);
console.log(`Destroyed Fly app ${appName}.`);
