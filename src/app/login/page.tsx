import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Inloggen",
};

function safeRedirect(value: string | undefined): string {
  // Only allow internal paths to avoid open-redirects.
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = safeRedirect(redirect);

  return (
    <AuthShell
      backHref="/cursussen"
      backLabel="Terug naar cursussen"
      title="Inloggen"
      description="Voor cursisten en de beheerder. Je ontvangt je inloggegevens nadat je inschrijving is bevestigd."
      footer={
        <>
          Nog niet ingeschreven?{" "}
          <Link
            href="/inschrijven"
            className="text-paper underline underline-offset-4 hover:text-clay"
          >
            Meld je aan
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
      <p className="mt-4 text-center text-sm">
        <Link
          href="/wachtwoord-vergeten"
          className="text-muted underline underline-offset-4 hover:text-clay"
        >
          Wachtwoord vergeten?
        </Link>
      </p>
    </AuthShell>
  );
}
