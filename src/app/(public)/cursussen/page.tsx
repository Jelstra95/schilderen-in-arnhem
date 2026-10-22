import Image, { type StaticImageData } from "next/image";
import werkCursisten from "@/assets/cursus/werk-cursisten.avif";
import jelleDocent from "@/assets/cursus/jelle-docent.jpg";
import vermeer from "@/assets/cursus/vermeer-waterkan.jpg";
import abstractNieuw from "@/assets/cursus/abstract-nieuw.jpg";
import impressieSlides from "@/assets/cursus/impressie-slides.webp";
import { Container } from "@/components/ui/Container";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { CourseCarousel } from "@/components/CourseCarousel";
import { HeroVideo } from "@/components/HeroVideo";
import { StickyCta } from "@/components/StickyCta";
import { RichText } from "@/components/RichText";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { courseGraph } from "@/lib/schema";
import { delay } from "@/lib/motion";
import { cursus } from "@/content/cursus";

export const metadata: Metadata = {
  ...cursus.meta,
  alternates: { canonical: "/cursussen" },
};

/** All texts on this page live in src/content/cursus.ts. */
const {
  cta,
  hero,
  werk,
  lesinhoud,
  impressie,
  docent,
  ervaringen,
  praktisch,
  materiaal,
  vragen,
  aanmelden,
} = cursus;

/** Sections that already show a signup button, so the sticky bar hides there. */
const ctaSections = ["hero", "aanmelden"];

export default function LandingPage() {
  return (
    <>
      <JsonLd
        data={courseGraph({
          reviews: ervaringen.reviews,
          teaches: lesinhoud.curriculum,
        })}
      />
      {/* Hero: text over a silent loop of painting close-ups ------------- */}
      <section
        id="hero"
        className="relative isolate flex min-h-[85svh] items-center overflow-hidden bg-ink text-paper"
      >
        <HeroVideo
          src="/video/schilderhandelingen.mp4"
          poster="/video/schilderhandelingen-poster.jpg"
        />
        {/* Darken the footage, most of all behind the text on the left. */}
        <div className="absolute inset-0 bg-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent" />

        <Container className="relative z-10 py-24 sm:py-32">
          <div className="max-w-2xl">
            <p className="rise mb-5 text-sm uppercase tracking-[0.2em] text-paper/70">
              {hero.eyebrow}
            </p>
            <h1
              className="rise font-title text-5xl leading-[1.05] text-paper sm:text-6xl"
              style={delay(120)}
            >
              {hero.title}
            </h1>
            <p
              className="rise mt-6 max-w-xl text-lg leading-relaxed text-paper/85"
              style={delay(260)}
            >
              {hero.intro}
            </p>
            <div
              className="rise mt-9 flex flex-wrap items-center gap-4"
              style={delay(400)}
            >
              <ButtonLink href="/inschrijven" size="lg" variant="onDark">
                {cta.signup}
              </ButtonLink>
              <a
                href={cta.questionHref}
                className={buttonClasses("outlineOnDark", "lg")}
              >
                {cta.question}
              </a>
            </div>
            <p className="rise mt-6 text-sm text-paper/70" style={delay(500)}>
              {hero.facts}
            </p>
          </div>
        </Container>
      </section>

      {/* Werk van cursisten ---------------------------------------------- */}
      <section id="werk" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <div data-reveal className="mb-8 max-w-xl">
            <h2 className="font-title text-4xl text-ink">{werk.title}</h2>
            <p className="mt-2 text-muted">{werk.intro}</p>
          </div>
          <Image
            data-reveal="zoom"
            src={werkCursisten}
            alt={werk.imageAlt}
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
            <h2
              id="lesinhoud"
              data-reveal
              className="scroll-mt-20 font-title text-4xl text-ink"
            >
              {lesinhoud.title}
            </h2>
            <div
              data-reveal="right"
              className="space-y-5 text-lg leading-relaxed text-muted"
            >
              <p>{lesinhoud.intro}</p>
            </div>
          </div>

          <div data-reveal-stagger className="mt-14 grid gap-10 sm:grid-cols-3">
            {lesinhoud.steps.map((s, i) => (
              <div
                key={s.title}
                data-reveal
                className="border-t border-line pt-5"
              >
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
            <div data-reveal>
              <h3 className="font-title text-2xl text-ink">
                {lesinhoud.curriculumTitle}
              </h3>
              <p className="mt-2 text-muted">{lesinhoud.curriculumIntro}</p>
            </div>
            <ul data-reveal-stagger className="space-y-4">
              {lesinhoud.curriculum.map((item) => (
                <li
                  key={item}
                  data-reveal
                  className="flex gap-3 border-t border-line pt-4 leading-relaxed text-muted"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
            <div data-reveal>
              <h3 className="font-title text-2xl text-ink">
                {lesinhoud.platformTitle}
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-muted">
                {lesinhoud.platformText}
              </p>
            </div>
            <Image
              data-reveal="zoom"
              src={impressieSlides}
              alt={lesinhoud.platformImageAlt}
              placeholder="blur"
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="h-auto w-full"
            />
          </div>

          <figure data-reveal className="mx-auto mt-20 max-w-3xl text-center">
            <span
              aria-hidden
              className="block font-title text-7xl leading-none text-clay/40"
            >
              &ldquo;
            </span>
            <blockquote className="font-title text-3xl leading-snug text-ink sm:text-4xl">
              {lesinhoud.quote}
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted">
              — {lesinhoud.quoteBy}
            </figcaption>
          </figure>
        </Container>
      </section>

      {/* Zo ziet een les eruit + impressie ------------------------------- */}
      <section id="impressie" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <div className="mb-10 grid gap-12 lg:grid-cols-2 lg:gap-20">
            <h2 data-reveal className="font-title text-4xl text-ink">
              {impressie.title}
            </h2>
            <div
              data-reveal="right"
              className="space-y-5 text-lg leading-relaxed text-muted"
            >
              {impressie.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          </div>
          <div data-reveal="zoom">
            <CourseCarousel />
          </div>
        </Container>
      </section>

      {/* Over de docent -------------------------------------------------- */}
      <section id="docent" className="scroll-mt-20 py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 data-reveal className="font-title text-4xl text-ink">
              {docent.title}
            </h2>
            <div
              data-reveal="zoom"
              className="mt-8 overflow-hidden rounded-xl border border-line"
            >
              <Image
                src={jelleDocent}
                alt={docent.imageAlt}
                placeholder="blur"
                sizes="(min-width: 1024px) 32rem, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
          <div
            data-reveal="right"
            className="space-y-5 text-lg leading-relaxed text-muted"
          >
            <p className="font-title text-2xl leading-snug text-ink">
              {docent.lead}
            </p>
            {docent.paragraphs.map((p) => (
              <p key={p}>
                <RichText text={p} />
              </p>
            ))}
            <blockquote className="border-l-2 border-clay pl-5 font-body italic text-ink/80">
              {docent.quote}
            </blockquote>
            <p>
              <RichText text={docent.closing} />
            </p>
          </div>
        </Container>
      </section>

      {/* Reviews --------------------------------------------------------- */}
      <section id="ervaringen" className="scroll-mt-20 bg-mist/50 py-20">
        <Container>
          <h2 data-reveal className="font-title text-4xl text-ink">
            {ervaringen.title}
          </h2>
          <div data-reveal-stagger className="mt-12 grid gap-8 md:grid-cols-3">
            {ervaringen.reviews.map((r) => (
              <figure
                key={r.name}
                data-reveal
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
          <div data-reveal>
            <h2 className="font-title text-4xl text-ink">{praktisch.title}</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted">
              <p>
                <RichText text={praktisch.intro} />
              </p>
            </div>
          </div>

          <dl
            data-reveal="right"
            className="divide-y divide-line border-y border-line"
          >
            {praktisch.items.map((item) => (
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
          <div id="materiaal" data-reveal className="mt-20 scroll-mt-20">
            <h3 className="font-title text-3xl text-ink">{materiaal.title}</h3>
            <div className="mt-6 max-w-2xl space-y-5 text-lg leading-relaxed text-muted">
              {materiaal.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>

            <details className="group mt-8 border-y border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-ink [&::-webkit-details-marker]:hidden">
                <span>{materiaal.toggle}</span>
                <span className="text-clay transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="overflow-x-auto pb-4">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line text-sm uppercase tracking-wide text-clay">
                      <th className="py-3 pr-4 font-normal">
                        {materiaal.columns.product}
                      </th>
                      <th className="py-3 pr-4 font-normal">
                        {materiaal.columns.category}
                      </th>
                      <th className="py-3 text-right font-normal">
                        {materiaal.columns.price}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiaal.items.map((m) => (
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
                        {materiaal.totalLabel}
                      </td>
                      <td className="py-4 text-right tabular-nums text-ink">
                        € {materiaal.total}
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
          <h2 data-reveal className="font-title text-4xl text-ink">
            {vragen.title}
          </h2>
          <dl
            data-reveal-stagger
            className="mt-12 grid gap-x-20 gap-y-10 md:grid-cols-2"
          >
            {vragen.items.map((item) => (
              <div
                key={item.q}
                data-reveal
                className="border-t border-line pt-5"
              >
                <dt className="font-title text-xl text-ink">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-muted">
                  <RichText text={item.a} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-12 text-muted">
            <RichText text={vragen.footer} />
          </p>
        </Container>
      </section>

      {/* Slot-CTA: an old and a new master on either side of the signup.
          The negative bottom margin cancels the footer's top margin, so the
          dark band runs straight into the footer without a cream strip. */}
      <section
        id="aanmelden"
        className="relative isolate -mb-24 overflow-hidden bg-ink py-24 text-paper sm:py-32 lg:py-40"
      >
        {/* A warm glow behind the text, picking up the clay of the paintings. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(157,92,63,0.35),transparent_65%)]"
        />
        <Container className="grid items-center gap-14 lg:grid-cols-[1fr_1.6fr_1fr] lg:gap-12">
          <Painting
            src={vermeer}
            alt={aanmelden.paintingLeft.alt}
            label={aanmelden.paintingLeft.label}
            side="left"
          />

          <div data-reveal className="text-center">
            <p className="mb-5 text-sm uppercase tracking-[0.25em] text-clay">
              {aanmelden.eyebrow}
            </p>
            <h2 className="font-title text-4xl leading-tight text-paper sm:text-5xl xl:text-6xl">
              {aanmelden.title}
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-paper/75">
              {aanmelden.text}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/inschrijven" size="lg" variant="onDark">
                {cta.signup}
              </ButtonLink>
              <a
                href={cta.questionHref}
                className={buttonClasses("outlineOnDark", "lg")}
              >
                {cta.question}
              </a>
            </div>
          </div>

          <Painting
            src={abstractNieuw}
            alt={aanmelden.paintingRight.alt}
            label={aanmelden.paintingRight.label}
            side="right"
          />
        </Container>
      </section>

      <StickyCta hideWhileVisible={ctaSections} />
    </>
  );
}

/**
 * One painting in the closing banner. It zooms into place, hangs at
 * a slight tilt like a canvas on an easel, floats gently, and straightens when
 * you hover it. On small screens the two paintings frame the text, above and
 * below it.
 */
function Painting({
  src,
  alt,
  label,
  side,
}: {
  src: StaticImageData;
  alt: string;
  label: string;
  side: "left" | "right";
}) {
  const left = side === "left";
  return (
    <div
      data-reveal="zoom"
      style={delay(left ? 0 : 150)}
      className="mx-auto w-full max-w-[16rem] sm:max-w-xs lg:max-w-none"
    >
      <div className={left ? "float-a" : "float-b"}>
        <figure
          className={`group transition-transform duration-700 ease-out hover:rotate-0 hover:scale-[1.03] ${
            left ? "-rotate-3" : "rotate-3"
          }`}
        >
          <div className="overflow-hidden rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-paper/10">
            <Image
              src={src}
              alt={alt}
              placeholder="blur"
              sizes="(min-width: 1024px) 22rem, 20rem"
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-4 text-center text-xs uppercase tracking-[0.25em] text-paper/50">
            {label}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
