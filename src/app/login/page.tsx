import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-mist/40 px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="font-title text-lg tracking-wide text-ink hover:text-clay"
        >
          Schilderen in Arnhem
        </Link>

        <div className="mt-8 rounded-3xl border border-line bg-paper p-8 shadow-[0_8px_40px_rgba(22,19,15,0.06)]">
          <h1 className="font-title text-3xl text-ink">Inloggen</h1>
          <p className="mt-2 text-sm text-muted">
            Voor cursisten en de beheerder. Je ontvangt je inloggegevens nadat je
            inschrijving is bevestigd.
          </p>
          <div className="mt-6">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Nog niet ingeschreven?{" "}
          <Link href="/inschrijven" className="text-clay hover:underline">
            Bekijk de cursusdata
          </Link>
        </p>
      </div>
    </div>
  );
}
