/**
 * Diagnostics: can this deployment's server reach the backend?
 * Open /site-status on the live site. Shows no private data.
 */
export const dynamic = "force-dynamic";

const API = (process.env.API_URL?.trim() || "http://localhost:4000").replace(/\/+$/, "");

async function probe(path: string, base = API) {
  const started = Date.now();
  try {
    const res = await fetch(`${base}${path}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const body = await res.text();
    const title = body.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null;
    return {
      via: base,
      path,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      type: res.headers.get("content-type"),
      title,
      // Visible text of an HTML page (a firewall/challenge page names itself here).
      text: body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
    };
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string; errno?: number; syscall?: string; address?: string } };
    return { path, ok: false, ms: Date.now() - started, error: e.message, cause: e.cause ? { code: e.cause.code, message: e.cause.message, syscall: e.cause.syscall, address: e.cause.address } : null };
  }
}

export async function GET(request: Request) {
  const self = new URL(request.url).origin;
  const results = [
    await probe("/api/public/site"),
    // Same request through this site's own /api rewrite (Vercel's edge proxy).
    await probe("/api/public/site", self),
  ];
  return Response.json(
    {
      api: API,
      region: process.env.VERCEL_REGION ?? null,
      node: process.version,
      results,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
