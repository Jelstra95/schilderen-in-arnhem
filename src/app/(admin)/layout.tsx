import { AppHeader } from "@/components/AppHeader";
import { requireAdmin } from "@/lib/auth";

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
