"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Persistent bar shown while an admin previews the participant area as a
 * specific student. "Terug naar beheer" clears the preview and returns to admin.
 */
export function PreviewBanner({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function exit() {
    setBusy(true);
    try {
      await fetch("/api/admin/preview", { method: "DELETE" });
      router.push("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-16 z-30 border-b border-clay/30 bg-clay/15 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-2.5">
        <p className="text-sm text-ink">
          <span className="mr-2 rounded-full bg-clay/25 px-2 py-0.5 text-xs uppercase tracking-wide text-clay">
            Voorbeeld
          </span>
          Je bekijkt de omgeving als <strong className="font-medium">{name}</strong>.
        </p>
        <button
          type="button"
          onClick={exit}
          disabled={busy}
          className="text-sm font-medium text-clay underline-offset-4 hover:underline disabled:opacity-50"
        >
          {busy ? "Bezig…" : "Terug naar beheer"}
        </button>
      </div>
    </div>
  );
}
