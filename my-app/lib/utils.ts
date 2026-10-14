/** His portrait, bundled with the site; used wherever no photo has been set in Settings. */
export const DEFAULT_PORTRAIT = "/rudra-tamang.jpg";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function youtubeId(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Display name of the site a video link points to. */
export function videoPlatform(url: unknown): string {
  if (typeof url !== "string") return "";
  if (/youtu\.?be/.test(url)) return "YouTube";
  if (/facebook\.com|fb\.watch/.test(url)) return "Facebook";
  if (/tiktok\.com/.test(url)) return "TikTok";
  if (/instagram\.com/.test(url)) return "Instagram";
  return "";
}

export function fileExt(url: unknown) {
  return typeof url === "string" ? (url.split(".").pop() ?? "").toUpperCase() : "";
}

/** Renders "A municipality that *answers*" with the starred words emphasised. */
export function splitEmphasis(text: string): { text: string; em: boolean }[] {
  return text.split(/(\*[^*]+\*)/g).filter(Boolean).map((part) =>
    part.startsWith("*") && part.endsWith("*") ? { text: part.slice(1, -1), em: true } : { text: part, em: false },
  );
}
