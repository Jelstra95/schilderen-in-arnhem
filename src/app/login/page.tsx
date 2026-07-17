import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import loginBg from "@/assets/cursus/img-1890.jpg";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      {/* Background --------------------------------------------------- */}
      <div className="absolute inset-0 z-0">
        <Image
          src={loginBg}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/55" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="font-title text-lg tracking-wide text-paper hover:text-clay"
        >
          Schilderen in Arnhem
        </Link>

        <div className="mt-8 rounded-xl border border-line bg-paper p-8 shadow-[0_8px_40px_rgba(22,19,15,0.25)]">
          <h1 className="font-title text-3xl text-ink">Inloggen</h1>
          <p className="mt-2 text-sm text-muted">
            Voor cursisten en de beheerder. Je ontvangt je inloggegevens nadat je
            inschrijving is bevestigd.
          </p>
          <div className="mt-6">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-paper/80">
          Nog niet ingeschreven?{" "}
          <Link
            href="/inschrijven"
            className="text-paper underline underline-offset-4 hover:text-clay"
          >
            Meld je aan
          </Link>
        </p>
      </div>
    </div>
  );
}
