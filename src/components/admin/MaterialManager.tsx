"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PdfThumb } from "@/components/admin/PdfThumb";
import { PdfViewer } from "@/components/PdfViewer";
import { capitalize, formatDate, formatDay, formatShortDate } from "@/lib/format";
import {
  IWorkConversionError,
  isIWorkFile,
  iworkAppName,
  iworkToPdf,
} from "@/lib/iwork-to-pdf";
import { createClient } from "@/lib/supabase/client";
import { compressPdf } from "@/lib/pdf/compressPdf";
import type { CourseDate, Material } from "@/lib/types";

export type MaterialRow = Material & { course_date: CourseDate | null };

const isPdf = (m: Material) => m.mime_type === "application/pdf";
const streamSrc = (id: string) => `/api/materials/${id}/stream`;

// Supabase Storage rejects uploads over 50 MiB (verified). Stay safely below
// that: upload directly only when a file is already under SAFE_MAX, and when
// compressing, aim for COMPRESS_TARGET so the result has real headroom.
const SAFE_MAX = 48 * 1024 * 1024;
const COMPRESS_TARGET = 40 * 1024 * 1024;
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

function metaLine(m: MaterialRow): string {
  const parts = [isPdf(m) ? "PDF" : "Afbeelding"];
  if (m.taught_on) parts.push(capitalize(formatDay(m.taught_on)));
  parts.push(
    m.course_date
      ? `${m.course_date.title} (${formatShortDate(m.course_date.starts_at)})`
      : "Algemeen",
  );
  return parts.join(" · ");
}

export function MaterialManager({
  materials,
  courseDates,
}: {
  materials: MaterialRow[];
  courseDates: CourseDate[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Which modal is open.
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<MaterialRow | null>(null);
  const [editing, setEditing] = useState<MaterialRow | null>(null);

  return (
    <div>
      {/* Toolbar --------------------------------------------------------- */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {materials.length}{" "}
          {materials.length === 1 ? "bestand" : "bestanden"}
        </p>
        <Button onClick={() => setUploadOpen(true)} className="gap-1.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Materiaal toevoegen
        </Button>
      </div>

      {/* Gallery --------------------------------------------------------- */}
      {materials.length === 0 ? (
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="w-full rounded-xl border border-dashed border-line p-12 text-center text-muted transition-colors hover:border-clay hover:text-ink"
        >
          Nog geen materiaal. Klik om je eerste bestand toe te voegen.
        </button>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper"
            >
              <button
                type="button"
                onClick={() => setViewing(m)}
                aria-label={`${m.title} bekijken`}
                className="relative block aspect-[4/3] w-full overflow-hidden border-b border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
              >
                {isPdf(m) ? (
                  <PdfThumb src={streamSrc(m.id)} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={streamSrc(m.id)}
                    alt={m.title}
                    draggable={false}
                    className="h-full w-full select-none object-cover"
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-sm font-medium text-paper opacity-0 transition-opacity group-hover:bg-ink/30 group-hover:opacity-100">
                  Bekijken
                </span>
              </button>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium leading-snug text-ink">{m.title}</p>
                  <p className="mt-1 text-xs text-muted">{metaLine(m)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(m)}
                    disabled={busy}
                  >
                    Bewerken
                  </Button>
                  <DeleteButton
                    id={m.id}
                    busy={busy}
                    setBusy={setBusy}
                    onDone={() => router.refresh()}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal ---------------------------------------------------- */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        courseDates={courseDates}
        onUploaded={() => {
          setUploadOpen(false);
          router.refresh();
        }}
      />

      {/* Edit modal ------------------------------------------------------ */}
      {editing && (
        <EditModal
          material={editing}
          courseDates={courseDates}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {/* View modal ------------------------------------------------------ */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.title}
        className="max-w-4xl"
      >
        {viewing &&
          (isPdf(viewing) ? (
            <PdfViewer src={streamSrc(viewing.id)} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={streamSrc(viewing.id)}
              alt={viewing.title}
              draggable={false}
              className="mx-auto max-w-full select-none rounded-xl border border-line"
            />
          ))}
      </Modal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DeleteButton({
  id,
  busy,
  setBusy,
  onDone,
}: {
  id: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onDone: () => void;
}) {
  async function remove() {
    if (!window.confirm("Dit materiaal verwijderen?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
      if (res.ok) onDone();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="ghost" size="sm" onClick={remove} disabled={busy}>
      Verwijderen
    </Button>
  );
}

/* -------------------------------------------------------------------------- */

function UploadModal({
  open,
  onClose,
  courseDates,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  courseDates: CourseDate[];
  onUploaded: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [convertNote, setConvertNote] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    setConvertNote(
      file && isIWorkFile(file)
        ? `${iworkAppName(file)}-bestand wordt automatisch omgezet naar PDF.`
        : null,
    );
  }

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const courseDateId = form.get("course_date_id")
      ? String(form.get("course_date_id"))
      : null;
    const taughtOn = form.get("taught_on")
      ? String(form.get("taught_on"))
      : null;
    const picked = form.get("file");
    if (!(picked instanceof File) || picked.size === 0) {
      setError("Kies een bestand.");
      return;
    }
    let file = picked;

    setBusy(true);
    try {
      // Convert Pages/Keynote to PDF in the browser before uploading.
      if (isIWorkFile(file)) {
        const app = iworkAppName(file);
        setStatus(`${app}-bestand omzetten naar PDF…`);
        try {
          file = await iworkToPdf(file);
        } catch (err) {
          if (err instanceof IWorkConversionError) {
            setError(
              `Dit ${app}-bestand heeft geen ingesloten PDF-voorbeeld. ` +
                `Exporteer het in ${app} via Archief → Exporteer naar → PDF… ` +
                `en sleep de PDF hierheen.`,
            );
          } else {
            setError("Omzetten naar PDF is mislukt.");
          }
          return;
        }
      }

      // Compress large PDFs in the browser so the file fits under the limit.
      if (file.type === "application/pdf" && file.size > SAFE_MAX) {
        const result = await compressPdf(file, {
          maxBytes: COMPRESS_TARGET,
          onProgress: ({ page, totalPages, attempt, totalAttempts }) =>
            setStatus(
              `PDF verkleinen… pagina ${page}/${totalPages}` +
                (totalAttempts > 1 ? ` (poging ${attempt}/${totalAttempts})` : ""),
            ),
        });
        file = result.file;
        if (file.size > SAFE_MAX) {
          setError(
            `De PDF blijft te groot (${mb(file.size)} MB) na verkleinen. ` +
              "Splits het bestand op in delen.",
          );
          return;
        }
        setStatus(
          `Verkleind van ${mb(result.originalBytes)} naar ${mb(file.size)} MB. Uploaden…`,
        );
      } else if (file.size > SAFE_MAX) {
        setError(
          `Bestand is te groot (${mb(file.size)} MB, max. ${Math.floor(SAFE_MAX / 1024 / 1024)} MB). ` +
            "Verklein of splits het bestand.",
        );
        return;
      } else {
        setStatus("Uploaden…");
      }

      // Ask the server for a signed upload URL (it owns the storage path).
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

      // Upload the file straight to Supabase Storage — not via the server.
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadError) {
        setError("Uploaden naar opslag is mislukt.");
        return;
      }

      // Record the materials row.
      const finalizeRes = await fetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          title,
          courseDateId,
          taughtOn,
          mimeType: file.type,
        }),
      });
      if (!finalizeRes.ok) {
        const p = await finalizeRes.json().catch(() => ({}));
        setError(p.error ?? "Opslaan van het materiaal is mislukt.");
        return;
      }

      formRef.current?.reset();
      setConvertNote(null);
      onUploaded();
    } catch {
      setError("Er ging iets mis bij het uploaden.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Materiaal toevoegen">
      <form ref={formRef} onSubmit={upload} className="space-y-4">
        <Field label="Titel" htmlFor="title">
          <Input id="title" name="title" required placeholder="Bijv. Lesbrief week 1" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Datum van de les"
            htmlFor="taught_on"
            hint="Wanneer vond deze les plaats? (optioneel)"
          >
            <Input id="taught_on" name="taught_on" type="date" />
          </Field>
          <Field
            label="Bij cursusdatum"
            htmlFor="course_date_id"
            hint="Bepaalt wie het materiaal ziet · leeg = algemeen"
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
        </div>
        <Field
          label="Bestand"
          htmlFor="file"
          hint="PDF, afbeelding, of Pages/Keynote · grote PDF's worden automatisch verkleind"
        >
          <Input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,.pages,.key"
            required
            onChange={onFileChange}
            className="file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-4 file:py-1.5 file:text-sm"
          />
        </Field>

        {convertNote && (
          <p className="rounded-lg bg-mist/60 px-4 py-3 text-sm text-ink">{convertNote}</p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? (status ?? "Bezig…") : "Uploaden"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

function EditModal({
  material,
  courseDates,
  onClose,
  onSaved,
}: {
  material: MaterialRow;
  courseDates: CourseDate[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(material.title);
  const [taughtOn, setTaughtOn] = useState(material.taught_on ?? "");
  const [courseDateId, setCourseDateId] = useState(material.course_date_id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Titel is verplicht.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/materials/${material.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          taught_on: taughtOn || null,
          course_date_id: courseDateId || null,
        }),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        setError(p.error ?? "Opslaan mislukt.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Materiaal bewerken">
      <form onSubmit={save} className="space-y-4">
        <Field label="Titel" htmlFor="edit-title">
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Datum van de les" htmlFor="edit-taught_on" hint="Optioneel">
            <Input
              id="edit-taught_on"
              type="date"
              value={taughtOn}
              onChange={(e) => setTaughtOn(e.target.value)}
            />
          </Field>
          <Field
            label="Bij cursusdatum"
            htmlFor="edit-course_date_id"
            hint="Bepaalt wie het materiaal ziet · leeg = algemeen"
          >
            <Select
              id="edit-course_date_id"
              value={courseDateId}
              onChange={(e) => setCourseDateId(e.target.value)}
            >
              <option value="">Algemeen (alle deelnemers)</option>
              {courseDates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} — {formatDate(d.starts_at)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Bezig…" : "Opslaan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
