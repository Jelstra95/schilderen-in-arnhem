import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: {
    default: "Schilderen in Arnhem — Schildercursussen door Jelle van de Ridder",
    template: "%s · Schilderen in Arnhem",
  },
  description:
    "Ontdek het plezier van schilderen tijdens een persoonlijke cursus in Arnhem. Kleine groepen, professionele begeleiding en alle materialen aanwezig.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="nl"
      className={`${avenir.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
