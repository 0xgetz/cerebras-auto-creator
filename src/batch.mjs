#!/usr/bin/env node
/**
 * Run the creator N times, one browser context per run.
 * Usage: ACCOUNTS=5 node src/batch.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const count = Number(process.env.ACCOUNTS || 1);
const outDir = process.env.OUT_DIR || "outputs";
fs.mkdirSync(outDir, { recursive: true });

const results = [];
for (let i = 1; i <= count; i++) {
  console.log(`\n===== Run ${i}/${count} =====`);
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join("src", "create.mjs")], {
      stdio: "inherit",
      env: { ...process.env, OUT_DIR: outDir },
    });
    child.on("close", resolve);
  });
  results.push(code);
}

// Collect every generated account file into one CSV.
const files = fs
  .readdirSync(outDir)
  .filter((f) => f.startsWith("cerebras-account-") && f.endsWith(".json"));
const rows = [["email", "inbox_password", "full_name", "company", "key_name", "api_key", "status", "note"]];
for (const f of files) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(outDir, f), "utf8"));
    rows.push([
      j.email, j.inboxPassword, j.fullName, j.company, j.keyName,
      j.apiKey || "", j.status, j.note || "",
    ]);
  } catch {}
}
const csv = rows
  .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
  .join("\n");
fs.writeFileSync(path.join(outDir, "cerebras-accounts.csv"), csv);
console.log(`\nWrote ${path.join(outDir, "cerebras-accounts.csv")}`);
