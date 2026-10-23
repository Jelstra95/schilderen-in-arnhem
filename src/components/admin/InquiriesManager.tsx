"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatShortDate } from "@/lib/format";
import type { CourseInquiry, InquiryStatus } from "@/lib/types";

const statusLabel: Record<InquiryStatus, string> = {
  new: "Nieuw",
  contacted: "Gereageerd",
  converted: "Aangemeld",
  archived: "Gearchiveerd",
};

const statusTone: Record<InquiryStatus, "pending" | "confirmed" | "cancelled" | "neutral"> = {
  new: "pending",
  contacted: "neutral",
  converted: "confirmed",
  archived: "cancelled",
};

const NEXT_STATUS: Record<InquiryStatus, InquiryStatus | null> = {
  new: "contacted",
  contacted: "archived",
  converted: null,
  archived: null,
};

export function InquiriesManager({ rows }: { rows: CourseInquiry[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(row: CourseInquiry, status: InquiryStatus) {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error ?? "Bijwerken mislukt.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Aanmelder</th>
              <th className="px-4 py-3">Voorkeur</th>
              <th className="px-4 py-3">Opmerkingen</th>
              <th className="px-4 py-3">Ontvangen</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const next = NEXT_STATUS[row.status];
              return (
                <tr key={row.id} className="bg-paper align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.full_name}</p>
                    <p className="text-muted">
                      <a
                        href={`mailto:${row.email}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {row.email}
                      </a>
                    </p>
                    {row.phone && <p className="text-muted">{row.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink">{row.day_preference}</td>
                  <td className="max-w-sm px-4 py-3 text-muted">
                    {row.notes ? (
                      <p className="whitespace-pre-wrap">{row.notes}</p>
                    ) : (
                      <span className="text-ink/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatShortDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[row.status]}>
                      {statusLabel[row.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {next && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus(row, next)}
                          disabled={busyId === row.id}
                        >
                          {busyId === row.id ? "Bezig…" : `Markeer "${statusLabel[next]}"`}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Nog geen aanvragen ontvangen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
