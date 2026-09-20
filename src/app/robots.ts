import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const disallow = [
  "/admin",
  "/dashboard",
  "/materiaal",
  "/api/",
  "/auth/",
  "/login",
  "/wachtwoord-vergeten",
  "/wachtwoord-herstellen",
  "/bedankt",
];

/**
 * Crawlers behind the AI answer engines. These are listed explicitly so the
 * site's position is unambiguous rather than left to each crawler's default.
 *
 * robots.txt resolution is "most specific User-agent wins": a named agent
 * ignores the `*` group entirely, so this group has to repeat `disallow`.
 */
const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiCrawlers, allow: "/", disallow },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
