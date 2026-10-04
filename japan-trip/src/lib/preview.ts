import { youtubeId } from "./links";

export interface LinkPreview {
  title?: string;
  author?: string;
  image?: string;
  siteName?: string;
  description?: string;
  place?: string;
  lat?: number;
  lng?: number;
}

const cache = new Map<string, Promise<LinkPreview | null>>();

/** Title/thumbnail for a link via /api/preview. Never throws; null if nothing could be found. */
export function fetchPreview(url: string): Promise<LinkPreview | null> {
  let p = cache.get(url);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000) });
        if (!res.ok || !res.headers.get("content-type")?.includes("json")) throw new Error(String(res.status));
        return (await res.json()) as LinkPreview;
      } catch {
        cache.delete(url);
        const id = youtubeId(url);
        return id ? { image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, siteName: "YouTube" } : null;
      }
    })();
    cache.set(url, p);
  }
  return p;
}

/**
 * Downloads a thumbnail and shrinks it to a small JPEG data URL, so it's stored with the item,
 * works offline and doesn't break when TikTok's image links expire.
 */
export async function captureThumb(remote: string, maxSize = 320): Promise<string | null> {
  try {
    const res = await fetch(`/api/preview?img=${encodeURIComponent(remote)}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  }
}
