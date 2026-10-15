import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { site } from "@/lib/site";
import { RevealObserver } from "@/components/RevealObserver";
import "./globals.css";

// Titles — Avenir Light (matches jellevanderidder.com)
const avenir = localFont({
  src: "./fonts/Avenir-Light.ttf",
  variable: "--font-avenir",
  display: "swap",
});

// Body — Fraunces (weight 400, with italic + semibold for emphasis)
const fraunces = localFont({
  src: [
    { path: "./fonts/Fraunces-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Fraunces-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/Fraunces-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Schildercursus in Arnhem · Leer schilderen in olieverf",
    template: "%s · Schilderen in Arnhem",
  },
  description: `Leer schilderen in olieverf in Arnhem. Een doorlopende schildercursus van acht lessen in een kleine groep van maximaal zes cursisten, in het atelier in ${site.district}.`,

  // "./" resolves against the current pathname, so every route gets a
  // self-referencing canonical without any per-page code. A page that needs a
  // different canonical overrides `alternates` itself.
  alternates: { canonical: "./" },

  // No openGraph.title or .description on purpose. `openGraph` is shallow
  // merged across segments, so setting them here would stamp the homepage
  // title onto every child page. Next backfills them from each page's own
  // resolved title and description, and fills the twitter:* tags from these.
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "nl_NL",
    url: "./",
  },
  twitter: { card: "summary_large_image" },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Undefined until GOOGLE_SITE_VERIFICATION is set in Vercel, in which case
  // the tag is simply omitted.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },

  authors: [{ name: site.instructor, url: "https://www.jellevanderidder.com" }],
  creator: site.instructor,
};

/**
 * Runs before first paint. Marks the page as able to animate, so scroll
 * reveals can start hidden without a flash of visible content first. If the
 * app bundle never boots, the timer unhides everything again after a few
 * seconds rather than leaving the page blank.
 */
const revealBootstrap = `(function(){var d=document.documentElement;d.classList.add("reveal-ready");setTimeout(function(){if(!("revealLive" in d.dataset))d.classList.remove("reveal-ready")},4000)})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="nl"
      className={`${avenir.variable} ${fraunces.variable} h-full antialiased`}
      // The bootstrap script adds a class before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <RevealObserver />
        <Analytics />
      </body>
    </html>
  );
}
