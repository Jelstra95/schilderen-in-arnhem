import { AppHeader } from "@/components/AppHeader";
import { PreviewBanner } from "@/components/PreviewBanner";
import { requireParticipant } from "@/lib/auth";
import { getViewerContext } from "@/lib/preview";

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
