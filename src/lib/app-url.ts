/** Base URL the browser should be sent back to after Stripe checkout/portal.
 *
 * Derived from the incoming request first — the request's Origin (or forwarded
 * host) is always the domain the user is actually on, so redirects work on
 * localhost, vercel.app previews and the production domain without any env
 * configuration. NEXT_PUBLIC_APP_URL is only used as a fallback when the
 * request carries no usable host headers. */
export function requestAppUrl(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
  }

  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
