"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

// Day-of-the-week options. Set available to false to show a day as "Binnenkort".
// Keep the values in sync with ALLOWED_DAYS in src/app/api/inquiries/route.ts.
const dayOptions = [
  { value: "Dinsdagavond", time: "19:00 – 21:30 uur", available: true },
  { value: "Woensdagavond", time: "19:00 – 21:30 uur", available: true },
];

export function AanmeldForm() {
  const router = useRouter();
  const [day, setDay] = useState("Woensdagavond");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          day_preference: day,
          notes: form.get("notes"),
          website: form.get("website"), // honeypot
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Er ging iets mis. Probeer het opnieuw.");
        return;
      }
      router.push("/bedankt");
    } catch {
      setError(
        "Kan geen verbinding maken. Controleer je internet en probeer opnieuw.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-8">
      {/* 1 — Voorkeursavond ------------------------------------------- */}
      <fieldset>
        <legend className="mb-4 font-title text-2xl text-ink">
          1 · Kies je avond
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {dayOptions.map((opt) => {
            const active = day === opt.value;
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer flex-col rounded-lg border p-4 transition-colors",
                  opt.available
                    ? active
                      ? "border-clay bg-clay/5 ring-1 ring-clay"
                      : "border-line hover:border-clay/50"
                    : "cursor-not-allowed border-dashed border-line bg-mist/40 opacity-70",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-title text-lg text-ink">
                    {opt.value}
                  </span>
                  {!opt.available && (
                    <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs uppercase tracking-wide text-muted">
                      Binnenkort
                    </span>
                  )}
                </div>
                <span className="mt-1 text-sm text-muted">{opt.time}</span>
                <input
                  type="radio"
                  name="day"
                  value={opt.value}
                  checked={active}
                  disabled={!opt.available}
                  onChange={() => setDay(opt.value)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 2 — Contactgegevens ------------------------------------------ */}
      <fieldset className="space-y-4">
        <legend className="mb-2 font-title text-2xl text-ink">
          2 · Jouw gegevens
        </legend>
        <Field label="Naam" htmlFor="name">
          <Input id="name" name="name" required autoComplete="name" />
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
        <Field label="Telefoonnummer" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
          />
        </Field>
        <Field label="Opmerkingen" htmlFor="notes" hint="Optioneel">
          <Textarea
            id="notes"
            name="notes"
            placeholder="Bijvoorbeeld je ervaring, vragen of wensen."
          />
        </Field>

        {/* Honeypot: hidden from humans, non-empty = silently drop as spam. */}
        <div aria-hidden="true" className="hidden">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
      </fieldset>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? "Bezig met versturen…" : "Aanmelding versturen"}
        </Button>
        <p className="mt-3 text-xs text-muted">
          Na je aanmelding krijg je direct een bevestiging per e-mail. Ik neem
          daarna persoonlijk contact met je op over de betaling en bevestiging.
          Met je aanmelding ga je akkoord met de{" "}
          <Link
            href="/algemene-voorwaarden"
            className="underline underline-offset-2 hover:text-ink"
          >
            algemene voorwaarden
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
