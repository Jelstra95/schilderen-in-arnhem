"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { DAY_OPTIONS, todayISO } from "@/lib/admin-inquiries";
import { cn } from "@/lib/cn";
import { capitalize, formatDay, formatShortDate } from "@/lib/format";
import type { CourseInquiry, InquiryStatus } from "@/lib/types";

export type Person = CourseInquiry & {
  access_starts_on: string | null;
  access_ends_on: string | null;
  last_sign_in_at: string | null;
};

const statusLabel: Record<InquiryStatus, string> = {
  new: "Nieuw",
  contacted: "Gereageerd",
  converted: "Aangemeld",
  participated: "Deelgenomen",
  archived: "Gearchiveerd",
};

const statusTone: Record<
  InquiryStatus,
  "pending" | "confirmed" | "cancelled" | "neutral" | "available"
> = {
  new: "pending",
  contacted: "neutral",
  converted: "confirmed",
  participated: "available",
  archived: "cancelled",
};

type Filter = "open" | "signed_up" | "participated" | "archived" | "all";

const FILTERS: { key: Filter; label: string; match: (p: Person) => boolean }[] = [
  { key: "open", label: "Open aanvragen", match: (p) => p.status === "new" || p.status === "contacted" },
  { key: "signed_up", label: "Aangemeld", match: (p) => p.status === "converted" },
  { key: "participated", label: "Deelgenomen", match: (p) => p.status === "participated" },
  { key: "archived", label: "Gearchiveerd", match: (p) => p.status === "archived" },
  { key: "all", label: "Iedereen", match: () => true },
];

function accessStatus(p: Person): { label: string; tone: "pending" | "confirmed" | "cancelled" } {
  const today = todayISO();
  if (p.access_starts_on && p.access_starts_on > today) {
    return { label: "Nog niet gestart", tone: "pending" };
  }
  if (p.access_ends_on && p.access_ends_on < today) {
    return { label: "Toegang beëindigd", tone: "cancelled" };
  }
  return { label: "Toegang actief", tone: "confirmed" };
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  return { ok: res.ok, payload };
}

interface Credentials {
  name: string;
  email: string;
  password: string | null;
}

export function PeopleManager({ people }: { people: Person[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [adding, setAdding] = useState(false);
  const [addBusy, setAddBusy] = useState(false);

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    for (const f of FILTERS) c[f.key] = people.filter(f.match).length;
    return c;
  }, [people]);

  const visible = useMemo(() => {
    const match = FILTERS.find((f) => f.key === filter)!.match;
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
        match(p) &&
        (!q ||
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone ?? "").includes(q)),
    );
  }, [people, filter, query]);

  async function addPerson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setAddBusy(true);
    try {
      const { ok, payload } = await send("/api/admin/inquiries", "POST", {
        full_name: form.get("full_name"),
        email: form.get("email"),
        phone: form.get("phone"),
        day_preference: form.get("day_preference"),
        admin_notes: form.get("admin_notes"),
      });
      if (!ok) {
        setError(payload.error ?? "Toevoegen is mislukt.");
        return;
      }
      setAdding(false);
      setFilter("open");
      router.refresh();
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <div>
      {credentials && (
        <div className="mb-6 rounded-lg border border-clay/30 bg-clay/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-title text-lg text-ink">
                {credentials.name} is nu deelnemer
              </p>
              <p className="mt-1 text-sm text-muted">
                {credentials.password
                  ? "Geef deze inloggegevens door. Vraag hen het wachtwoord na de eerste keer inloggen te wijzigen."
                  : "Er bestond al een account op dit e-mailadres. Dat account is gekoppeld en houdt zijn eigen wachtwoord."}
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-24 text-ink/50">E-mail</dt>
                  <dd className="font-mono text-ink">{credentials.email}</dd>
                </div>
                {credentials.password && (
                  <div className="flex gap-2">
                    <dt className="w-24 text-ink/50">Wachtwoord</dt>
                    <dd className="font-mono text-ink">{credentials.password}</dd>
                  </div>
                )}
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
        <div className="mb-4 flex items-start justify-between gap-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="shrink-0 hover:text-red-900">
            Sluiten
          </button>
        </div>
      )}

      {/* Toolbar ---------------------------------------------------------- */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md border px-4 py-1.5 text-sm transition-colors",
              filter === f.key
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink hover:bg-mist",
            )}
          >
            {f.label}
            <span className={cn("ml-2", filter === f.key ? "text-paper/60" : "text-muted")}>
              {counts[f.key]}
            </span>
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Zoek op naam of e-mail"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56 py-2 text-sm"
          />
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              + Persoon toevoegen
            </Button>
          )}
        </div>
      </div>

      {adding && (
        <form onSubmit={addPerson} className="mb-6 rounded-lg border border-line bg-paper p-6">
          <p className="font-title text-lg text-ink">Persoon toevoegen</p>
          <p className="mt-1 text-sm text-muted">
            Voor iemand die zich telefonisch of persoonlijk heeft aangemeld. Daarna
            kun je direct een account aanmaken.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Naam" htmlFor="add_full_name">
              <Input id="add_full_name" name="full_name" required autoComplete="off" />
            </Field>
            <Field label="E-mailadres" htmlFor="add_email">
              <Input id="add_email" name="email" type="email" required autoComplete="off" />
            </Field>
            <Field label="Telefoonnummer" htmlFor="add_phone">
              <Input id="add_phone" name="phone" type="tel" autoComplete="off" />
            </Field>
            <Field label="Voorkeursdag" htmlFor="add_day">
              <Select id="add_day" name="day_preference" defaultValue="">
                <option value="">Geen voorkeur</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notities" htmlFor="add_notes">
                <Textarea id="add_notes" name="admin_notes" className="min-h-20" />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={addBusy}>
              {addBusy ? "Bezig…" : "Toevoegen"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Annuleren
            </Button>
          </div>
        </form>
      )}

      {/* People ----------------------------------------------------------- */}
      <div className="space-y-4">
        {visible.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onError={setError}
            onConverted={setCredentials}
          />
        ))}
        {visible.length === 0 && (
          <p className="rounded-lg border border-line px-4 py-10 text-center text-muted">
            {query ? "Niemand gevonden." : "Hier staat nog niemand."}
          </p>
        )}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  onError,
  onConverted,
}: {
  person: Person;
  onError: (message: string | null) => void;
  onConverted: (c: Credentials) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(person.admin_notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);

  const isParticipant = !!person.user_id;
  const notesDirty = notes !== (person.admin_notes ?? "");
  const access = isParticipant ? accessStatus(person) : null;
  const ended = !!person.access_ends_on && person.access_ends_on < todayISO();

  async function patch(changes: Record<string, unknown>) {
    setBusy(true);
    onError(null);
    try {
      const { ok, payload } = await send(`/api/admin/inquiries/${person.id}`, "PATCH", changes);
      if (!ok) {
        onError(payload.error ?? "Bijwerken is mislukt.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    if (await patch({ admin_notes: notes })) {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  }

  async function createAccount() {
    if (
      !window.confirm(
        `Account aanmaken voor ${person.full_name} (${person.email}) met wachtwoord "olieverf"?`,
      )
    ) {
      return;
    }
    setBusy(true);
    onError(null);
    try {
      const { ok, payload } = await send(`/api/admin/inquiries/${person.id}/account`, "POST");
      if (!ok) {
        onError(payload.error ?? "Aanmaken van het account is mislukt.");
        return;
      }
      onConverted({ name: person.full_name, email: payload.email, password: payload.password });
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function viewAs() {
    setBusy(true);
    onError(null);
    try {
      const { ok, payload } = await send("/api/admin/preview", "POST", {
        participant_id: person.user_id,
      });
      if (!ok) {
        onError(payload.error ?? "Kon niet als deelnemer bekijken.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function endAccess() {
    if (!window.confirm(`Toegang van ${person.full_name} beëindigen per vandaag?`)) return;
    await patch({ access_ends_on: todayISO() });
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const changes: Record<string, unknown> = {
      full_name: form.get("full_name"),
      email: form.get("email"),
      phone: form.get("phone"),
      day_preference: form.get("day_preference"),
      notes: form.get("notes"),
    };
    changes.status = form.get("status");
    if (isParticipant) {
      changes.access_starts_on = form.get("access_starts_on");
      changes.access_ends_on = form.get("access_ends_on") || null;
    }
    if (await patch(changes)) setEditing(false);
  }

  const dayOptions: string[] = [...DAY_OPTIONS];
  if (person.day_preference && !dayOptions.includes(person.day_preference)) {
    dayOptions.push(person.day_preference);
  }

  return (
    <article className="rounded-lg border border-line bg-paper p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-title text-xl text-ink">{person.full_name}</h3>
            <Badge tone={statusTone[person.status]}>{statusLabel[person.status]}</Badge>
            {access && <Badge tone={access.tone}>{access.label}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            <a href={`mailto:${person.email}`} className="underline-offset-2 hover:underline">
              {person.email}
            </a>
            {person.phone && <> · {person.phone}</>}
          </p>
        </div>
        <p className="text-sm text-muted">Aangemeld {formatShortDate(person.created_at)}</p>
      </div>

      {editing ? (
        <form onSubmit={saveEdit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Naam" htmlFor={`name-${person.id}`}>
            <Input id={`name-${person.id}`} name="full_name" defaultValue={person.full_name} required />
          </Field>
          <Field
            label="E-mailadres"
            htmlFor={`email-${person.id}`}
            hint={isParticipant ? "Dit is ook het e-mailadres waarmee ze inloggen." : undefined}
          >
            <Input
              id={`email-${person.id}`}
              name="email"
              type="email"
              defaultValue={person.email}
              required
            />
          </Field>
          <Field label="Telefoonnummer" htmlFor={`phone-${person.id}`}>
            <Input id={`phone-${person.id}`} name="phone" type="tel" defaultValue={person.phone ?? ""} />
          </Field>
          <Field label="Voorkeursdag" htmlFor={`day-${person.id}`}>
            <Select
              id={`day-${person.id}`}
              name="day_preference"
              defaultValue={person.day_preference ?? ""}
            >
              <option value="">Geen voorkeur</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          {isParticipant ? (
            <>
              <Field label="Status" htmlFor={`status-${person.id}`}>
                <Select id={`status-${person.id}`} name="status" defaultValue={person.status}>
                  <option value="converted">Aangemeld</option>
                  <option value="participated">Deelgenomen</option>
                </Select>
              </Field>
              <div className="hidden sm:block" />
              <Field label="Toegang vanaf" htmlFor={`start-${person.id}`}>
                <Input
                  id={`start-${person.id}`}
                  name="access_starts_on"
                  type="date"
                  required
                  defaultValue={person.access_starts_on ?? todayISO()}
                />
              </Field>
              <Field
                label="Toegang tot en met"
                htmlFor={`end-${person.id}`}
                hint="Leeg laten voor doorlopende toegang."
              >
                <Input
                  id={`end-${person.id}`}
                  name="access_ends_on"
                  type="date"
                  defaultValue={person.access_ends_on ?? ""}
                />
              </Field>
            </>
          ) : (
            <Field label="Status" htmlFor={`status-${person.id}`}>
              <Select id={`status-${person.id}`} name="status" defaultValue={person.status}>
                <option value="new">Nieuw</option>
                <option value="contacted">Gereageerd</option>
                <option value="archived">Gearchiveerd</option>
              </Select>
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field label="Bericht van de aanmelder" htmlFor={`msg-${person.id}`}>
              <Textarea
                id={`msg-${person.id}`}
                name="notes"
                defaultValue={person.notes ?? ""}
                className="min-h-20"
              />
            </Field>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Bezig…" : "Opslaan"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Annuleren
            </Button>
          </div>
        </form>
      ) : (
        <>
          {/* Details */}
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink/50">Voorkeursdag</dt>
              <dd className="text-ink">{person.day_preference ?? "Geen voorkeur"}</dd>
            </div>
            {isParticipant && (
              <>
                <div>
                  <dt className="text-ink/50">Toegang</dt>
                  <dd className="text-ink">
                    {person.access_starts_on
                      ? `Vanaf ${formatDay(person.access_starts_on)}`
                      : "Geen startdatum"}
                    <span className="block text-muted">
                      {person.access_ends_on
                        ? `t/m ${formatDay(person.access_ends_on)}`
                        : "doorlopend"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-ink/50">Laatst ingelogd</dt>
                  <dd className="text-ink">
                    {person.last_sign_in_at
                      ? capitalize(formatShortDate(person.last_sign_in_at))
                      : "Nog niet"}
                  </dd>
                </div>
              </>
            )}
          </dl>

          {person.notes && (
            <div className="mt-4 text-sm">
              <p className="text-ink/50">Bericht van de aanmelder</p>
              <p className="mt-1 whitespace-pre-wrap text-ink">{person.notes}</p>
            </div>
          )}
        </>
      )}

      {/* Private notes, always editable */}
      <div className="mt-5">
        <label htmlFor={`admin-notes-${person.id}`} className="text-sm text-ink/50">
          Notities (alleen voor jou)
        </label>
        <Textarea
          id={`admin-notes-${person.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bijvoorbeeld betaalafspraken of andere afspraken op maat."
          className="mt-1 min-h-20 text-sm"
        />
        {(notesDirty || notesSaved) && (
          <div className="mt-2 flex items-center gap-2">
            {notesDirty ? (
              <>
                <Button size="sm" onClick={saveNotes} disabled={busy}>
                  {busy ? "Bezig…" : "Notitie opslaan"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNotes(person.admin_notes ?? "")}>
                  Herstellen
                </Button>
              </>
            ) : (
              <span className="text-sm text-emerald-700">Opgeslagen</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {!isParticipant && (
            <Button size="sm" onClick={createAccount} disabled={busy}>
              {busy ? "Bezig…" : "Account aanmaken"}
            </Button>
          )}
          {isParticipant && (
            <Button size="sm" variant="secondary" onClick={viewAs} disabled={busy}>
              Bekijk als
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)} disabled={busy}>
            Bewerken
          </Button>
          {!isParticipant && person.status === "new" && (
            <Button size="sm" variant="ghost" onClick={() => patch({ status: "contacted" })} disabled={busy}>
              Markeer als gereageerd
            </Button>
          )}
          {!isParticipant && person.status === "contacted" && (
            <Button size="sm" variant="ghost" onClick={() => patch({ status: "new" })} disabled={busy}>
              Nog niet gereageerd
            </Button>
          )}
          {isParticipant && person.status === "converted" && (
            <Button size="sm" variant="ghost" onClick={() => patch({ status: "participated" })} disabled={busy}>
              Markeer als deelgenomen
            </Button>
          )}
          {isParticipant && person.status === "participated" && (
            <Button size="sm" variant="ghost" onClick={() => patch({ status: "converted" })} disabled={busy}>
              Terug naar aangemeld
            </Button>
          )}
          {!isParticipant && person.status !== "archived" && (
            <Button size="sm" variant="ghost" onClick={() => patch({ status: "archived" })} disabled={busy}>
              Archiveren
            </Button>
          )}
          {!isParticipant && person.status === "archived" && (
            <Button size="sm" variant="ghost" onClick={() => patch({ status: "contacted" })} disabled={busy}>
              Terugzetten
            </Button>
          )}
          {isParticipant &&
            (ended ? (
              <Button size="sm" variant="ghost" onClick={() => patch({ access_ends_on: null })} disabled={busy}>
                Heractiveer toegang
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={endAccess} disabled={busy}>
                Beëindig toegang
              </Button>
            ))}
        </div>
      )}
    </article>
  );
}
