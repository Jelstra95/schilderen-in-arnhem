"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Mobile-only signup bar. It stays hidden while any of the watched sections
 * (the hero and the closing call to action, which already carry the button)
 * is on screen, so the visitor never sees two signup buttons at once.
 */
export function StickyCta({ hideWhileVisible }: { hideWhileVisible: string[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = hideWhileVisible
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setVisible(onScreen.size === 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [hideWhileVisible]);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-paper/90 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:hidden",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <ButtonLink
        href="/inschrijven"
        className="w-full"
        tabIndex={visible ? undefined : -1}
      >
        Ik meld mij aan
      </ButtonLink>
    </div>
  );
}
