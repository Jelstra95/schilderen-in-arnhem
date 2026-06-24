import { AppHeader } from "@/components/AppHeader";
import { requireParticipant } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Mijn cursus" },
  { href: "/materiaal", label: "Cursusmateriaal" },
];

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proxy already gates these routes; this guarantees a session for the chrome.
  await requireParticipant();

  return (
    <>
      <AppHeader items={nav} homeHref="/dashboard" />
      <main className="flex-1 py-12">{children}</main>
    </>
  );
}
