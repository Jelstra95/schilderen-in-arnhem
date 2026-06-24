import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SignOutButton } from "@/components/SignOutButton";

export interface NavItem {
  href: string;
  label: string;
}

export function AppHeader({
  items,
  homeHref,
  badge,
}: {
  items: NavItem[];
  homeHref: string;
  badge?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Link
            href={homeHref}
            className="font-title text-lg tracking-wide text-ink hover:text-clay"
          >
            Schilderen in Arnhem
          </Link>
          {badge && (
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs uppercase tracking-wide text-muted">
              {badge}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-6">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <SignOutButton />
        </nav>
      </Container>
    </header>
  );
}
