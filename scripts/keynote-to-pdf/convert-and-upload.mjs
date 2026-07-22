#!/usr/bin/env node
// Watch-folder worker: converts Keynote (.key) and Pages (.pages) documents to
// PDF using the locally installed Apple apps (via AppleScript), then uploads the
// PDF straight into the course platform's Supabase storage + `materials` table.
//
// It uses only Node built-ins (global fetch) and talks to Supabase's REST +
// Storage HTTP API with the service-role key, mirroring exactly what
// POST /api/admin/materials does. No npm dependencies, so it can live and run
// from anywhere — the installer copies it to a stable location. No changes to
// the deployed app are needed.
//
// Triggered by a launchd LaunchAgent (see install.sh) whenever a file lands in
// the inbox, plus a periodic safety sweep.

import { readFileSync, existsSync } from "node:fs";
import {
  readdir,
  stat,
  mkdir,
  rename,
  copyFile,
  readFile,
  writeFile,
  unlink,
  open,
} from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, dirname, basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(TOOL_DIR, "..", "..");

// ── Config ────────────────────────────────────────────────────────────────
loadEnvFiles();

const HOME = homedir();
const INBOX = process.env.KP_INBOX || join(HOME, "CourseInbox");
const PROCESSED = process.env.KP_PROCESSED || join(HOME, "CourseInbox Processed");
const FAILED = process.env.KP_FAILED || join(HOME, "CourseInbox Failed");
const LOG_DIR =
  process.env.KP_LOG_DIR || join(HOME, "Library", "Logs", "keynote-to-pdf");
const LOCK = join(tmpdir(), "keynote-to-pdf.lock");

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
  /\/+$/,
  "",
);
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_MATERIALS_BUCKET || "course-materials";

// A file must be untouched for this long before we treat it as "done copying".
const SETTLE_MS = 2500;
const MAX_LOCK_AGE_MS = 10 * 60 * 1000;

// ── Entry ───────────────────────────────────────────────────────────────────
main().catch(async (err) => {
  await log(`FATAL ${err?.stack || err}`);
  process.exit(1);
});

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    await log(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Point KP_ENV_FILE at an env file that defines them. Aborting.",
    );
    process.exit(1);
  }

  await mkdir(INBOX, { recursive: true });
  await mkdir(LOG_DIR, { recursive: true });

  if (!(await acquireLock())) return; // another run is active
  try {
    const candidates = await findSettledDocuments();
    if (candidates.length === 0) return;

    for (const file of candidates) {
      await processOne(file).catch(async (err) => {
        await fail(file, err?.message || String(err));
      });
    }
  } finally {
    await unlink(LOCK).catch(() => {});
  }
}

// ── Core ──────────────────────────────────────────────────────────────────
async function processOne(filePath) {
  const ext = extname(filePath).toLowerCase();
  const base = basename(filePath, extname(filePath));
  const app = ext === ".key" ? "Keynote" : "Pages";
  await log(`→ Converting "${basename(filePath)}" with ${app}…`);

  // 1. Export to PDF via the right Apple app.
  const tmpPdf = join(tmpdir(), `${randomUUID()}.pdf`);
  const script =
    ext === ".key"
      ? join(TOOL_DIR, "export-keynote.applescript")
      : join(TOOL_DIR, "export-pages.applescript");
  await runOsascript(script, filePath, tmpPdf);
  if (!existsSync(tmpPdf)) {
    throw new Error(`${app} did not produce a PDF (export failed)`);
  }

  // 2. Upload the PDF to Supabase storage + insert the materials row,
  //    mirroring POST /api/admin/materials.
  const buffer = await readFile(tmpPdf);
  const storagePath = `algemeen/${randomUUID()}-${slug(base)}.pdf`;

  await sbUploadObject(storagePath, buffer);
  try {
    await sbInsertMaterial({
      course_date_id: null, // "algemeen" — visible to all participants
      title: base,
      storage_path: storagePath,
      mime_type: "application/pdf",
      size_bytes: buffer.length,
    });
  } catch (err) {
    // Roll back the uploaded object so we don't leave orphans.
    await sbDeleteObject(storagePath).catch(() => {});
    throw err;
  }

  // 3. Keep a local copy of the PDF next to the archived original, then
  //    move the original out of the inbox so it is not processed again.
  await mkdir(PROCESSED, { recursive: true });
  await copyFile(tmpPdf, await freePath(PROCESSED, `${base}.pdf`));
  await moveInto(filePath, PROCESSED);
  await unlink(tmpPdf).catch(() => {});

  await log(`✓ Uploaded "${base}" → materials (${storagePath})`);
}

async function fail(filePath, message) {
  await log(`✗ FAILED "${basename(filePath)}": ${message}`);
  try {
    await mkdir(FAILED, { recursive: true });
    const base = basename(filePath, extname(filePath));
    await writeFile(
      await freePath(FAILED, `${base}.error.txt`),
      `${new Date().toISOString()}\n${message}\n`,
    );
    await moveInto(filePath, FAILED);
  } catch (err) {
    await log(`  (could not move failed file: ${err?.message || err})`);
  }
}

// ── Supabase HTTP (service-role; bypasses RLS) ──────────────────────────────
function sbHeaders(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    ...extra,
  };
}

async function sbUploadObject(objectPath, buffer) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeStoragePath(objectPath)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: sbHeaders({
      "Content-Type": "application/pdf",
      "x-upsert": "false",
      "cache-control": "3600",
    }),
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(
      `Storage upload failed (${res.status}): ${(await res.text()).slice(0, 300)}`,
    );
  }
}

async function sbDeleteObject(objectPath) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeStoragePath(objectPath)}`;
  const res = await fetch(url, { method: "DELETE", headers: sbHeaders() });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Storage delete failed (${res.status})`);
  }
}

async function sbInsertMaterial(row) {
  const url = `${SUPABASE_URL}/rest/v1/materials`;
  const res = await fetch(url, {
    method: "POST",
    headers: sbHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(
      `DB insert failed (${res.status}): ${(await res.text()).slice(0, 300)}`,
    );
  }
}

// Encode each path segment but keep the "/" separators intact.
function encodeStoragePath(p) {
  return p.split("/").map(encodeURIComponent).join("/");
}

// ── Inbox scanning ──────────────────────────────────────────────────────────
async function findSettledDocuments() {
  let entries;
  try {
    entries = await readdir(INBOX);
  } catch {
    return [];
  }

  const out = [];
  for (const name of entries) {
    if (name.startsWith(".")) continue;
    const ext = extname(name).toLowerCase();
    if (ext !== ".key" && ext !== ".pages") continue;

    const full = join(INBOX, name);
    let s;
    try {
      s = await stat(full);
    } catch {
      continue;
    }

    // Skip anything modified very recently — it may still be copying.
    if (Date.now() - s.mtimeMs < SETTLE_MS) continue;

    // For flat files, double-check the size is stable.
    if (s.isFile()) {
      const size1 = s.size;
      await sleep(1200);
      let s2;
      try {
        s2 = await stat(full);
      } catch {
        continue;
      }
      if (s2.size !== size1) continue; // still growing
    }

    out.push(full);
  }
  return out;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function runOsascript(scriptPath, inPath, outPath) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("/usr/bin/osascript", [scriptPath, inPath, outPath], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`osascript exited ${code}: ${stderr.trim()}`));
    });
  });
}

function slug(name) {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "materiaal";
}

// Return a path inside `dir` for `name` that does not collide (adds " (n)").
async function freePath(dir, name) {
  const ext = extname(name);
  const stem = basename(name, ext);
  let candidate = join(dir, name);
  let n = 1;
  while (existsSync(candidate)) {
    candidate = join(dir, `${stem} (${n})${ext}`);
    n += 1;
  }
  return candidate;
}

async function moveInto(filePath, destDir) {
  await mkdir(destDir, { recursive: true });
  const dest = await freePath(destDir, basename(filePath));
  await rename(filePath, dest);
}

async function acquireLock() {
  try {
    const fh = await open(LOCK, "wx");
    await fh.writeFile(String(process.pid));
    await fh.close();
    return true;
  } catch (err) {
    if (err?.code !== "EEXIST") throw err;
    // Steal a stale lock left behind by a crashed run.
    try {
      const s = await stat(LOCK);
      if (Date.now() - s.mtimeMs > MAX_LOCK_AGE_MS) {
        await unlink(LOCK).catch(() => {});
        return acquireLock();
      }
    } catch {
      /* ignore */
    }
    return false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadEnvFiles() {
  const files = [
    process.env.KP_ENV_FILE,
    join(TOOL_DIR, ".env"),
    join(REPO_ROOT, ".env.local"),
  ].filter(Boolean);
  for (const file of files) {
    if (!existsSync(file)) continue;
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

async function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const fh = await open(join(LOG_DIR, "convert.log"), "a");
    await fh.writeFile(line + "\n");
    await fh.close();
  } catch {
    /* logging is best-effort */
  }
}
