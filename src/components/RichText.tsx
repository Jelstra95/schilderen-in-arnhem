import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renders a copy string from src/content with two bits of inline markup, so
 * the texts there can stay plain strings:
 *
 *   [algemene voorwaarden](/algemene-voorwaarden)   a link
 *   **€ 230**                                        highlighted in ink
 *
 * Internal paths become a next/link, anything else (mailto:, https:) a plain
 * anchor.
 */
const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;

const linkClass = "text-ink underline underline-offset-4 hover:text-clay";

export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN)) {
    const [whole, label, href, strong] = match;
    if (match.index > last) parts.push(text.slice(last, match.index));

    if (strong !== undefined) {
      parts.push(
        <span key={match.index} className="text-ink">
          {strong}
        </span>,
      );
    } else if (href.startsWith("/")) {
      parts.push(
        <Link key={match.index} href={href} className={linkClass}>
          {label}
        </Link>,
      );
    } else {
      parts.push(
        <a key={match.index} href={href} className={linkClass}>
          {label}
        </a>,
      );
    }
    last = match.index + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}
