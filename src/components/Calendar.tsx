"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { CourseDateWithAvailability } from "@/lib/types";

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Monday-based weekday index (0 = Monday … 6 = Sunday). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function Calendar({
  dates,
  selectedId,
  onSelect,
}: {
  dates: CourseDateWithAvailability[];
  selectedId: string | null;
  onSelect: (date: CourseDateWithAvailability) => void;
}) {
  // Map each day to its (first) course date.
  const byDay = useMemo(() => {
    const map = new Map<string, CourseDateWithAvailability>();
    for (const d of dates) {
      const key = dateKey(new Date(d.starts_at));
      if (!map.has(key)) map.set(key, d);
    }
    return map;
  }, [dates]);

  const initial = useMemo(() => {
    const ref = dates[0] ? new Date(dates[0].starts_at) : new Date();
    return { year: ref.getFullYear(), month: ref.getMonth() };
  }, [dates]);

  const [view, setView] = useState(initial);

  const firstOfMonth = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const leadingBlanks = mondayIndex(firstOfMonth);

  const cells: Array<Date | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++)
    cells.push(new Date(view.year, view.month, day));

  function shift(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="rounded-full p-2 text-muted hover:bg-mist hover:text-ink"
          aria-label="Vorige maand"
        >
          ‹
        </button>
        <p className="font-title text-lg text-ink">
          {MONTHS[view.month]} {view.year}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          className="rounded-full p-2 text-muted hover:bg-mist hover:text-ink"
          aria-label="Volgende maand"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 uppercase tracking-wide">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`b${i}`} />;
          const course = byDay.get(dateKey(date));
          const hasSpot = course && course.available > 0;
          const isSelected = course && course.id === selectedId;

          return (
            <button
              key={dateKey(date)}
              type="button"
              disabled={!hasSpot}
              onClick={() => course && onSelect(course)}
              className={cn(
                "relative aspect-square rounded-lg text-sm transition",
                !course && "text-ink/30",
                course && !hasSpot && "text-muted line-through",
                hasSpot && !isSelected && "bg-clay/10 text-clay-dark hover:bg-clay/20 font-medium",
                isSelected && "bg-ink text-paper font-medium",
              )}
            >
              {date.getDate()}
              {course && !isSelected && (
                <span
                  className={cn(
                    "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                    hasSpot ? "bg-clay" : "bg-muted/50",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="inline-block h-2 w-2 rounded-full bg-clay" />
        Beschikbare cursusdatum
      </p>
    </div>
  );
}
