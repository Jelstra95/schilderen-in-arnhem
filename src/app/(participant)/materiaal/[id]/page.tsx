import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PdfViewer } from "@/components/PdfViewer";
import { getAuthContext } from "@/lib/auth";
import type { Material } from "@/lib/types";

export const metadata: Metadata = { title: "Materiaal bekijken" };

export default async function MaterialViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAuthContext();

  // RLS returns the row only if the participant may view it.
  const { data } = await supabase
    .from("materials")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const material = data as Material | null;
  if (!material) notFound();

  const streamSrc = `/api/materials/${material.id}/stream`;
  const isPdf = material.mime_type === "application/pdf";

  return (
    <Container className="max-w-4xl">
      <Link
        href="/materiaal"
        className="text-sm text-muted hover:text-ink"
      >
        ← Terug naar materiaal
      </Link>
      <h1 className="mt-4 font-title text-3xl text-ink">{material.title}</h1>

      <div className="mt-8 rounded-2xl border border-line bg-mist/30 p-4 sm:p-8">
        {isPdf ? (
          <PdfViewer src={streamSrc} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streamSrc}
            alt={material.title}
            draggable={false}
            className="mx-auto max-w-full select-none rounded-lg border border-line"
          />
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Dit materiaal is auteursrechtelijk beschermd en uitsluitend bedoeld voor
        cursisten.
      </p>
    </Container>
  );
}
