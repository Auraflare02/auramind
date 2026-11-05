// Google Search Console Site Verification - DO NOT REMOVE
export const dynamic = "force-static";

export function GET() {
  return new Response("google-site-verification: google8a203efe90ab4162.html\n", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
