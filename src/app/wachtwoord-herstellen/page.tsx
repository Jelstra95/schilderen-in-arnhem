import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord instellen",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      backHref="/login"
      backLabel="Terug naar inloggen"
      title="Nieuw wachtwoord"
      description="Kies een nieuw wachtwoord voor je account."
      footer={
        <>
          Toch inloggen?{" "}
          <Link
            href="/login"
            className="text-paper underline underline-offset-4 hover:text-clay"
          >
            Inloggen
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
