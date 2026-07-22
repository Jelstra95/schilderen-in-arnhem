import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import loginBg from "@/assets/cursus/img-1890.jpg";

/**
 * Shared visual shell for the authentication pages (login, forgot- and
 * reset-password): full-bleed background image, brand link and a paper card.
 */
export function AuthShell({
  backHref,
  backLabel,
  title,
  description,
  children,
  footer,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
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
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-paper/80 transition-colors hover:text-paper"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel}
        </Link>

        <Link
          href="/"
          className="mt-6 block font-title text-lg tracking-wide text-paper hover:text-clay"
        >
          Schilderen in Arnhem
        </Link>

        <div className="mt-8 rounded-xl border border-line bg-paper p-8 shadow-[0_8px_40px_rgba(22,19,15,0.25)]">
          <h1 className="font-title text-3xl text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">{description}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <p className="mt-8 text-center text-sm text-paper/80">{footer}</p>
        )}
      </div>
    </div>
  );
}
