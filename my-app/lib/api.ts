import "server-only";
import type { Item, List } from "./types";

const API = (process.env.API_URL?.trim() || "http://localhost:4000").replace(/\/+$/, "");

export class ApiUnavailable extends Error {}

/** Server-side fetch from the public API. Content edits show up immediately. */
export async function api<T>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API}/api/public${path}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    // The cause (ECONNREFUSED, ENOTFOUND, a timeout, a certificate error…) is
    // what shows up in the hosting logs, so keep it in the message.
    const cause = (err as { cause?: { code?: string; message?: string } }).cause;
    throw new ApiUnavailable(`The content server at ${API} is not reachable (${cause?.code ?? cause?.message ?? (err as Error).message}).`);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${API}/api/public${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function list(collection: string, params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const data = await api<List>(`/c/${collection}${qs.size ? `?${qs}` : ""}`);
  return data ?? { items: [], total: 0, limit: 0, offset: 0 };
}

export const one = (collection: string, slug: string) => api<Item>(`/c/${collection}/${encodeURIComponent(slug)}`);

export const getSite = async () => (await api<Item>("/site")) ?? ({ id: 0 } as Item);
