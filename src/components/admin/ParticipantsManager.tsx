"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { capitalize, formatDate } from "@/lib/format";
import type { CourseDate, Enrollment } from "@/lib/types";

export type EnrollmentRow = Enrollment & { course_date: CourseDate | null };

const statusTone = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
} as const;

const statusLabel = {
  pending: "In afwachting",
  confirmed: "Bevestigd",
  cancelled: "Geannuleerd",
};

interface Credentials {
  email: string;
  password: string | null;
}

export function ParticipantsManager({ rows }: { rows: EnrollmentRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  async function confirm(row: EnrollmentRow) {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: row.id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Bevestigen mislukt.");
        return;
      }
      setCredentials({ email: payload.email, password: payload.password });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(row: EnrollmentRow) {
    if (!window.confirm("Deze inschrijving annuleren?")) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/enrollments/${row.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {credentials && (
        <div className="mb-6 rounded-xl border border-clay/30 bg-clay/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-title text-lg text-ink">
                Account aangemaakt
              </p>
              <p className="mt-1 text-sm text-muted">
                Deel deze inloggegevens met de deelnemer. Het wachtwoord is
                eenmalig zichtbaar.
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-24 text-ink/50">E-mail</dt>
                  <dd className="font-mono text-ink">{credentials.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 text-ink/50">Wachtwoord</dt>
                  <dd className="font-mono text-ink">
                    {credentials.password ?? "— bestaand account gekoppeld —"}
                  </dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => setCredentials(null)}
              className="text-sm text-muted hover:text-ink"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Deelnemer</th>
              <th className="px-4 py-3">Cursusdatum</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="bg-paper">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{row.full_name}</p>
                  <p className="text-muted">{row.email}</p>
                  {row.phone && <p className="text-muted">{row.phone}</p>}
                </td>
                <td className="px-4 py-3 text-muted">
                  {row.course_date ? (
                    <>
                      <p className="text-ink">{row.course_date.title}</p>
                      <p>{capitalize(formatDate(row.course_date.starts_at))}</p>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[row.status]}>
                    {statusLabel[row.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {row.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => confirm(row)}
                        disabled={busyId === row.id}
                      >
                        {busyId === row.id ? "Bezig…" : "Bevestig & account"}
                      </Button>
                    )}
                    {row.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancel(row)}
                        disabled={busyId === row.id}
                      >
                        Annuleren
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Nog geen inschrijvingen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
