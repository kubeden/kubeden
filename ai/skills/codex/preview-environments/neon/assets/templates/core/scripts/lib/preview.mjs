import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadConfig } from "./config.mjs";
import { readJson, writeJson } from "./files.mjs";

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export function optionalEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function redactedArgs(args) {
  const secretFlags = new Set(["--token", "-t", "--access-token", "--api-key", "--password"]);
  return args.map((arg, index) => {
    if (secretFlags.has(args[index - 1])) return "[redacted]";
    if (/TOKEN|PASSWORD|SECRET|API_KEY|DATABASE_URL/i.test(arg) && arg.includes("=")) {
      return arg.replace(/=.*/, "=[redacted]");
    }
    if (/postgres(?:ql)?:\/\//i.test(arg)) return "[redacted database url]";
    return arg;
  });
}

export function run(command, args, options = {}) {
  console.log(`+ ${command} ${redactedArgs(args).join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", ...options });
}

export function runCapture(command, args, options = {}) {
  console.log(`+ ${command} ${redactedArgs(args).join(" ")}`);
  return execFileSync(command, args, { encoding: "utf8", ...options }).trim();
}

export function tryRun(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  return result.status === 0;
}

export function slug(value, maxLength = 42) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, maxLength)
    .replace(/-+$/g, "") || "preview";
}

export async function previewPaths() {
  const config = await loadConfig();
  return {
    urlFile: config.preview.urlFile || ".agent/runtime/preview-url.txt",
    metadataFile: config.preview.metadataFile || ".agent/runtime/preview.json"
  };
}

export async function writePreviewMetadata(metadata) {
  const paths = await previewPaths();
  await mkdir(dirname(paths.urlFile), { recursive: true });
  await writeFile(paths.urlFile, `${metadata.url || ""}\n`);
  await writeJson(paths.metadataFile, metadata);
}

export async function readPreviewMetadata(fallback = {}) {
  const paths = await previewPaths();
  return readJson(paths.metadataFile, fallback);
}

export function secondsFromEnv(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number.`);
  return value;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkUrl(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    return { ok: response.ok, detail: `${response.status} ${response.statusText}`.trim() };
  } catch (error) {
    return { ok: false, detail: error.message };
  }
}

export async function waitForUrl(url, {
  timeoutSeconds = secondsFromEnv("PREVIEW_URL_WAIT_TIMEOUT_SECONDS", 300),
  intervalSeconds = secondsFromEnv("PREVIEW_URL_WAIT_INTERVAL_SECONDS", 5)
} = {}) {
  if (!url) throw new Error("Preview URL is empty.");
  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastDetail = "";
  while (Date.now() <= deadline) {
    const result = await checkUrl(url);
    lastDetail = result.detail;
    if (result.ok) return result;
    console.log(`Preview URL is not ready yet: ${lastDetail}`);
    await sleep(intervalSeconds * 1000);
  }
  throw new Error(`Preview URL did not become reachable within ${timeoutSeconds}s. Last result: ${lastDetail}`);
}
