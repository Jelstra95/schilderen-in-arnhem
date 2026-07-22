import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Wachtwoord vergeten",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  const { fout } = await searchParams;

  return (
    <AuthShell
      backHref="/login"
      backLabel="Terug naar inloggen"
      title="Wachtwoord vergeten"
      description="Vul je e-mailadres in. Als er een account bij ons bekend is, ontvang je een e-mail met een link om een nieuw wachtwoord in te stellen."
      footer={
        <>
          Weet je het weer?{" "}
          <Link
            href="/login"
            className="text-paper underline underline-offset-4 hover:text-clay"
          >
            Inloggen
          </Link>
        </>
      }
    >
      {fout === "link" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Je herstel-link was ongeldig of verlopen. Vraag hieronder een nieuwe
          aan.
        </p>
      )}
      <ForgotPasswordForm />
    </AuthShell>
  );
}
