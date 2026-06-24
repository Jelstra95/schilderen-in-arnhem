import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { capitalize, formatDate, formatTime } from "@/lib/format";
import type { CourseDateWithAvailability } from "@/lib/types";

export function CourseDateCard({
  date,
  href,
}: {
  date: CourseDateWithAvailability;
  href?: string;
}) {
  const soldOut = date.available <= 0 || date.status !== "open";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(22,19,15,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-title text-xl text-ink">{date.title}</p>
          <p className="mt-1 text-sm text-muted">
            {capitalize(formatDate(date.starts_at))}
          </p>
        </div>
        {soldOut ? (
          <Badge tone="full">Vol</Badge>
        ) : (
          <Badge tone="available">
            {date.available} {date.available === 1 ? "plek" : "plekken"} vrij
          </Badge>
        )}
      </div>

      <dl className="space-y-1 text-sm text-muted">
        <div className="flex gap-2">
          <dt className="text-ink/50">Tijd</dt>
          <dd>
            {formatTime(date.starts_at)}
            {date.ends_at ? `–${formatTime(date.ends_at)}` : ""}
          </dd>
        </div>
        {date.location && (
          <div className="flex gap-2">
            <dt className="text-ink/50">Locatie</dt>
            <dd>{date.location}</dd>
          </div>
        )}
      </dl>

      {date.description && (
        <p className="text-sm leading-relaxed text-muted">{date.description}</p>
      )}

      {href && (
        <div className="mt-auto pt-2">
          {soldOut ? (
            <span className="text-sm text-muted">Geen plekken beschikbaar</span>
          ) : (
            <ButtonLink href={href} variant="secondary" size="sm">
              Kies deze datum
            </ButtonLink>
          )}
        </div>
      )}
    </article>
  );
}
