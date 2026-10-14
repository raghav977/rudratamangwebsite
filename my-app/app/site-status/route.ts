/**
 * Diagnostics: can this deployment's server reach the backend API?
 * Open /site-status on the live site; "ok": true means pages can load.
 */
export const dynamic = "force-dynamic";

const API = (process.env.API_URL?.trim() || "http://localhost:4000").replace(/\/+$/, "");

export async function GET() {
  const started = Date.now();
  let result: Record<string, unknown>;
  try {
    const res = await fetch(`${API}/api/public/site`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const type = res.headers.get("content-type") ?? "";
    const body = await res.text();
    result = {
      ok: res.ok && type.includes("application/json"),
      status: res.status,
      type,
      // A firewall/challenge page names itself in its title, e.g. "Bot Verification".
      title: type.includes("html") ? (body.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null) : null,
    };
  } catch (err) {
    const cause = (err as { cause?: { code?: string } }).cause;
    result = { ok: false, error: (err as Error).message, code: cause?.code ?? null };
  }
  return Response.json(
    { api: API, region: process.env.VERCEL_REGION ?? null, ms: Date.now() - started, ...result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
