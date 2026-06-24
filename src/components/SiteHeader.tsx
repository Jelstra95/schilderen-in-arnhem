import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

const navLinks = [
  { href: "/#cursus", label: "De cursus" },
  { href: "/#voordelen", label: "Waarom" },
  { href: "/#data", label: "Data" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="font-title text-lg tracking-wide text-ink hover:text-clay transition-colors"
        >
          Schilderen in Arnhem
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm text-muted transition-colors hover:text-ink sm:block"
          >
            Inloggen
          </Link>
          <ButtonLink href="/inschrijven" size="sm">
            Inschrijven
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
