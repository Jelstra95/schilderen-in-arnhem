"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

const CONTACT_EMAIL = "info@jellevanderidder.com";

// Day-of-the-week options. Only the Wednesday evening class runs at the moment;
// other days are shown but not yet selectable.
const dayOptions = [
  { value: "Woensdagavond", time: "19:00 – 21:30 uur", available: true },
  { value: "Dinsdagavond", time: "19:00 – 21:30 uur", available: false },
];

export function AanmeldForm() {
  const [day, setDay] = useState("Woensdagavond");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();

    const subject = `Aanmelding schildercursus — ${day}`;
    const body = [
      `Naam: ${name}`,
      `E-mail: ${email}`,
      `Telefoon: ${phone}`,
      `Voorkeursavond: ${day} (19:00 – 21:30 uur)`,
      "",
      "Opmerkingen:",
      notes || "-",
    ].join("\n");

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
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
      </fieldset>

      <div>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Aanmelding versturen
        </Button>
        <p className="mt-3 text-xs text-muted">
          Je aanmelding opent in je eigen e-mailprogramma, gericht aan{" "}
          {CONTACT_EMAIL}. Na ontvangst neem ik persoonlijk contact met je op
          over de betaling en bevestiging.
        </p>
      </div>
    </form>
  );
}
