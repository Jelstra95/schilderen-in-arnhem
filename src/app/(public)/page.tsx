import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { CourseDateCard } from "@/components/CourseDateCard";
import { getCourseDatesWithAvailability } from "@/lib/availability";
import type { CourseDateWithAvailability } from "@/lib/types";

const benefits = [
  {
    title: "Kleine groepen",
    body: "Maximaal een handvol deelnemers per datum, zodat er alle ruimte is voor persoonlijke aandacht.",
  },
  {
    title: "Alle materialen aanwezig",
    body: "Verf, doek en kwasten staan voor je klaar. Je hoeft alleen jezelf en je nieuwsgierigheid mee te nemen.",
  },
  {
    title: "Voor elk niveau",
    body: "Of je nu nooit een kwast vasthield of al jaren schildert — je werkt op je eigen tempo en niveau.",
  },
  {
    title: "Begeleiding door Jelle",
    body: "Professioneel kunstenaar Jelle van der Ridder begeleidt je stap voor stap naar een werk om trots op te zijn.",
  },
];

export default async function LandingPage() {
  let dates: CourseDateWithAvailability[] = [];
  try {
    dates = await getCourseDatesWithAvailability({
      upcomingOnly: true,
      openOnly: true,
    });
  } catch {
    // Supabase not configured yet — render the page without live dates.
  }

  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <Container className="grid gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.2em] text-clay">
              Schildercursus · Arnhem
            </p>
            <h1 className="font-title text-5xl leading-[1.05] text-ink sm:text-6xl">
              Ontdek de schilder in jezelf
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Een ontspannen middag schilderen onder professionele begeleiding.
              In een kleine groep, met alle materialen binnen handbereik, maak je
              je eigen schilderij — ongeacht je ervaring.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ButtonLink href="/inschrijven" size="lg">
                Schrijf je in
              </ButtonLink>
              <Link
                href="#cursus"
                className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Lees meer over de cursus
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-mist via-paper to-clay/10">
              <div className="flex h-full flex-col justify-end p-8">
                <span className="font-title text-7xl leading-none text-clay/30">
                  &ldquo;
                </span>
                <p className="font-body text-lg italic leading-relaxed text-ink/70">
                  Iedereen kan schilderen. Het enige wat je nodig hebt is de
                  moed om te beginnen.
                </p>
                <p className="mt-3 text-sm text-muted">— Jelle van der Ridder</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Over de cursus -------------------------------------------------- */}
      <section id="cursus" className="scroll-mt-20 py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-title text-4xl text-ink">Over de cursus</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-muted">
            <p>
              Tijdens een dagdeel neem ik je mee in de wereld van kleur,
              compositie en penseelvoering. We beginnen bij het begin en bouwen
              rustig op, zodat je aan het eind een afgerond werk mee naar huis
              neemt.
            </p>
            <p>
              Het draait om plezier en ontdekken. Er is geen goed of fout — wel
              een hoop te leren én te genieten. De sfeer is ongedwongen, de groep
              klein en de begeleiding persoonlijk.
            </p>
          </div>
        </Container>
      </section>

      {/* Voordelen ------------------------------------------------------- */}
      <section id="voordelen" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <h2 className="font-title text-4xl text-ink">Waarom meedoen</h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="border-t border-line pt-5">
                <h3 className="font-title text-xl text-ink">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{b.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Beschikbare data ------------------------------------------------ */}
      <section id="data" className="scroll-mt-20 py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-title text-4xl text-ink">Beschikbare data</h2>
              <p className="mt-2 text-muted">
                Kies een datum die jou uitkomt en schrijf je in.
              </p>
            </div>
            <ButtonLink href="/inschrijven" variant="secondary" size="sm">
              Naar het inschrijven
            </ButtonLink>
          </div>

          {dates.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dates.slice(0, 6).map((d) => (
                <CourseDateCard
                  key={d.id}
                  date={d}
                  href={`/inschrijven?datum=${d.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-line bg-mist/40 p-10 text-center">
              <p className="text-muted">
                Er staan op dit moment geen data online. Houd deze pagina in de
                gaten — binnenkort verschijnen hier nieuwe cursusmomenten.
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* Slot-CTA -------------------------------------------------------- */}
      <section className="py-20">
        <Container>
          <div className="rounded-[2rem] bg-ink px-8 py-16 text-center text-paper sm:px-16">
            <h2 className="font-title text-4xl text-paper">
              Klaar om te beginnen?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-paper/70">
              Reserveer je plek op een van de beschikbare data. Na je
              aanmelding neem ik persoonlijk contact met je op.
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/inschrijven" size="lg" variant="onDark">
                Schrijf je in
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
