"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { capitalize, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { compressPdf } from "@/lib/pdf/compressPdf";
import type { CourseDate, Material } from "@/lib/types";

export type MaterialRow = Material & { course_date: CourseDate | null };

// Compress PDFs larger than this in the browser; keep the hard ceiling below
// the storage bucket limit.
const COMPRESS_ABOVE = 45 * 1024 * 1024;
const MAX_BYTES = 50 * 1024 * 1024;

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

export function MaterialManager({
  materials,
  courseDates,
}: {
  materials: MaterialRow[];
  courseDates: CourseDate[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const courseDateId = form.get("course_date_id")
      ? String(form.get("course_date_id"))
      : null;
    const picked = form.get("file");
    if (!(picked instanceof File) || picked.size === 0) {
      setError("Kies een bestand.");
      return;
    }
    let file = picked;

    setBusy(true);
    try {
      // 1. Compress large PDFs in the browser so the file fits under the limit.
      if (file.type === "application/pdf" && file.size > COMPRESS_ABOVE) {
        const result = await compressPdf(file, {
          maxBytes: COMPRESS_ABOVE,
          onProgress: ({ page, totalPages, attempt, totalAttempts }) =>
            setStatus(
              `PDF verkleinen… pagina ${page}/${totalPages}` +
                (totalAttempts > 1 ? ` (poging ${attempt}/${totalAttempts})` : ""),
            ),
        });
        file = result.file;
        if (file.size > MAX_BYTES) {
          setError(
            `De PDF blijft te groot (${mb(file.size)} MB) na verkleinen. ` +
              "Splits het bestand op in delen.",
          );
          return;
        }
        setStatus(
          `Verkleind van ${mb(result.originalBytes)} naar ${mb(file.size)} MB. Uploaden…`,
        );
      } else if (file.size > MAX_BYTES) {
        setError(`Bestand is te groot (max. ${MAX_BYTES / 1024 / 1024} MB).`);
        return;
      } else {
        setStatus("Uploaden…");
      }

      // 2. Ask the server for a signed upload URL (it owns the storage path).
      const urlRes = await fetch("/api/admin/materials/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          courseDateId,
          filename: file.name,
          mimeType: file.type,
        }),
      });
      if (!urlRes.ok) {
        const p = await urlRes.json().catch(() => ({}));
        setError(p.error ?? "Voorbereiden van de upload is mislukt.");
        return;
      }
      const { bucket, path, token } = await urlRes.json();

      // 3. Upload the file straight to Supabase Storage — not via the server.
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadError) {
        setError("Uploaden naar opslag is mislukt.");
        return;
      }

      // 4. Record the materials row.
      const finalizeRes = await fetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, title, courseDateId, mimeType: file.type }),
      });
      if (!finalizeRes.ok) {
        const p = await finalizeRes.json().catch(() => ({}));
        setError(p.error ?? "Opslaan van het materiaal is mislukt.");
        return;
      }

      formRef.current?.reset();
      setStatus(null);
      router.refresh();
    } catch {
      setError("Er ging iets mis bij het uploaden.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Dit materiaal verwijderen?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form
        ref={formRef}
        onSubmit={upload}
        className="mb-10 space-y-4 rounded-xl border border-line bg-paper p-6"
      >
        <h2 className="font-title text-xl text-ink">Materiaal uploaden</h2>
        <Field label="Titel" htmlFor="title">
          <Input id="title" name="title" required placeholder="Bijv. Lesbrief week 1" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Bij cursusdatum"
            htmlFor="course_date_id"
            hint="Laat leeg voor algemeen materiaal"
          >
            <Select id="course_date_id" name="course_date_id" defaultValue="">
              <option value="">Algemeen (alle deelnemers)</option>
              {courseDates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} — {formatDate(d.starts_at)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Bestand"
            htmlFor="file"
            hint="PDF of afbeelding · grote PDF's worden automatisch verkleind"
          >
            <Input
              id="file"
              name="file"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              required
              className="file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-4 file:py-1.5 file:text-sm"
            />
          </Field>
        </div>

        {status && (
          <p className="rounded-lg bg-mist px-4 py-3 text-sm text-muted">
            {status}
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy}>
          {busy ? "Bezig…" : "Uploaden"}
        </Button>
      </form>

      <div className="space-y-3">
        {materials.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-paper p-5"
          >
            <div>
              <p className="font-medium text-ink">{m.title}</p>
              <p className="mt-0.5 text-sm text-muted">
                {m.mime_type === "application/pdf" ? "PDF" : "Afbeelding"} ·{" "}
                {m.course_date
                  ? `${m.course_date.title} (${capitalize(formatDate(m.course_date.starts_at))})`
                  : "Algemeen"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(m.id)}
              disabled={busy}
            >
              Verwijderen
            </Button>
          </div>
        ))}
        {materials.length === 0 && (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">
            Nog geen materiaal geüpload.
          </p>
        )}
      </div>
    </div>
  );
}
