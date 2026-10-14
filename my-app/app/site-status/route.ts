/**
 * Diagnostics: can this deployment's server reach the backend?
 * Open /site-status on the live site. Shows no private data.
 */
export const dynamic = "force-dynamic";

const API = (process.env.API_URL?.trim() || "http://localhost:4000").replace(/\/+$/, "");

async function probe(path: string) {
  const started = Date.now();
  try {
    const res = await fetch(`${API}${path}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const body = await res.text();
    return { path, ok: res.ok, status: res.status, ms: Date.now() - started, server: res.headers.get("server"), body: body.slice(0, 160) };
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string; errno?: number; syscall?: string; address?: string } };
    return { path, ok: false, ms: Date.now() - started, error: e.message, cause: e.cause ? { code: e.cause.code, message: e.cause.message, syscall: e.cause.syscall, address: e.cause.address } : null };
  }
}

export async function GET() {
  const results = [await probe("/api/health"), await probe("/api/public/site"), await probe("/api/public/home")];
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
