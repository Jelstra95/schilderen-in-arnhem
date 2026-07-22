"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { capitalize, formatDate, formatDay, formatShortDate } from "@/lib/format";
import {
  IWorkConversionError,
  isIWorkFile,
  iworkAppName,
  iworkToPdf,
} from "@/lib/iwork-to-pdf";
import type { CourseDate, Material } from "@/lib/types";

export type MaterialRow = Material & { course_date: CourseDate | null };

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
  // Live hint shown when a Pages/Keynote file is selected.
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
    if (form.get("course_date_id") === "") form.delete("course_date_id");
    if (form.get("taught_on") === "") form.delete("taught_on");

    const file = form.get("file");

    setBusy(true);
    try {
      // Convert Pages/Keynote to PDF in the browser before uploading.
      if (file instanceof File && isIWorkFile(file)) {
        const app = iworkAppName(file);
        setStatus(`${app}-bestand omzetten naar PDF…`);
        try {
          const pdf = await iworkToPdf(file);
          form.set("file", pdf, pdf.name);
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

      setStatus("Uploaden…");
      const res = await fetch("/api/admin/materials", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        setError(p.error ?? "Uploaden mislukt.");
        return;
      }
      formRef.current?.reset();
      setConvertNote(null);
      router.refresh();
    } finally {
      setBusy(false);
      setStatus(null);
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
          hint="PDF, afbeelding, of Pages/Keynote · max. 50 MB"
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
          <p className="rounded-lg bg-mist/60 px-4 py-3 text-sm text-ink">
            {convertNote}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy}>
          {busy ? (status ?? "Bezig…") : "Uploaden"}
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
                {m.mime_type === "application/pdf" ? "PDF" : "Afbeelding"}
                {m.taught_on ? ` · ${capitalize(formatDay(m.taught_on))}` : ""} ·{" "}
                {m.course_date
                  ? `${m.course_date.title} (${formatShortDate(m.course_date.starts_at)})`
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
