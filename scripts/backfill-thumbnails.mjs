/**
 * Backfill thumbnails for existing PDF materials.
 *
 * For every `application/pdf` material without a `thumbnail_path`, this renders
 * the PDF's second page (falling back to page 1), uploads it as a small PNG
 * next to the file in the storage bucket, and records the path on the row.
 *
 * Requires migration 0004 (the `thumbnail_path` column) to be applied first.
 *
 * Run:  node --env-file=.env.local scripts/backfill-thumbnails.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { pdf } from "pdf-to-img";
import { randomUUID } from "node:crypto";

// supabase-js constructs a realtime client that needs a WebSocket; Node 20 has
// none. We never use realtime here, so a no-op constructor satisfies the check.
if (!globalThis.WebSocket) globalThis.WebSocket = class {};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_MATERIALS_BUCKET || "course-materials";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run with: node --env-file=.env.local scripts/backfill-thumbnails.mjs");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

// Guard: make sure migration 0004 has been applied.
const probe = await db.from("materials").select("id, thumbnail_path").limit(1);
if (probe.error) {
  console.error("Could not read `materials.thumbnail_path`.");
  console.error("Apply migration 0004_materials_thumbnail.sql in Supabase first.");
  console.error("Detail:", probe.error.message);
  process.exit(1);
}

const { data: materials, error } = await db
  .from("materials")
  .select("id, title, storage_path")
  .eq("mime_type", "application/pdf")
  .is("thumbnail_path", null);

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

console.log(`Found ${materials.length} PDF material(s) without a thumbnail.`);
let ok = 0;

for (const m of materials) {
  try {
    console.log(`\n• ${m.title}  (${m.storage_path})`);

    const { data: file, error: dlErr } = await db.storage
      .from(bucket)
      .download(m.storage_path);
    if (dlErr || !file) throw new Error(`download failed: ${dlErr?.message ?? "no file"}`);

    const buf = Buffer.from(await file.arrayBuffer());
    const doc = await pdf(buf, { scale: 1.2 });
    const pageNum = Math.min(2, doc.length);
    const png = await doc.getPage(pageNum);

    const folder = m.storage_path.split("/")[0] || "algemeen";
    const thumbPath = `${folder}/thumb-${randomUUID()}.png`;

    const { error: upErr } = await db.storage
      .from(bucket)
      .upload(thumbPath, png, { contentType: "image/png", upsert: false });
    if (upErr) throw new Error(`upload failed: ${upErr.message}`);

    const { error: updErr } = await db
      .from("materials")
      .update({ thumbnail_path: thumbPath })
      .eq("id", m.id);
    if (updErr) throw new Error(`db update failed: ${updErr.message}`);

    console.log(`  ✓ page ${pageNum} → ${thumbPath}`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${e.message}`);
  }
}

console.log(`\nDone. ${ok}/${materials.length} thumbnail(s) created.`);
