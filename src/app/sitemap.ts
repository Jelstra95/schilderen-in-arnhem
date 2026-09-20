import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Sitemap URLs are NOT resolved against `metadataBase`. The serializer writes
 * `<loc>` verbatim, so these have to be absolute or the sitemap is invalid.
 *
 * `lastModified` is a fixed date rather than `new Date()` on purpose: the date
 * should reflect when the page actually changed, and a request-time value
 * would stop this route from being prerendered.
 */
const lastModified = "2026-09-20";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.url}/cursussen`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/inschrijven`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${site.url}/workshops`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // /bedankt and every auth or gated route are noindex and stay out.
  ];
}
