import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const NEW_OFFICIAL_HOST = "theauramind.dpdns.org";
const OLD_HOST = "auramind-vert.vercel.app";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Redirect from old domain to new official canonical domain
  if (host.includes(OLD_HOST)) {
    const targetUrl = new URL(request.url);
    targetUrl.protocol = "https:";
    targetUrl.host = NEW_OFFICIAL_HOST;

    // For auth callbacks and API routes, use 307 Temporary Redirect to preserve GET query parameters & method
    if (
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/api/auth")
    ) {
      return NextResponse.redirect(targetUrl, 307);
    }

    return NextResponse.redirect(targetUrl, 301);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, robots, sitemap, html, xml (.svg, .png, .jpg, .jpeg, .gif, .webp, .html, .ico, .txt, .xml)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|html|xml)$).*)",
  ],
};
