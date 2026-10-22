import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { algemeen } from "@/content/algemeen";

const { header } = algemeen;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-title text-lg tracking-wide text-ink hover:text-clay transition-colors"
        >
          <Logo className="h-8 w-auto" />
          {/* Phones show the mark alone: the wordmark wraps below ~430px.
              sr-only keeps it in the a11y tree so the link stays named. */}
          <span className="sr-only sm:not-sr-only">Schilderen in Arnhem</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {header.nav.map((link) => (
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
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            {header.login}
          </Link>
          <ButtonLink href="/inschrijven" size="sm">
            {header.signup}
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
