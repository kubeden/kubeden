#!/usr/bin/env node
import { execSync } from "node:child_process";
import { parseArgs } from "./lib/args.mjs";
import { loadConfig } from "./lib/config.mjs";
import { setOutput } from "./lib/output.mjs";

const args = parseArgs();
const name = args._?.[0];
if (!name) throw new Error("Usage: node scripts/run-configured-command.mjs <command-name>");

const config = await loadConfig();
const command =
  config.commands?.[name] ||
  config.preview?.commands?.[name.replace(/^preview/, "").replace(/^./, (char) => char.toLowerCase())] ||
  config.preview?.[`${name}Command`] ||
  config.production?.[`${name.replace(/^production/, "").replace(/^./, (char) => char.toLowerCase())}Command`] ||
  "";

if (!command || /^__.*__$/.test(command)) {
  console.log(`No ${name} command configured; skipping.`);
  setOutput("skipped", "true");
  process.exit(0);
}

console.log(`Running configured ${name} command: ${command}`);
execSync(command, {
  stdio: "inherit",
  shell: process.env.SHELL || "/bin/bash",
  env: process.env
});
setOutput("skipped", "false");
