"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/Calendar";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { capitalize, formatDate, formatTime } from "@/lib/format";
import type { CourseDateWithAvailability } from "@/lib/types";

export function EnrollForm({
  dates,
  preselectedId,
}: {
  dates: CourseDateWithAvailability[];
  preselectedId?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<CourseDateWithAvailability | null>(
    dates.find((d) => d.id === preselectedId && d.available > 0) ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selected) {
      setError("Kies eerst een datum in de kalender.");
      return;
    }

    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_date_id: selected.id,
          full_name: form.get("full_name"),
          email: form.get("email"),
          phone: form.get("phone"),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Er ging iets mis. Probeer het opnieuw.");
        return;
      }
      router.push("/bedankt");
    } catch {
      setError("Kan geen verbinding maken. Controleer je internet en probeer opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  if (dates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-mist/40 p-10 text-center text-muted">
        Er zijn op dit moment geen data om op in te schrijven. Kom binnenkort
        terug.
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <h2 className="mb-4 font-title text-2xl text-ink">1 · Kies een datum</h2>
        <Calendar dates={dates} selectedId={selected?.id ?? null} onSelect={setSelected} />
      </div>

      <div>
        <h2 className="mb-4 font-title text-2xl text-ink">2 · Jouw gegevens</h2>

        <div className="mb-5 rounded-xl border border-line bg-mist/40 p-5">
          {selected ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-title text-lg text-ink">{selected.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {capitalize(formatDate(selected.starts_at))} ·{" "}
                  {formatTime(selected.starts_at)}
                </p>
                {selected.location && (
                  <p className="text-sm text-muted">{selected.location}</p>
                )}
              </div>
              <Badge tone="available">
                {selected.available}{" "}
                {selected.available === 1 ? "plek" : "plekken"} vrij
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Nog geen datum gekozen. Selecteer een gemarkeerde dag in de
              kalender.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Naam" htmlFor="full_name">
            <Input id="full_name" name="full_name" required autoComplete="name" />
          </Field>
          <Field label="E-mailadres" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Telefoonnummer" htmlFor="phone" hint="Optioneel">
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Bezig met inschrijven…" : "Inschrijving versturen"}
          </Button>
          <p className="text-center text-xs text-muted">
            Na je aanmelding nemen we persoonlijk contact met je op over de
            betaling en bevestiging.
          </p>
        </form>
      </div>
    </div>
  );
}
