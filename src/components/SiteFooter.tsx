import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/Logo";
import { site, fullAddress } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-mist/50">
      <Container className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2.5 font-title text-lg text-ink">
            <Logo className="h-8 w-auto" />
            {site.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {site.tagline}
          </p>
          <address className="mt-4 space-y-0.5 text-sm not-italic text-muted">
            <p>{fullAddress}</p>
            <p>
              <a
                href={`tel:${site.phone}`}
                className="hover:text-ink transition-colors"
              >
                {site.phoneDisplay}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${site.email}`}
                className="hover:text-ink transition-colors"
              >
                {site.email}
              </a>
            </p>
          </address>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <Link href="/inschrijven" className="hover:text-ink transition-colors">
            Inschrijven
          </Link>
          <Link href="/login" className="hover:text-ink transition-colors">
            Inloggen
          </Link>
          <a
            href={site.sameAs[0]}
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink transition-colors"
          >
            jellevanderidder.com
          </a>
        </div>
      </Container>
      <Container className="border-t border-line/70 py-6">
        <p className="text-xs text-muted">
          © {year} {site.instructor} · {site.city}
        </p>
      </Container>
    </footer>
  );
}
