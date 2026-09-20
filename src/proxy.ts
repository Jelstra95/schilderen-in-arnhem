import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

// Next.js 16 renamed `middleware` to `proxy` (Node.js runtime).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets, image files, Vercel platform
     * endpoints and the metadata routes, so the auth session stays fresh and
     * protected route groups are gated.
     *
     * The metadata routes must be excluded: without it, every crawler hit on
     * /robots.txt or /sitemap.xml would run updateSession() and therefore a
     * Supabase auth.getUser() network round-trip. Next's own metadata docs
     * instruct excluding them from the proxy matcher. opengraph-image is
     * listed by name because it is served without a file extension.
     */
    "/((?!_next/static|_next/image|_vercel|favicon\\.ico|robots\\.txt|sitemap\\.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|ttf|woff2?)$).*)",
  ],
};
