/**
 * Single source of truth for the business details.
 *
 * The footer, the page metadata, the sitemap and the JSON-LD all read from
 * here. Google matches a Business Profile to a website partly on the address
 * and phone number being written identically everywhere, so these strings must
 * never drift apart.
 */
export const site = {
  url: "https://schildereninarnhem.nl",
  name: "Schilderen in Arnhem",
  tagline: "Schildercursussen door Jelle van de Ridder",
  instructor: "Jelle van de Ridder",

  street: "Sint Janskerkstraat 86A",
  postalCode: "6822 EN",
  city: "Arnhem",
  /** The Arnhem neighbourhood, used in prose. Not part of the postal address. */
  district: "Klarendal",
  region: "Gelderland",
  country: "NL",

  phone: "+31623837071",
  phoneDisplay: "+31 (0)6 23 83 70 71",
  email: "info@jellevanderidder.com",

  sameAs: [
    "https://www.jellevanderidder.com",
    "https://instagram.com/jellevanderidderart",
  ],

  priceRange: "\u20AC\u20AC",

  course: {
    price: 240,
    currency: "EUR",
    lessons: 8,
    maxStudents: 6,
    startTime: "19:00",
    endTime: "21:30",
    /**
     * Schema.org DayOfWeek names for the evenings that actually run.
     * Only Wednesday is bookable: AanmeldForm marks Tuesday "Binnenkort".
     * Add "Tuesday" here once that group starts, and the course page, the
     * schema and the opening hours all follow from this one edit.
     */
    days: ["Wednesday"],
    dayLabelsNl: { Tuesday: "dinsdagavond", Wednesday: "woensdagavond" },
  },
} as const;

/** "Sint Janskerkstraat 86A, 6822 EN Arnhem" */
export const fullAddress = `${site.street}, ${site.postalCode} ${site.city}`;
