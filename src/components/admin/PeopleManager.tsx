"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { DAY_OPTIONS, todayISO } from "@/lib/admin-inquiries";
import { cn } from "@/lib/cn";
import { capitalize, formatShortDate } from "@/lib/format";
import type { CourseInquiry, InquiryStatus } from "@/lib/types";

export type Person = CourseInquiry & {
  access_starts_on: string | null;
  access_ends_on: string | null;
  last_sign_in_at: string | null;
};

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "Nieuw" },
  { value: "converted", label: "Aangemeld" },
  { value: "participated", label: "Deelgenomen" },
  { value: "archived", label: "Gearchiveerd" },
];

type Filter = "active" | "new" | "converted" | "participated" | "archived" | "all";

const FILTERS: { key: Filter; label: string; match: (p: Person) => boolean }[] = [
  { key: "active", label: "Actief", match: (p) => p.status !== "archived" },
  { key: "new", label: "Nieuw", match: (p) => p.status === "new" || p.status === "contacted" },
  { key: "converted", label: "Aangemeld", match: (p) => p.status === "converted" },
  { key: "participated", label: "Deelgenomen", match: (p) => p.status === "participated" },
  { key: "archived", label: "Gearchiveerd", match: (p) => p.status === "archived" },
  { key: "all", label: "Iedereen", match: () => true },
];

const smallControl =
  "rounded-md border border-line bg-paper px-2 py-1 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 disabled:opacity-50";

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
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [adding, setAdding] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    for (const f of FILTERS) c[f.key] = people.filter(f.match).length;
    return c;
  }, [people]);

  const waiting = people.filter((p) => !p.responded && p.status === "new").length;

  const visible = useMemo(() => {
    const match = FILTERS.find((f) => f.key === filter)!.match;
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
        match(p) &&
        (!q ||
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone ?? "").includes(q) ||
          (p.admin_notes ?? "").toLowerCase().includes(q)),
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
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
            placeholder="Zoek op naam, e-mail of notitie"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 py-2 text-sm"
          />
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              + Persoon toevoegen
            </Button>
          )}
        </div>
      </div>

      {waiting > 0 && (
        <p className="mb-4 text-sm text-amber-800">
          {waiting === 1
            ? "1 nieuwe aanvraag wacht nog op een reactie."
            : `${waiting} nieuwe aanvragen wachten nog op een reactie.`}
        </p>
      )}

      {adding && (
        <form onSubmit={addPerson} className="mb-6 rounded-lg border border-line bg-paper p-6">
          <p className="font-title text-lg text-ink">Persoon toevoegen</p>
          <p className="mt-1 text-sm text-muted">
            Voor iemand die zich telefonisch of persoonlijk heeft aangemeld. Daarna
            kun je de status op Aangemeld zetten om een account aan te maken.
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
            <Field label="Voorkeursavond" htmlFor="add_day">
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

      {/* Table ------------------------------------------------------------ */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Naam</th>
              <th className="px-3 py-3 font-medium">Binnen</th>
              <th className="px-3 py-3 font-medium">Avond</th>
              <th className="px-3 py-3 text-center font-medium">Gereageerd</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Startdatum</th>
              <th className="px-3 py-3 font-medium">Notitie</th>
              <th className="px-3 py-3" aria-label="Details" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                open={openId === person.id}
                onToggle={() => setOpenId((id) => (id === person.id ? null : person.id))}
                onError={setError}
                onConverted={setCredentials}
              />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  {query ? "Niemand gevonden." : "Hier staat nog niemand."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonRow({
  person,
  open,
  onToggle,
  onError,
  onConverted,
}: {
  person: Person;
  open: boolean;
  onToggle: () => void;
  onError: (message: string | null) => void;
  onConverted: (c: Credentials) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isParticipant = !!person.user_id;
  const waiting = !person.responded && person.status === "new";
  // Legacy rows from before the checkbox existed show as "Nieuw".
  const status = person.status === "contacted" ? "new" : person.status;

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

  async function changeStatus(next: InquiryStatus) {
    if (next === status) return;
    if (!isParticipant && (next === "converted" || next === "participated")) {
      if (
        !window.confirm(
          `Account aanmaken voor ${person.full_name} (${person.email}) met wachtwoord "olieverf"?`,
        )
      ) {
        router.refresh(); // put the dropdown back
        return;
      }
      setBusy(true);
      onError(null);
      try {
        const { ok, payload } = await send(`/api/admin/inquiries/${person.id}/account`, "POST");
        if (!ok) {
          onError(payload.error ?? "Aanmaken van het account is mislukt.");
          router.refresh();
          return;
        }
        if (next === "participated") {
          await send(`/api/admin/inquiries/${person.id}`, "PATCH", { status: next });
        }
        onConverted({ name: person.full_name, email: payload.email, password: payload.password });
        window.scrollTo({ top: 0, behavior: "smooth" });
        router.refresh();
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!(await patch({ status: next }))) router.refresh();
  }

  return (
    <Fragment>
      <tr className={cn("align-middle", open ? "bg-mist/40" : "hover:bg-mist/30")}>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-left">
            <span className="flex items-center gap-2 font-medium text-ink">
              {waiting && (
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500"
                  title="Wacht op een reactie"
                />
              )}
              {person.full_name}
            </span>
            <span className="block text-xs text-muted">{person.email}</span>
            {person.phone && <span className="block text-xs text-muted">{person.phone}</span>}
          </button>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-muted">
          {formatShortDate(person.created_at)}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-ink">
          {person.day_preference ?? <span className="text-muted">Geen voorkeur</span>}
        </td>
        <td className="px-3 py-3 text-center">
          <input
            type="checkbox"
            checked={person.responded}
            disabled={busy}
            onChange={(e) => patch({ responded: e.target.checked })}
            aria-label={`Gereageerd op ${person.full_name}`}
            className="h-4 w-4 accent-clay"
          />
        </td>
        <td className="px-3 py-3">
          <select
            key={status}
            defaultValue={status}
            disabled={busy}
            onChange={(e) => changeStatus(e.target.value as InquiryStatus)}
            aria-label={`Status van ${person.full_name}`}
            className={smallControl}
          >
            {STATUS_OPTIONS.map((o) => (
              <option
                key={o.value}
                value={o.value}
                disabled={isParticipant && o.value === "new"}
              >
                {o.label}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-3">
          {isParticipant ? (
            <StartDateInput key={person.access_starts_on ?? ""} person={person} busy={busy} onSave={patch} />
          ) : (
            <span className="text-xs text-muted">Nog geen account</span>
          )}
        </td>
        <td className="max-w-56 px-3 py-3">
          <button
            onClick={onToggle}
            className="block w-full truncate text-left text-muted hover:text-ink"
            title={person.admin_notes ?? undefined}
          >
            {person.admin_notes || <span className="text-ink/30">Toevoegen</span>}
          </button>
        </td>
        <td className="px-3 py-3 text-right">
          <button
            onClick={onToggle}
            className="text-sm text-clay hover:underline"
            aria-expanded={open}
          >
            {open ? "Sluiten" : "Details"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-mist/40">
          <td colSpan={8} className="px-4 pb-5 pt-1">
            <PersonDetails
              person={person}
              busy={busy}
              setBusy={setBusy}
              onSave={patch}
              onError={onError}
              onClose={onToggle}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/** Date input that saves itself shortly after the last change. */
function StartDateInput({
  person,
  busy,
  onSave,
}: {
  person: Person;
  busy: boolean;
  onSave: (changes: Record<string, unknown>) => Promise<boolean>;
}) {
  const saved = person.access_starts_on ?? "";
  const [value, setValue] = useState(saved);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    // Typing a year produces values like 0002-01-01 along the way; wait until
    // the date is complete and plausible before saving.
    if (!next || next === saved || Number(next.slice(0, 4)) < 2000) return;
    timer.current = setTimeout(() => onSave({ access_starts_on: next }), 800);
  }

  return (
    <input
      type="date"
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Startdatum van ${person.full_name}`}
      className={smallControl}
    />
  );
}

function PersonDetails({
  person,
  busy,
  setBusy,
  onSave,
  onError,
  onClose,
}: {
  person: Person;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onSave: (changes: Record<string, unknown>) => Promise<boolean>;
  onError: (message: string | null) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const isParticipant = !!person.user_id;

  const dayOptions: string[] = [...DAY_OPTIONS];
  if (person.day_preference && !dayOptions.includes(person.day_preference)) {
    dayOptions.push(person.day_preference);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const changes: Record<string, unknown> = {
      full_name: form.get("full_name"),
      email: form.get("email"),
      phone: form.get("phone"),
      day_preference: form.get("day_preference"),
      notes: form.get("notes"),
      admin_notes: form.get("admin_notes"),
    };
    if (isParticipant) changes.access_ends_on = form.get("access_ends_on") || null;
    if (await onSave(changes)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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

  async function remove() {
    const warning = isParticipant
      ? `${person.full_name} definitief verwijderen? Het account en de inloggegevens worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.`
      : `${person.full_name} definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`;
    if (!window.confirm(warning)) return;
    setBusy(true);
    onError(null);
    try {
      const { ok, payload } = await send(`/api/admin/inquiries/${person.id}`, "DELETE");
      if (!ok) {
        onError(payload.error ?? "Verwijderen is mislukt.");
        return;
      }
      onClose();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4 rounded-lg border border-line bg-paper p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-4">
        <Field label="Notities (alleen voor jou)" htmlFor={`admin-notes-${person.id}`}>
          <Textarea
            id={`admin-notes-${person.id}`}
            name="admin_notes"
            defaultValue={person.admin_notes ?? ""}
            placeholder="Bijvoorbeeld betaalafspraken of andere afspraken op maat."
            className="min-h-24 text-sm"
          />
        </Field>
      </div>

      <Field label="Naam" htmlFor={`name-${person.id}`}>
        <Input id={`name-${person.id}`} name="full_name" defaultValue={person.full_name} required className="py-2 text-sm" />
      </Field>
      <Field
        label="E-mailadres"
        htmlFor={`email-${person.id}`}
        hint={isParticipant ? "Hiermee logt deze persoon ook in." : undefined}
      >
        <Input
          id={`email-${person.id}`}
          name="email"
          type="email"
          defaultValue={person.email}
          required
          className="py-2 text-sm"
        />
      </Field>
      <Field label="Telefoonnummer" htmlFor={`phone-${person.id}`}>
        <Input id={`phone-${person.id}`} name="phone" type="tel" defaultValue={person.phone ?? ""} className="py-2 text-sm" />
      </Field>
      <Field label="Voorkeursavond" htmlFor={`day-${person.id}`}>
        <Select
          id={`day-${person.id}`}
          name="day_preference"
          defaultValue={person.day_preference ?? ""}
          className="py-2 text-sm"
        >
          <option value="">Geen voorkeur</option>
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </Field>

      {isParticipant && (
        <>
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
              min={person.access_starts_on ?? undefined}
              className="py-2 text-sm"
            />
          </Field>
          <div className="text-sm">
            <p className="mb-1.5 font-medium text-ink">Laatst ingelogd</p>
            <p className="text-muted">
              {person.last_sign_in_at
                ? capitalize(formatShortDate(person.last_sign_in_at))
                : "Nog niet"}
            </p>
            {person.access_ends_on && person.access_ends_on < todayISO() && (
              <Badge tone="cancelled" className="mt-2">Toegang beëindigd</Badge>
            )}
          </div>
        </>
      )}

      <div className="sm:col-span-2 lg:col-span-4">
        <Field label="Bericht van de aanmelder" htmlFor={`msg-${person.id}`}>
          <Textarea
            id={`msg-${person.id}`}
            name="notes"
            defaultValue={person.notes ?? ""}
            className="min-h-16 text-sm"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Bezig…" : "Opslaan"}
        </Button>
        {saved && <span className="text-sm text-emerald-700">Opgeslagen</span>}
        {isParticipant && (
          <Button type="button" size="sm" variant="secondary" onClick={viewAs} disabled={busy}>
            Bekijk als
          </Button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="ml-auto text-sm text-red-700 hover:underline disabled:opacity-50"
        >
          Verwijderen
        </button>
      </div>
    </form>
  );
}
