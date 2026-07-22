"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { capitalize, formatDay, formatShortDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export type ParticipantAccount = Profile & {
  last_sign_in_at: string | null;
};

interface Credentials {
  email: string;
  password: string;
}

/** Local date as YYYY-MM-DD (matches an <input type="date"> value). */
function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function periodStatus(account: ParticipantAccount): {
  label: string;
  tone: "pending" | "confirmed" | "cancelled";
} {
  const today = todayISO();
  if (account.access_starts_on && account.access_starts_on > today) {
    return { label: "Nog niet gestart", tone: "pending" };
  }
  if (account.access_ends_on && account.access_ends_on < today) {
    return { label: "Beëindigd", tone: "cancelled" };
  }
  return { label: "Actief", tone: "confirmed" };
}

export function ParticipantAccountsManager({
  accounts,
}: {
  accounts: ParticipantAccount[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  // Per-row period editing.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  async function createParticipant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/participants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          full_name: form.get("full_name"),
          phone: form.get("phone"),
          access_starts_on: form.get("access_starts_on"),
          access_ends_on: form.get("access_ends_on") || null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Aanmaken mislukt.");
        return;
      }
      setCredentials({ email: payload.email, password: payload.password });
      setAdding(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, changes: Record<string, string | null>) {
    setRowBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/participants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "Bijwerken mislukt.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setRowBusyId(null);
    }
  }

  function startEdit(account: ParticipantAccount) {
    setEditingId(account.id);
    setEditStart(account.access_starts_on ?? "");
    setEditEnd(account.access_ends_on ?? "");
  }

  async function saveEdit(id: string) {
    const ok = await patch(id, {
      access_starts_on: editStart || null,
      access_ends_on: editEnd || null,
    });
    if (ok) setEditingId(null);
  }

  async function endAccess(account: ParticipantAccount) {
    if (
      !window.confirm(
        `Toegang van ${account.full_name ?? account.email} beëindigen per vandaag?`,
      )
    ) {
      return;
    }
    await patch(account.id, { access_ends_on: todayISO() });
  }

  return (
    <div>
      {/* Credentials of a just-created account -------------------------- */}
      {credentials && (
        <div className="mb-6 rounded-xl border border-clay/30 bg-clay/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-title text-lg text-ink">Account aangemaakt</p>
              <p className="mt-1 text-sm text-muted">
                Geef deze gegevens door aan de deelnemer. Vraag hen het
                wachtwoord na de eerste keer inloggen te wijzigen.
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-24 text-ink/50">E-mail</dt>
                  <dd className="font-mono text-ink">{credentials.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 text-ink/50">Wachtwoord</dt>
                  <dd className="font-mono text-ink">{credentials.password}</dd>
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

      {/* Add-participant ------------------------------------------------- */}
      <div className="mb-6">
        {adding ? (
          <form
            onSubmit={createParticipant}
            className="rounded-xl border border-line bg-paper p-6"
          >
            <p className="font-title text-lg text-ink">Deelnemer toevoegen</p>
            <p className="mt-1 text-sm text-muted">
              Er wordt direct een account aangemaakt met het standaard­wachtwoord{" "}
              <span className="font-mono text-ink">olieverf</span>.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Naam" htmlFor="full_name">
                <Input id="full_name" name="full_name" required autoComplete="off" />
              </Field>
              <Field label="E-mailadres" htmlFor="email">
                <Input id="email" name="email" type="email" required autoComplete="off" />
              </Field>
              <Field label="Telefoonnummer" htmlFor="phone">
                <Input id="phone" name="phone" type="tel" autoComplete="off" />
              </Field>
              <div className="hidden sm:block" />
              <Field label="Startdatum" htmlFor="access_starts_on">
                <Input
                  id="access_starts_on"
                  name="access_starts_on"
                  type="date"
                  required
                  defaultValue={todayISO()}
                />
              </Field>
              <Field
                label="Einddatum (optioneel)"
                htmlFor="access_ends_on"
                hint="Leeg = doorlopende toegang."
              >
                <Input id="access_ends_on" name="access_ends_on" type="date" />
              </Field>
            </div>
            <div className="mt-5 flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Bezig…" : "Account aanmaken"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
              >
                Annuleren
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setAdding(true)}>+ Deelnemer toevoegen</Button>
        )}
      </div>

      {/* Accounts table ------------------------------------------------- */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Deelnemer</th>
              <th className="px-4 py-3">Periode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ingelogd</th>
              <th className="px-4 py-3 text-right">Actie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {accounts.map((account) => {
              const status = periodStatus(account);
              const ended =
                !!account.access_ends_on && account.access_ends_on < todayISO();
              const editing = editingId === account.id;
              const rowBusy = rowBusyId === account.id;

              return (
                <tr key={account.id} className="bg-paper align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {account.full_name ?? "—"}
                    </p>
                    <p className="text-muted">{account.email}</p>
                    {account.phone && (
                      <p className="text-muted">{account.phone}</p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-muted">
                    {editing ? (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-ink/50">
                          Start
                          <Input
                            type="date"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className="mt-1 py-2"
                          />
                        </label>
                        <label className="text-xs text-ink/50">
                          Einde (optioneel)
                          <Input
                            type="date"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            className="mt-1 py-2"
                          />
                        </label>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(account.id)}
                            disabled={rowBusy || !editStart}
                          >
                            {rowBusy ? "Bezig…" : "Opslaan"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Annuleren
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-ink">
                          {account.access_starts_on
                            ? capitalize(formatDay(account.access_starts_on))
                            : "—"}
                        </p>
                        <p>
                          {account.access_ends_on
                            ? `t/m ${formatDay(account.access_ends_on)}`
                            : "doorlopend"}
                        </p>
                      </>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>

                  <td className="px-4 py-3 text-muted">
                    {account.last_sign_in_at ? (
                      <span className="text-ink">
                        {formatShortDate(account.last_sign_in_at)}
                      </span>
                    ) : (
                      "Nog niet"
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {!editing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(account)}
                          disabled={rowBusy}
                        >
                          Periode
                        </Button>
                      )}
                      {ended ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            patch(account.id, { access_ends_on: null })
                          }
                          disabled={rowBusy}
                        >
                          Heractiveer
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => endAccess(account)}
                          disabled={rowBusy}
                        >
                          Beëindig
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nog geen deelnemersaccounts. Voeg er hierboven één toe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
