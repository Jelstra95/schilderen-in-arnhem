import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { PreviewBanner } from "@/components/PreviewBanner";
import { requireParticipant } from "@/lib/auth";
import { getViewerContext } from "@/lib/preview";

// Everything under this group is behind auth. robots.txt disallows it too;
// this is the belt to that braces.
export const metadata: Metadata = { robots: { index: false, follow: false } };

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
  const { isPreview, viewer } = await getViewerContext();

  return (
    <>
      <AppHeader items={nav} homeHref="/dashboard" />
      {isPreview && viewer && (
        <PreviewBanner name={viewer.full_name ?? viewer.email ?? "deelnemer"} />
      )}
      <main className="flex-1 py-12">{children}</main>
    </>
  );
}
