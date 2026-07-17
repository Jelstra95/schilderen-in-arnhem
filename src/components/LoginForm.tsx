"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError("E-mailadres of wachtwoord is onjuist.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="E-mailadres" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Wachtwoord" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Bezig met inloggen…" : "Inloggen"}
      </Button>
    </form>
  );
}
