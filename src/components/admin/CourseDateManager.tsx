"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { capitalize, formatDate, formatTime } from "@/lib/format";
import type { CourseDateWithAvailability } from "@/lib/types";

interface FormState {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: string;
  status: "open" | "closed";
}

const EMPTY: FormState = {
  title: "",
  description: "",
  starts_at: "",
  ends_at: "",
  location: "",
  capacity: "8",
  status: "open",
};

/** ISO -> value for <input type="datetime-local"> in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local datetime-local value -> ISO (UTC). */
function toIso(local: string): string {
  return new Date(local).toISOString();
}

export function CourseDateManager({
  dates,
}: {
  dates: CourseDateWithAvailability[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startCreate() {
    setForm(EMPTY);
    setEditingId(null);
    setError(null);
    setOpen(true);
  }

  function startEdit(d: CourseDateWithAvailability) {
    setForm({
      title: d.title,
      description: d.description ?? "",
      starts_at: toLocalInput(d.starts_at),
      ends_at: toLocalInput(d.ends_at),
      location: d.location ?? "",
      capacity: String(d.capacity),
      status: d.status,
    });
    setEditingId(d.id);
    setError(null);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.starts_at) {
      setError("Titel en startdatum zijn verplicht.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        starts_at: toIso(form.starts_at),
        ends_at: form.ends_at ? toIso(form.ends_at) : null,
        location: form.location,
        capacity: Number(form.capacity),
        status: form.status,
      };
      const res = await fetch(
        editingId ? `/api/admin/course-dates/${editingId}` : "/api/admin/course-dates",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        setError(p.error ?? "Opslaan mislukt.");
        return;
      }
      setOpen(false);
      setForm(EMPTY);
      setEditingId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Deze cursusdatum en alle bijbehorende inschrijvingen verwijderen?"))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/course-dates/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted">{dates.length} cursusdata</p>
        {!open && <Button onClick={startCreate}>Nieuwe datum</Button>}
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="mb-8 space-y-4 rounded-2xl border border-line bg-paper p-6"
        >
          <h2 className="font-title text-xl text-ink">
            {editingId ? "Datum bewerken" : "Nieuwe cursusdatum"}
          </h2>
          <Field label="Titel" htmlFor="title">
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </Field>
          <Field label="Omschrijving" htmlFor="description" hint="Optioneel">
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start" htmlFor="starts_at">
              <Input
                id="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)}
                required
              />
            </Field>
            <Field label="Einde" htmlFor="ends_at" hint="Optioneel">
              <Input
                id="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Locatie" htmlFor="location" hint="Optioneel">
              <Input
                id="location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
            <Field label="Plekken" htmlFor="capacity">
              <Input
                id="capacity"
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                required
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select
                id="status"
                value={form.status}
                onChange={(e) => set("status", e.target.value as "open" | "closed")}
              >
                <option value="open">Open voor inschrijving</option>
                <option value="closed">Gesloten</option>
              </Select>
            </Field>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Bezig…" : editingId ? "Wijzigingen opslaan" : "Datum aanmaken"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            >
              Annuleren
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {dates.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-title text-lg text-ink">{d.title}</p>
                {d.status === "closed" && <Badge tone="neutral">Gesloten</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">
                {capitalize(formatDate(d.starts_at))} · {formatTime(d.starts_at)}
                {d.location ? ` · ${d.location}` : ""}
              </p>
              <p className="mt-1 text-sm text-muted">
                {d.reserved}/{d.capacity} bezet ·{" "}
                <span className="text-clay-dark">{d.available} vrij</span>
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => startEdit(d)}>
                Bewerken
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(d.id)}
                disabled={busy}
              >
                Verwijderen
              </Button>
            </div>
          </div>
        ))}
        {dates.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
            Nog geen cursusdata. Maak je eerste datum aan.
          </p>
        )}
      </div>
    </div>
  );
}
