import { appendFileSync } from "node:fs";

export function setOutput(name, value) {
  const text = String(value ?? "");
  console.log(`${name}=${text}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${text.replace(/\n/g, "%0A")}\n`);
  }
}

export function mask(value) {
  if (value) console.log(`::add-mask::${value}`);
}
