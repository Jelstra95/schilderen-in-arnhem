"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Adds `.is-revealed` to every `[data-reveal]` element once it scrolls into
 * view, which plays the fly-in transition defined in globals.css. Each element
 * reveals once and then stays put. Re-scans on every route change, because a
 * client-side navigation swaps in new elements without a page load.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Tells the fallback timer in the root layout that reveals are handled.
    document.documentElement.dataset.revealLive = "";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      // Trigger a little before the element is fully in, so it never lags.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    document
      .querySelectorAll("[data-reveal]:not(.is-revealed)")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
