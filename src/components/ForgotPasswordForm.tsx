"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email")).trim();

    setSubmitting(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/wachtwoord-herstellen`,
      },
    );
    setSubmitting(false);

    if (resetError) {
      // Only surfaces on hard failures (e.g. rate limiting), never for a
      // non-existent address — Supabase does not reveal that.
      setError("Er ging iets mis. Probeer het over enkele minuten opnieuw.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
        Als er een account bij dit e-mailadres hoort, is er een e-mail onderweg
        met een link om je wachtwoord opnieuw in te stellen. Controleer ook je
        spam-map.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="E-mailadres" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Bezig…" : "Stuur herstel-link"}
      </Button>
    </form>
  );
}
