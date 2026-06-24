"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { capitalize, formatDate } from "@/lib/format";
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
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    if (form.get("course_date_id") === "") form.delete("course_date_id");

    setBusy(true);
    try {
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
      router.refresh();
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
        className="mb-10 space-y-4 rounded-2xl border border-line bg-paper p-6"
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
          <Field label="Bestand" htmlFor="file" hint="PDF of afbeelding · max. 50 MB">
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

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
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
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5"
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
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
            Nog geen materiaal geüpload.
          </p>
        )}
      </div>
    </div>
  );
}
