import { site } from "@/lib/site";

/** The /workshops page. */
export const workshops = {
  meta: {
    title: "Schilderworkshops in Arnhem",
    description:
      "Losse schilderworkshops in olieverf in en rond Arnhem, op bijzondere locaties. Binnenkort verschijnt hier de agenda met de geplande workshops.",
  },

  eyebrow: "Binnenkort",
  title: "Schilderworkshops in Arnhem",
  paragraphs: [
    "Naast de doorlopende schildercursus komen er losse workshops. Waar de cursus acht lessen beslaat en je stap voor stap een brede basis geeft, duurt een workshop één dagdeel en gaat die juist heel diep op één onderwerp in.",
    "Ook in de workshops werk je in olieverf. Denk aan een middag die volledig over het schilderen van licht gaat, aan een portretstudie naar levend model, of aan een dag buiten schilderen op locatie. Je hoeft er geen cursus voor te volgen en je hoeft geen ervaring te hebben.",
    `De workshops vinden plaats op bijzondere locaties in en rond Arnhem. Een enkele keer werken we in het atelier aan de ${site.street}, maar vaker trekken we eropuit naar een plek die zich leent voor het onderwerp van die dag.`,
    "Binnenkort verschijnt hier de agenda met de geplande workshops, met per workshop de datum, de locatie en de kosten. Heb je alvast interesse, of ken je een locatie die zich hiervoor leent? Neem dan gerust contact op.",
  ],

  primaryCta: { href: "/cursussen", label: "Bekijk de cursus" },
  secondaryCta: { href: `mailto:${site.email}`, label: "Neem contact op" },
};
