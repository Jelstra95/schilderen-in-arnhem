import Image from "next/image";
import werkCursisten from "@/assets/cursus/werk-cursisten.avif";
import jelleDocent from "@/assets/cursus/jelle-docent.jpg";
import monetBg from "@/assets/cursus/monet-landscape.jpg";
import quoteBg from "@/assets/cursus/quote-bg.jpg";
import impressieSlides from "@/assets/cursus/impressie-slides.webp";
import { Container } from "@/components/ui/Container";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { CourseCarousel } from "@/components/CourseCarousel";
import { StickyCta } from "@/components/StickyCta";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { courseGraph } from "@/lib/schema";
import { site, fullAddress } from "@/lib/site";

export const metadata: Metadata = {
  title: "Olieverf schildercursus in Arnhem",
  description: `Leer olieverf schilderen in Arnhem. Acht lessen in een kleine groep van maximaal zes cursisten, in het atelier aan de ${site.street} in ${site.district}. Geschikt voor beginners en gevorderden.`,
  alternates: { canonical: "/cursussen" },
};

/**
 * Each step opens with a question the lessons actually answer: it makes the
 * visitor curious without promising anything the course does not deliver.
 */
const steps = [
  {
    title: "Tekenen",
    question: "Waarom tekenen de meeste mensen wat ze denken te zien, in plaats van wat er echt staat?",
    body: "Je leert meten, vergelijken en kijken zoals de academies het eeuwenlang deden. Dat is de basis van elke sterke schildering.",
  },
  {
    title: "Licht en donker",
    question: "Waarom begonnen de oude meesters een schilderij vaak in één kleur?",
    body: "Je ontdekt hoe je met alleen licht en donker vorm, diepte en sfeer opbouwt, laag voor laag.",
  },
  {
    title: "Kleur",
    question: "Waarom is een schaduw in de natuur bijna nooit zwart?",
    body: "Je leert kleuren mengen en combineren tot harmonie, contrast en expressie, in plaats van losse vlakken verf.",
  },
];

const curriculum = [
  "Kijken als een kunstenaar: ontdekken waarom het ene schilderij je raakt en het andere niet",
  "Kunstgeschiedenis: de verhalen en werkwijzen van de grote meesters, en wat je er vandaag nog van leert",
  "Materiaalkennis: olieverf, penselen, mediums en dragers, en hoe je ze laat samenwerken",
  "Het ‘ontwerpen’ van een schilderij, ook vanuit verbeelding en fantasie",
  "Natuurgetrouw schilderen van landschappen, portretten en stillevens",
];

const dagen = site.course.days
  .map((d) => site.course.dayLabelsNl[d])
  .join(" of ");

const practical = [
  {
    label: "Wanneer",
    value: `Iedere ${dagen} van ${site.course.startTime} tot ${site.course.endTime} uur`,
  },
  { label: "Duur", value: `${site.course.lessons} lessen` },
  { label: "Kosten", value: `€${site.course.price} (exclusief materiaal)` },
  { label: "Locatie", value: `${fullAddress}, in mijn atelier` },
  { label: "Groepsgrootte", value: `Maximaal ${site.course.maxStudents} personen` },
  { label: "Instromen", value: "Op elk moment, de lespakketten zijn doorlopend" },
];

const materials: {
  product: string;
  /** Optional second line, set in a smaller type below the product. */
  detail?: string;
  price: number;
  category: string;
}[] = [
  {
    product: "Olieverf in veertien kleuren",
    detail:
      "Titaanwit, zinkwit, zwart, rauwe omber, sienna, oker, kobaltblauw, ultramarijnblauw, napelsgeel, karmijn, azogeel citroen, cadmiumrood, groene aarde en phtalogroen.",
    price: 150,
    category: "Verf",
  },
  { product: "Gamblin Gamsol OMS 125ml", price: 13, category: "Oplosmiddel" },
  { product: "Da Vinci Penselenzeep", price: 5, category: "Kwastenzeep" },
  { product: "Gamblin Solvent Free Fluid Medium 125ml", price: 18, category: "Medium" },
  { product: "Ami Hout Palet Rechthoek 18x27cm", price: 4, category: "Palet" },
  { product: "Van Beek Penselen Set Filament 12x", price: 23, category: "Penselen zacht" },
  { product: "Van Beek Penselen Set in Koker Varkenshaar Plat 10 Stuks", price: 17, category: "Penselen stug" },
];

/** Derived, so the total can never drift away from the rows above it. */
const materialsTotal = materials.reduce((sum, m) => sum + m.price, 0);

const reviews = [
  {
    name: "Franca",
    level: "cursist op gemiddeld niveau",
    quote:
      "Jelle zijn schildercursus is erg no nonsense. Geen droge theorie, duidelijk referentiemateriaal en hele goede hulp. Met prachtige resultaten!",
  },
  {
    name: "Jacob",
    level: "begon als beginner",
    quote:
      "Ik heb onlangs een schildercursus gevolgd bij Jelle en het was een geweldige ervaring. Jelle is een docent die op alle niveaus kan lesgeven, waardoor ik werd uitgedaagd. Zijn passie voor schilderen en zijn geduldige aanpak hebben me geholpen om mezelf aanzienlijk te verbeteren.",
  },
  {
    name: "Arnout",
    level: "gevorderde cursist",
    quote:
      "Jelle is een inspirerende leraar! Hij brengt de academische achtergrond en artistieke vrijheid goed in balans.",
  },
];

/** The short review that sits next to the hero, as a first piece of proof. */
const heroReview = reviews[2];

/**
 * Plain HTML, with no FAQPage markup: Google retired FAQ rich results for every
 * site in May 2026, so the schema buys nothing in the SERP.
 *
 * Only questions whose answer is not already somewhere else on the page belong
 * here. Prijs, locatie, duur, groepsgrootte en instromen staan in de lijst met
 * praktische informatie en horen daar thuis, niet ook nog een keer hier.
 */
const faq = [
  {
    q: "Heb ik ervaring nodig om mee te doen?",
    a: "Nee. In de groep zitten mensen die nog nooit geschilderd hebben naast mensen die al jaren bezig zijn. Je werkt op je eigen tempo aan opdrachten die bij jouw niveau passen.",
  },
  {
    q: "Ik kan helemaal niet tekenen. Kan ik dan toch meedoen?",
    a: "Ja. Tekenen is geen voorwaarde, het is juist een onderdeel van de cursus. Je leert kijken en meten, en dat blijkt voor bijna iedereen beter te leren dan ze zelf denken.",
  },
  {
    q: "Wat als ik een les mis?",
    a: "Binnen een reeks van acht lessen mag je één keer afzeggen. Die gemiste les schuift dan door. Mis je daarna nog een les, dan gaat die van je reeks af.",
  },
  {
    q: "Schilder ik in olieverf of in acrylverf?",
    a: "Je schildert in olieverf. De opbouw in lagen die we behandelen komt uit de werkwijze van de oude meesters en werkt het beste met olieverf.",
  },
  {
    q: "Welke materialen moet ik zelf aanschaffen?",
    a: "Je zorgt zelf voor verf, penselen en een palet. Bij de materiaalkosten hierboven staat precies wat je nodig hebt. Heb je al materiaal in huis, dan volstaat dat meestal prima.",
  },
];

/** Sections that already show a signup button, so the sticky bar hides there. */
const ctaSections = ["hero", "aanmelden"];

const questionHref = `mailto:${site.email}?subject=${encodeURIComponent("Vraag over de schildercursus")}`;

export default function LandingPage() {
  return (
    <>
      <JsonLd data={courseGraph({ reviews, teaches: curriculum })} />
      {/* Hero ------------------------------------------------------------- */}
      <section id="hero" className="relative overflow-hidden">
        <Container className="grid gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.2em] text-clay">
              Schildercursus in Arnhem
            </p>
            <h1 className="font-title text-5xl leading-[1.05] text-ink sm:text-6xl">
              Leer schilderen in olieverf als de oude en nieuwe meesters
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Waarom bestaat een schilderij van Rembrandt van dichtbij uit losse
              vegen, en komt het van een afstand tot leven? In acht avonden in
              mijn atelier in {site.district}{" "}
              ontdek je hoe dat werkt, en schilder je het zelf. Je leert
              olieverf schilderen in een groep van hooguit zes mensen, of je nu nog nooit een penseel
              hebt vastgehouden of al jaren schildert.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ButtonLink href="/inschrijven" size="lg">
                Ik meld mij aan!
              </ButtonLink>
              <a href={questionHref} className={buttonClasses("secondary", "lg")}>
                Stel eerst een vraag
              </a>
            </div>
            <p className="mt-6 text-sm text-muted">
              Iedere {dagen} van {site.course.startTime} tot{" "}
              {site.course.endTime} uur · maximaal {site.course.maxStudents}{" "}
              cursisten · op elk moment instromen
            </p>
          </div>

          <div className="relative">
            <figure className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-mist">
              <Image
                src={quoteBg}
                alt=""
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              {/* Darken the photo so the light quote text stays legible. */}
              <div className="absolute inset-0 bg-ink/65" />
              <div className="relative z-10 flex h-full flex-col justify-end p-8">
                <span className="font-title text-7xl leading-none text-clay/40">
                  &ldquo;
                </span>
                <blockquote className="font-body text-xl italic leading-relaxed text-paper/90">
                  {heroReview.quote}
                </blockquote>
                <figcaption className="mt-3 text-sm text-paper/70">
                  — {heroReview.name}, {heroReview.level}
                </figcaption>
              </div>
            </figure>
          </div>
        </Container>
      </section>

      {/* Werk van cursisten ---------------------------------------------- */}
      <section id="werk" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <div className="mb-8 max-w-xl">
            <h2 className="font-title text-4xl text-ink">
              Werk van cursisten van de schildercursus
            </h2>
            <p className="mt-2 text-muted">
              Dit schilderden eerdere cursisten tijdens de cursus. Sommigen
              begonnen net, anderen schilderden al langer. Allemaal werkten ze
              met dezelfde opbouw die jij ook leert.
            </p>
          </div>
          <Image
            src={werkCursisten}
            alt="Collage van olieverfschilderijen gemaakt door eerdere cursisten van de schildercursus in Arnhem"
            placeholder="blur"
            sizes="(min-width: 1024px) 48rem, 100vw"
            className="mx-auto h-auto w-full max-w-3xl"
          />
        </Container>
      </section>

      {/* Lesinhoud: drie stappen ----------------------------------------- */}
      <section id="cursus" className="scroll-mt-20 py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <h2 id="lesinhoud" className="scroll-mt-20 font-title text-4xl text-ink">
              Lesinhoud: in acht avonden leren schilderen in olieverf
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Je leert niet alleen hoe je schildert, maar vooral hoe je kijkt.
                We werken vanuit een heldere en beproefde opbouw, geïnspireerd op
                de werkwijze van oude én nieuwere meesters. In drie stappen leer
                je ideeën omzetten in overtuigende schilderijen.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="border-t border-line pt-5">
                <span className="font-title text-3xl text-clay/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-title text-xl text-ink">{s.title}</h3>
                <p className="mt-3 font-body italic leading-relaxed text-ink/80">
                  {s.question}
                </p>
                <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <h3 className="font-title text-2xl text-ink">
                Wat komt er aan bod
              </h3>
              <p className="mt-2 text-muted">
                Tijdens de cursus komen onder andere de volgende onderdelen aan
                bod:
              </p>
            </div>
            <ul className="space-y-4">
              {curriculum.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-t border-line pt-4 leading-relaxed text-muted"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
            <div>
              <h3 className="font-title text-2xl text-ink">
                Alle theorie terugzien op het cursusplatform
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-muted">
                Als cursist krijg je toegang tot het online cursusplatform. Daar
                staan de slides van de lessen en het theoretische materiaal, van
                aard- en synthetische pigmenten tot kleurenleer en de
                onderschildering van de oude meesters. Zo kun je thuis alles
                rustig teruglezen.
              </p>
            </div>
            <Image
              src={impressieSlides}
              alt="Impressie van lesslides over pigmenten, kleurenleer, mengschema's en de onderschildering bij Rembrandt"
              placeholder="blur"
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="h-auto w-full"
            />
          </div>

          <figure className="mx-auto mt-20 max-w-3xl text-center">
            <span
              aria-hidden
              className="block font-title text-7xl leading-none text-clay/40"
            >
              &ldquo;
            </span>
            <blockquote className="font-title text-3xl leading-snug text-ink sm:text-4xl">
              Na deze cursus zal een museumbezoek nooit meer hetzelfde zijn.
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted">
              — Jelle van de Ridder, docent
            </figcaption>
          </figure>
        </Container>
      </section>

      {/* Zo ziet een les eruit + impressie ------------------------------- */}
      <section id="impressie" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <div className="mb-10 grid gap-12 lg:grid-cols-2 lg:gap-20">
            <h2 className="font-title text-4xl text-ink">
              Zo ziet een schilderles in Arnhem eruit
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Iedere {dagen} kom je met een kleine groep samen in het atelier
                in {site.district}. We beginnen met koffie. Daarna nemen we een
                kwartier voor theorie of kunst kijken: we bekijken werk uit de
                kunstgeschiedenis en ontleden samen wat het sterk maakt.
              </p>
              <p>
                De rest van de avond schilder je zelf, aan een opdracht die bij
                jouw niveau past, en ik loop rond om iedereen persoonlijk te
                helpen. De laatste tien minuten sluiten we samen af.
              </p>
              <p>
                Heb je eigen ideeën of projecten waar je aan wilt werken, maar
                weet je niet goed hoe je die moet aanpakken? Ook daarvoor is
                volop ruimte. En soms trekken we met de groep naar buiten om
                plein-air te schilderen.
              </p>
            </div>
          </div>
          <CourseCarousel />
        </Container>
      </section>

      {/* Over de docent -------------------------------------------------- */}
      <section id="docent" className="scroll-mt-20 py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-title text-4xl text-ink">
              Over je docent Jelle van de Ridder
            </h2>
            <div className="mt-8 overflow-hidden rounded-xl border border-line">
              <Image
                src={jelleDocent}
                alt="Jelle van de Ridder in zijn atelier met penselen naast twee olieverfschilderijen"
                placeholder="blur"
                sizes="(min-width: 1024px) 32rem, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-muted">
            <p className="font-title text-2xl leading-snug text-ink">
              Als autodidact heb ik zelf alle denkbare obstakels van het
              schilderen doorlopen. Juist daardoor weet ik waar je tegenaan loopt.
            </p>
            <p>
              Lesgeven is voor mij meer dan kennis overdragen; het is samen
              kijken, onderzoeken en groeien. Mijn eerste ervaring met lesgeven
              in olieverfschilderen begon in 2019, toen ik tijdens de
              coronaperiode online les gaf aan vrienden en kennissen. Dit groeide
              al snel uit tot structurele cursussen.
            </p>
            <p>
              In 2024 en 2025 werkte ik als kunstdocent bij SKVR, het centrum
              voor kunsten in Rotterdam. Daar zag ik hoe beginners én
              gevorderden vastlopen op dezelfde vragen, en hoe je ze gericht
              verder helpt.
            </p>
            <blockquote className="border-l-2 border-clay pl-5 font-body italic text-ink/80">
              Je leert niet alleen hoe je schildert, maar vooral ook hoe je kijkt
              en denkt als kunstenaar. Na deze cursus ben je in staat je eigen
              projecten te realiseren met een sterke basis in de schilderkunst.
            </blockquote>
            <p>
              Mijn aanpak is technisch serieus, maar altijd visueel, praktisch en
              persoonlijk.
            </p>
          </div>
        </Container>
      </section>

      {/* Reviews --------------------------------------------------------- */}
      <section id="ervaringen" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <h2 className="font-title text-4xl text-ink">
            Ervaringen van cursisten
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {reviews.map((r) => (
              <figure
                key={r.name}
                className="flex flex-col rounded-xl border border-line bg-paper p-7"
              >
                <span className="font-title text-5xl leading-none text-clay/30">
                  &ldquo;
                </span>
                <blockquote className="mt-2 flex-1 font-body italic leading-relaxed text-ink/80">
                  {r.quote}
                </blockquote>
                <figcaption className="mt-5 text-sm text-muted">
                  — {r.name}, {r.level}
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* Praktische informatie en materiaal ------------------------------ */}
      <section id="praktisch" className="scroll-mt-20 py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-title text-4xl text-ink">
              Praktische informatie over de cursus in Arnhem
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted">
              <p>
                De kleine groep zorgt voor veel persoonlijke aandacht. Je kunt
                een sterke basis leggen of juist de diepte ingaan, afhankelijk
                van je niveau. De lespakketten zijn doorlopend, dus na afloop
                stroom je direct door naar een nieuwe reeks.
              </p>
            </div>
          </div>

          <dl className="divide-y divide-line border-y border-line">
            {practical.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[9rem_1fr] gap-4 py-4"
              >
                <dt className="text-sm uppercase tracking-wide text-clay">
                  {item.label}
                </dt>
                <dd className="text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Container>

        <Container>
          <div id="materiaal" className="mt-20 scroll-mt-20">
            <h3 className="font-title text-3xl text-ink">
              Materiaalkosten voor het schilderen in olieverf
            </h3>
            <div className="mt-6 max-w-2xl space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Je schildert met goede materialen, en die blijven na de cursus
                van jou. Tijdens de cursus word je aangemoedigd (het is
                vrijblijvend) om thuis verder te schilderen, en dan heb je de
                spullen al. Heb je al materiaal in huis, neem het dan gewoon
                mee.
              </p>
              <p>
                Een complete set om mee te beginnen kost ongeveer{" "}
                <span className="text-ink">€ {materialsTotal}</span>.
              </p>
            </div>

            <details className="group mt-8 border-y border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-ink [&::-webkit-details-marker]:hidden">
                <span>Bekijk de volledige materiaallijst</span>
                <span className="text-clay transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="overflow-x-auto pb-4">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line text-sm uppercase tracking-wide text-clay">
                      <th className="py-3 pr-4 font-normal">Product</th>
                      <th className="py-3 pr-4 font-normal">Categorie</th>
                      <th className="py-3 text-right font-normal">Prijs (±)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.product} className="border-b border-line/70">
                        <td className="py-3 pr-4 text-ink">
                          {m.product}
                          {m.detail && (
                            <span className="mt-1 block max-w-md text-sm leading-relaxed text-muted">
                              {m.detail}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted">{m.category}</td>
                        <td className="py-3 text-right tabular-nums text-ink">
                          € {m.price}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-ink font-title">
                      <td className="py-4 pr-4 text-ink" colSpan={2}>
                        Totaal
                      </td>
                      <td className="py-4 text-right tabular-nums text-ink">
                        € {materialsTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </Container>
      </section>

      {/* Veelgestelde vragen ---------------------------------------------- */}
      <section id="vragen" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <h2 className="font-title text-4xl text-ink">Veelgestelde vragen</h2>
          <dl className="mt-12 grid gap-x-20 gap-y-10 md:grid-cols-2">
            {faq.map((item) => (
              <div key={item.q} className="border-t border-line pt-5">
                <dt className="font-title text-xl text-ink">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-12 text-muted">
            Staat je vraag er niet tussen? Mail me op{" "}
            <a
              href={questionHref}
              className="text-ink underline underline-offset-4 hover:text-clay"
            >
              {site.email}
            </a>
            .
          </p>
        </Container>
      </section>

      {/* Slot-CTA -------------------------------------------------------- */}
      <section id="aanmelden" className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-xl px-8 py-16 text-center text-paper sm:px-16">
            <Image
              src={monetBg}
              alt=""
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
            />
            {/* Darken the bright Monet sky so white text stays legible. */}
            <div className="absolute inset-0 bg-ink/65" />
            <div className="relative z-10">
              <h2 className="font-title text-4xl text-paper">
                Klaar om anders te leren kijken?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-paper/85">
                Meld je aan voor de schildercursus in Arnhem. Na je aanmelding
                neem ik persoonlijk contact met je op over de startdatum, de
                betaling en de bevestiging van je plek.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <ButtonLink href="/inschrijven" size="lg" variant="onDark">
                  Ik meld mij aan!
                </ButtonLink>
                <a
                  href={questionHref}
                  className={buttonClasses("outlineOnDark", "lg")}
                >
                  Stel eerst een vraag
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <StickyCta hideWhileVisible={ctaSections} />
    </>
  );
}
