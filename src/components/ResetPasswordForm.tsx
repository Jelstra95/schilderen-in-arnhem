"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

const MIN_LENGTH = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The callback route establishes a recovery session before redirecting here.
  // Verify it exists so we can show a helpful message when the link expired.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setValidSession(!!data.user);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));

    if (password.length < MIN_LENGTH) {
      setError(`Kies een wachtwoord van minimaal ${MIN_LENGTH} tekens.`);
      return;
    }
    if (password !== confirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(
        "Het wachtwoord kon niet worden opgeslagen. Vraag een nieuwe herstel-link aan.",
      );
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (checking) {
    return <p className="text-sm text-muted">Even geduld…</p>;
  }

  if (!validSession) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Deze herstel-link is ongeldig of verlopen.
        </p>
        <Link
          href="/wachtwoord-vergeten"
          className="text-sm text-clay underline underline-offset-4"
        >
          Vraag een nieuwe link aan
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Je wachtwoord is gewijzigd. Je bent nu ingelogd.
        </p>
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => router.push("/dashboard")}
        >
          Naar mijn omgeving
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nieuw wachtwoord" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Herhaal wachtwoord" htmlFor="confirm">
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Bezig met opslaan…" : "Wachtwoord opslaan"}
      </Button>
    </form>
  );
}
