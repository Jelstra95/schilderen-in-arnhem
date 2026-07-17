import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-mist/50">
      <Container className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-title text-lg text-ink">Schilderen in Arnhem</p>
          <p className="mt-1 text-sm text-muted">
            Schildercursussen door Jelle van de Ridder
          </p>
          <address className="mt-4 space-y-0.5 text-sm not-italic text-muted">
            <p>Schrassertstraat 99, 6821 AK Arnhem</p>
            <p>
              <a
                href="tel:+31623837071"
                className="hover:text-ink transition-colors"
              >
                +31 (0)6 23 83 70 71
              </a>
            </p>
            <p>
              <a
                href="mailto:info@jellevanderidder.com"
                className="hover:text-ink transition-colors"
              >
                info@jellevanderidder.com
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
            href="https://www.jellevanderidder.com"
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
          © {year} Jelle van de Ridder · Arnhem
        </p>
      </Container>
    </footer>
  );
}
