import { site, fullAddress } from "@/lib/site";

/**
 * JSON-LD graphs. Every node carries a stable `@id` so that nodes can
 * reference each other, and so that search and answer engines resolve the
 * business, the person and the course to one entity each across pages.
 *
 * The organisation and person nodes are repeated on every page that needs
 * them: `@id` references do not resolve across documents.
 */

const ORGANIZATION_ID = `${site.url}/#organization`;
const PERSON_ID = `${site.url}/#jelle-van-de-ridder`;
const WEBSITE_ID = `${site.url}/#website`;
const COURSE_ID = `${site.url}/cursussen#olieverfcursus`;

const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: site.street,
  postalCode: site.postalCode,
  addressLocality: site.city,
  addressRegion: site.region,
  addressCountry: site.country,
} as const;

function organizationNode() {
  return {
    "@type": ["LocalBusiness", "EducationalOrganization"],
    "@id": ORGANIZATION_ID,
    name: site.name,
    description:
      "Schildercursussen in olieverf in Arnhem, in kleine groepen onder persoonlijke begeleiding van kunstenaar Jelle van de Ridder.",
    url: site.url,
    image: `${site.url}/opengraph-image.jpg`,
    telephone: site.phone,
    email: site.email,
    address: postalAddress,
    areaServed: { "@type": "City", name: site.city },
    priceRange: site.priceRange,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: site.course.days.map((d) => `https://schema.org/${d}`),
      opens: site.course.startTime,
      closes: site.course.endTime,
    },
    founder: { "@id": PERSON_ID },
    knowsLanguage: "nl-NL",
    sameAs: [...site.sameAs],
  };
}

function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.instructor,
    jobTitle: "Kunstenaar en schilderdocent",
    description:
      "Klassiek werkend olieverfschilder uit Arnhem. Geeft sinds 2019 schilderles en werkte in 2024 en 2025 als kunstdocent bij SKVR, het centrum voor kunsten in Rotterdam.",
    worksFor: { "@id": ORGANIZATION_ID },
    url: "https://www.jellevanderidder.com",
    sameAs: [...site.sameAs],
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: site.url,
    name: site.name,
    inLanguage: "nl-NL",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Graph for the splash page at `/`. */
export function homeGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), personNode(), websiteNode()],
  };
}

/**
 * Graph for `/cursussen`.
 *
 * Note: no `aggregateRating`. The testimonials on the page are written
 * quotes without star ratings attached, and inventing a numeric rating
 * would be fabricated structured data.
 */
export function courseGraph({
  reviews,
  teaches,
}: {
  reviews: ReadonlyArray<{ name: string; quote: string }>;
  /** The visible curriculum list, so markup and page can never diverge. */
  teaches: ReadonlyArray<string>;
}) {
  const course = {
    "@type": "Course",
    "@id": COURSE_ID,
    name: "Olieverf schildercursus in Arnhem",
    description: `Doorlopende schildercursus in olieverf in Arnhem. ${site.course.lessons} lessen in een groep van maximaal ${site.course.maxStudents} cursisten, voor beginners en gevorderden.`,
    url: `${site.url}/cursussen`,
    inLanguage: "nl-NL",
    educationalLevel: "Beginners en gevorderden",
    teaches: [...teaches],
    provider: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "Offer",
      price: site.course.price,
      priceCurrency: site.course.currency,
      category: "Paid",
      availability: "https://schema.org/InStock",
      url: `${site.url}/inschrijven`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      name: `Olieverfcursus van ${site.course.lessons} lessen`,
      courseMode: "Onsite",
      courseWorkload: "PT2H30M",
      inLanguage: "nl-NL",
      maximumAttendeeCapacity: site.course.maxStudents,
      instructor: { "@id": PERSON_ID },
      location: {
        "@type": "Place",
        name: `Atelier ${site.instructor}`,
        address: postalAddress,
      },
      courseSchedule: {
        "@type": "Schedule",
        repeatFrequency: "weekly",
        repeatCount: site.course.lessons,
        byDay: site.course.days.map((d) => `https://schema.org/${d}`),
        startTime: site.course.startTime,
        endTime: site.course.endTime,
        scheduleTimezone: "Europe/Amsterdam",
      },
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewBody: r.quote,
      itemReviewed: { "@id": COURSE_ID },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), personNode(), course],
  };
}

/** Breadcrumbs for the pages below the root. */
export function breadcrumbGraph(items: ReadonlyArray<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${site.url}${item.path}`,
      })),
    ],
  };
}

export { fullAddress };
