import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { requireAdmin } from "@/lib/auth";

// Everything under this group is behind auth. robots.txt disallows it too;
// this is the belt to that braces.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const nav = [
  { href: "/admin", label: "Overzicht" },
  { href: "/admin/data", label: "Cursusdata" },
  { href: "/admin/deelnemers", label: "Deelnemers" },
  { href: "/admin/materiaal", label: "Materiaal" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      <AppHeader items={nav} homeHref="/admin" badge="Beheer" />
      <main className="flex-1 py-12">{children}</main>
    </>
  );
}
