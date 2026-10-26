import { site, fullAddress, coursePrice } from "@/lib/site";

/** "dinsdagavond of woensdagavond", following the days in site.ts. */
const dagen = site.course.days
  .map((d) => site.course.dayLabelsNl[d])
  .join(" of ");

const questionHref = `mailto:${site.email}?subject=${encodeURIComponent("Vraag over de schildercursus")}`;

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
  {
    product: "Gamblin Solvent Free Fluid Medium 125ml",
    price: 18,
    category: "Medium",
  },
  { product: "Ami Hout Palet Rechthoek 18x27cm", price: 4, category: "Palet" },
  {
    product: "Van Beek Penselen Set Filament 12x",
    price: 23,
    category: "Penselen zacht",
  },
  {
    product: "Van Beek Penselen Set in Koker Varkenshaar Plat 10 Stuks",
    price: 17,
    category: "Penselen stug",
  },
];

/** Derived, so the total can never drift away from the rows above it. */
const materialsTotal = materials.reduce((sum, m) => sum + m.price, 0);

/** The course page at /cursussen, top to bottom. */
export const cursus = {
  meta: {
    title: "Olieverf schildercursus in Arnhem",
    description: `Leer olieverf schilderen in Arnhem. Acht lessen in een kleine groep van maximaal zes cursisten, in het atelier aan de ${site.street} in ${site.district}. Geschikt voor beginners en gevorderden.`,
  },

  /** A thin notice above the hero. Set to an empty string to hide it. */
  notice:
    "Let op: Door een foutje in de mailserver heb ik helaas geen aanmeldingen doorgekregen van voor 23 oktober. Mocht je je voor die tijd hebben aangemeld, meld je dan voor de zekerheid nog eens aan. Excuses voor het ongemak en hopelijk tot in het atelier!",

  /** The two buttons in the hero and in the closing banner. */
  cta: {
    signup: "Ik meld mij aan!",
    question: "Stel eerst een vraag",
    questionHref,
  },

  hero: {
    eyebrow: "Schildercursus in Arnhem",
    title: "Leer schilderen in olieverf als de oude en nieuwe meesters",
    intro: `Hoe creëert Rembrandt het licht en donker? Waarom zit er zoveel beweging in de schilderijen van Van Gogh? In het atelier van Jelle van de Ridder in ${site.district} ontdek je hoe dat werkt, en schilder je het zelf. Je leert olieverf schilderen in een kleine groep, voor beginners en gevorderden.`,
    facts: `Iedere ${dagen} van ${site.course.startTime} tot ${site.course.endTime} uur · maximaal ${site.course.maxStudents} cursisten · op elk moment instromen`,
  },

  werk: {
    title: "Werk van cursisten van de schildercursus",
    intro:
      "Dit schilderden eerdere cursisten tijdens de cursus. Sommigen waren pas net begonnen, anderen schilderden al langer. Allemaal werkten ze volgens dezelfde opbouw die jij ook leert.",
    imageAlt:
      "Collage van olieverfschilderijen gemaakt door eerdere cursisten van de schildercursus in Arnhem",
  },

  lesinhoud: {
    title: "Lesinhoud: in acht avonden leren schilderen in olieverf",
    intro:
      "Je leert niet alleen hoe je schildert, maar vooral hoe je kijkt. We werken vanuit een heldere en beproefde opbouw, geïnspireerd op de werkwijze van oude én nieuwere meesters. In drie stappen leer je ideeën omzetten in overtuigende schilderijen.",

    /**
     * Each step opens with a question the lessons actually answer: it makes
     * the visitor curious without promising anything the course does not
     * deliver.
     */
    steps: [
      {
        title: "Tekenen",
        question:
          "Waarom tekenen de meeste mensen wat ze denken te zien, in plaats van wat er echt staat?",
        body: "Je leert meten, kijken en tekenen zoals op de academies werd gedaan. Dit is de basis van ieder sterk schilderij.",
      },
      {
        title: "Licht en donker",
        question: "Waarom begonnen de oude meesters eerst in 'zwart-wit'?",
        body: "Je ontdekt hoe je met licht en donker diepte en sfeer creëert.",
      },
      {
        title: "Kleur",
        question: "Waarom is een schaduw in de natuur bijna nooit zwart?",
        body: "Je leert kleuren mengen en stuurt hiermee de harmonie, contrast en expressie.",
      },
    ],

    curriculumTitle: "Wat komt er aan bod",
    curriculumIntro:
      "Tijdens de cursus komen onder andere de volgende onderdelen aan bod:",
    /** Also published to Google as what the course teaches. */
    curriculum: [
      "Kijken als een kunstenaar: het ontleden van schilderijen. Wat maakt ze sterk, en welke technieken horen daar bij?",
      "Kunstgeschiedenis: de verhalen en werkwijzen van de oude én nieuwe meesters.",
      "Materiaalkennis: olieverf, penselen, mediums en dragers en hoe deze samenwerken",
      "Het ‘ontwerpen’ van een schilderij: Hoe je een idee omzet in een schilderij.",
      "Natuurgetrouw schilderen van landschappen, portretten en stillevens",
    ],

    platformTitle: "Alle theorie terugzien op het cursusplatform",
    platformText:
      "Als cursist krijg je toegang tot het online cursusplatform. Daar staan de slides van de lessen en het theoretische materiaal, van aard- en synthetische pigmenten tot kleurenleer en de onderschildering van de oude meesters. Zo kun je thuis alles rustig teruglezen.",
    platformImageAlt:
      "Impressie van lesslides over pigmenten, kleurenleer, mengschema's en de onderschildering bij Rembrandt",

    quote: "Na deze cursus zal een museumbezoek nooit meer hetzelfde zijn.",
    quoteBy: "Jelle van de Ridder, docent",
  },

  impressie: {
    title: "Zo ziet een schilderles in Arnhem eruit",
    paragraphs: [
      `Iedere ${dagen} kom je met een kleine groep samen in het atelier in ${site.district}. Tijdens de koffie of thee behandelen we theorie en gaan we kunst kijken: we bekijken werk uit de kunstgeschiedenis en bestuderen samen wat het sterk maakt.`,
      "Daarna gaan we schilderen en zal ik rondlopen voor vragen en verdere instructies. Je kan op je eigen tempo werken, volgens het lesprogramma of aan een zelfgekozen opdracht.",
      "Heb je eigen ideeën of projecten waar je aan wilt werken, maar weet je niet goed hoe je die moet aanpakken? Ook daarvoor is volop ruimte.",
    ],
  },

  docent: {
    title: "Over je docent Jelle van de Ridder",
    imageAlt:
      "Jelle van de Ridder in zijn atelier met penselen naast twee olieverfschilderijen",
    lead: "Als autodidact heb ik zelf alle denkbare obstakels van het schilderen doorlopen. Juist daardoor weet ik waar je tegenaan loopt.",
    paragraphs: [
      "Lesgeven is voor mij meer dan kennis overdragen; het is samen kijken, onderzoeken en groeien. Mijn eerste ervaring met lesgeven in olieverfschilderen begon in 2019, toen ik tijdens de coronaperiode online les gaf aan vrienden en kennissen. Dit groeide al snel uit tot structurele cursussen.",
      "In 2024 en 2025 werkte ik als kunstdocent bij SKVR, het centrum voor kunsten in Rotterdam. Daar zag ik hoe beginners én gevorderden tegen dezelfde schilderobstakels aanlopen, en hoe je ze gericht verder helpt.",
    ],
    quote:
      "Je leert niet alleen hoe je schildert, maar vooral ook hoe je kijkt en denkt als kunstenaar.",
    closing:
      "Mijn aanpak is technisch serieus, altijd visueel, praktisch en persoonlijk.",
  },

  ervaringen: {
    title: "Ervaringen van cursisten",
    /** Also published to Google as reviews of the course. */
    reviews: [
      {
        name: "Franca",
        level: "cursist op gemiddeld niveau",
        quote:
          "Jelle zijn schildercursus is erg no nonsense. Geen droge theorie, duidelijk referentiemateriaal en hele goede hulp. Met prachtige resultaten!",
      },
      {
        name: "Jacob",
        level: "beginnende cursist",
        quote:
          "Ik heb onlangs een schildercursus gevolgd bij Jelle en het was echt top. Jelle is een docent die op alle niveaus kan lesgeven. Zijn passie voor schilderen en zijn geduldige aanpak hebben me geholpen om wat mooie stappen te zetten.",
      },
      {
        name: "Arnout",
        level: "gevorderde cursist",
        quote:
          "Jelle is een inspirerende leraar! Hij brengt de academische achtergrond en artistieke vrijheid goed in balans.",
      },
    ],
  },

  praktisch: {
    title: "Praktische informatie over de cursus in Arnhem",
    intro:
      "De kleine groep zorgt voor veel persoonlijke aandacht. Je kunt een sterke basis leggen of de diepte ingaan, afhankelijk van je niveau. De lespakketten zijn doorlopend, dus je kunt na een reeks gewoon doorgaan.",
    items: [
      {
        label: "Wanneer",
        value: `Iedere ${dagen} van ${site.course.startTime} tot ${site.course.endTime} uur`,
      },
      { label: "Duur", value: `${site.course.lessons} lessen` },
      {
        label: "Kosten",
        value: `€${site.course.pricePerLesson} per les, €${coursePrice} voor ${site.course.lessons} lessen (exclusief materiaal)`,
      },
      { label: "Locatie", value: `${fullAddress}, in mijn atelier` },
      {
        label: "Groepsgrootte",
        value: `Maximaal ${site.course.maxStudents} personen`,
      },
      {
        label: "Instromen",
        value: "Op elk moment, de lespakketten zijn doorlopend",
      },
    ],
  },

  materiaal: {
    title: "Materiaalkosten voor het schilderen in olieverf",
    paragraphs: [
      "Je schildert met goede materialen die je zelf in huis haalt. Tijdens de cursus word je (vrijblijvend) aangemoedigd om thuis verder te schilderen, en dan heb je alles al! Heb je al wat spullen, neem het dan gewoon mee.",
      `Een complete set om mee te beginnen kost ongeveer **€ ${materialsTotal}**.`,
    ],
    toggle: "Bekijk de volledige materiaallijst",
    columns: { product: "Product", category: "Categorie", price: "Prijs (±)" },
    totalLabel: "Totaal",
    items: materials,
    total: materialsTotal,
  },

  /**
   * Plain HTML, with no FAQPage markup: Google retired FAQ rich results for
   * every site in May 2026, so the schema buys nothing in the SERP.
   *
   * Only questions whose answer is not already somewhere else on the page
   * belong here. Prijs, locatie, duur, groepsgrootte en instromen staan in de
   * lijst met praktische informatie en horen daar thuis, niet ook nog een keer
   * hier.
   */
  vragen: {
    title: "Veelgestelde vragen",
    items: [
      {
        q: "Heb ik ervaring nodig om mee te doen?",
        a: "Nee. In de groep zitten mensen die nog nooit geschilderd hebben naast mensen die al jaren bezig zijn. Je werkt op je eigen tempo aan opdrachten die bij jouw niveau passen.",
      },
      {
        q: "Ik kan helemaal niet tekenen. Kan ik dan toch meedoen?",
        a: "Ja. Tekenen is geen voorwaarde, het is juist een onderdeel van de cursus. Je leert kijken en meten, en dat is beter te leren dan de meeste mensen denken.",
      },
      {
        q: "Wat als ik een les mis?",
        a: "Per reeks mag je één keer afzeggen zonder reden, en die les haal je later in. Laat het me wel uiterlijk de dag vóór de les weten. Zeg je daarna nog een keer af, of pas op de dag zelf, dan gaat de les van je reeks af. Alles staat in de [algemene voorwaarden](/algemene-voorwaarden).",
      },
      {
        q: "Schilder ik in olieverf of in acrylverf?",
        a: "Je schildert in olieverf. De opbouw in lagen die we behandelen komt onder andere voort uit de werkwijze van de oude meesters en dit werkt het beste met olieverf.",
      },
      {
        q: "Welke materialen moet ik zelf aanschaffen?",
        a: "Je zorgt zelf voor verf, penselen en een palet. Bij de materiaalkosten hierboven staat precies wat je nodig hebt. Heb je al materiaal in huis, dan volstaat dat meestal prima.",
      },
    ],
    footer: `Staat je vraag er niet tussen? Mail me op [${site.email}](${questionHref}).`,
  },

  /** The dark closing banner with a painting on either side. */
  aanmelden: {
    eyebrow: "Van Vermeer tot vandaag",
    title: "Klaar om anders te leren kijken?",
    text: "Meld je aan voor de schildercursus in Arnhem. Na je aanmelding neemt Jelle contact met je op.",
    paintingLeft: {
      label: "De oude meesters",
      alt: "Johannes Vermeer, Jonge vrouw met een waterkan: een vrouw bij een open raam in zacht daglicht",
    },
    paintingRight: {
      label: "De nieuwe meesters",
      alt: "Abstract olieverfschilderij met losse, brede vegen in roze, rood, blauw en wit",
    },
  },
};
