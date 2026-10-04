// Link previews for the trip planner, deployed as a Vercel Function.
//
//   GET /api/preview?url=<link>   -> JSON { url, title, author, image, siteName, place, lat, lng }
//   GET /api/preview?img=<image>  -> the image bytes (so the app can shrink and keep a thumbnail)
//
// Browsers can't read TikTok/YouTube/Maps pages directly (CORS), so this does it server-side.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface Preview {
  url: string;
  title?: string;
  author?: string;
  image?: string;
  siteName?: string;
  description?: string;
  place?: string;
  lat?: number;
  lng?: number;
}

const BROWSER_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
const MAX_HTML = 1_500_000;
const MAX_IMAGE = 6_000_000;

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  try {
    const img = params.get("img");
    if (img) return await proxyImage(img);
    const url = params.get("url");
    if (!url) return json({ error: "Missing ?url=" }, 400);
    const preview = await getPreview(url);
    return json(preview, 200, "public, max-age=3600, s-maxage=86400");
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Preview failed" }, 502);
  }
}

function json(body: unknown, status = 200, cache = "no-store"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}

// ---------------------------------------------------------------------------
// Safe fetching: only public http(s) hosts, redirects checked hop by hop.

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublic(raw: string | URL): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only http(s) links are supported");
  if (url.username || url.password) throw new Error("Unsupported link");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Unsupported link");
    return url;
  }
  if (!host.includes(".") || /\.(localhost|local|internal|lan|home)$/.test(host)) throw new Error("Unsupported link");
  const addresses = await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) throw new Error("Unsupported link");
  return url;
}

async function safeFetch(raw: string, accept: string): Promise<{ res: Response; url: URL }> {
  let url = await assertPublic(raw);
  for (let hop = 0; hop < 8; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": BROWSER_UA, accept, "accept-language": "en-GB,en;q=0.9" },
      signal: AbortSignal.timeout(8000),
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      url = await assertPublic(new URL(location, url));
      continue;
    }
    return { res, url };
  }
  throw new Error("Too many redirects");
}

async function readLimited(res: Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  const out = new Uint8Array(Math.min(size, limit));
  let offset = 0;
  for (const c of chunks) {
    const part = c.subarray(0, out.length - offset);
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const { res } = await safeFetch(url, "application/json");
    if (!res.ok) return null;
    return JSON.parse(new TextDecoder().decode(await readLimited(res, 200_000))) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// HTML meta parsing

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export function parseMeta(html: string): { meta: Record<string, string>; title?: string } {
  const meta: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([a-zA-Z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
    }
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    if (key && attrs.content !== undefined && !(key in meta)) meta[key] = decodeEntities(attrs.content).trim();
  }
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  return { meta, title: title ? decodeEntities(title).trim() : undefined };
}

async function pagePreview(raw: string): Promise<Preview & { finalUrl: string }> {
  const { res, url } = await safeFetch(raw, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8");
  const finalUrl = url.toString();
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("html")) {
    await res.body?.cancel();
    return { url: raw, finalUrl };
  }
  const html = new TextDecoder().decode(await readLimited(res, MAX_HTML));
  const { meta, title } = parseMeta(html);
  const image = meta["og:image"] || meta["og:image:url"] || meta["twitter:image"] || meta["twitter:image:src"];
  return {
    url: raw,
    finalUrl,
    title: meta["og:title"] || meta["twitter:title"] || title,
    description: meta["og:description"] || meta["description"],
    image: image ? new URL(image, finalUrl).toString() : undefined,
    siteName: meta["og:site_name"],
  };
}

// ---------------------------------------------------------------------------
// Providers

function hostOf(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\.|^m\./, "");
}

export function youtubeId(url: string): string | null {
  const u = new URL(url);
  const h = u.hostname.replace(/^www\.|^m\.|^music\./, "");
  if (h === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  if (h !== "youtube.com") return null;
  if (u.searchParams.get("v")) return u.searchParams.get("v");
  return u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/)?.[1] ?? null;
}

interface OEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  provider_name?: string;
}

async function youtubePreview(url: string): Promise<Preview> {
  const id = youtubeId(url);
  const watch = id ? `https://www.youtube.com/watch?v=${id}` : url;
  const o = await getJson<OEmbed>(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`);
  return {
    url,
    title: o?.title,
    author: o?.author_name,
    image: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : o?.thumbnail_url,
    siteName: "YouTube",
  };
}

async function tiktokPreview(url: string): Promise<Preview> {
  let canonical = url;
  const u = new URL(url);
  // Short links from the app (vm./vt.tiktok.com, tiktok.com/t/...) need resolving first.
  if (/^(vm|vt)\./.test(u.hostname) || u.pathname.startsWith("/t/")) {
    try {
      const { res, url: final } = await safeFetch(url, "text/html");
      await res.body?.cancel();
      canonical = final.toString();
    } catch {
      /* fall through with the short link */
    }
  }
  const clean = canonical.split("?")[0];
  const o = await getJson<OEmbed>(`https://www.tiktok.com/oembed?url=${encodeURIComponent(clean)}`);
  if (o?.title || o?.thumbnail_url) {
    return { url, title: o.title, author: o.author_name, image: o.thumbnail_url, siteName: "TikTok" };
  }
  const page = await pagePreview(clean).catch(() => null);
  return { url, title: page?.title, image: page?.image, description: page?.description, siteName: "TikTok" };
}

/** Pulls the place name and coordinates out of a full Google Maps URL. */
export function parseMapsUrl(raw: string): { place?: string; lat?: number; lng?: number } {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return {};
  }
  // EU consent interstitial wraps the real URL.
  const cont = u.searchParams.get("continue");
  if (u.hostname.startsWith("consent.") && cont) return parseMapsUrl(cont);

  const out: { place?: string; lat?: number; lng?: number } = {};
  const decode = (s: string) => decodeURIComponent(s.replace(/\+/g, " ")).trim();
  const place = u.pathname.match(/\/maps\/place\/([^/]+)/)?.[1];
  const search = u.pathname.match(/\/maps\/search\/([^/]+)/)?.[1];
  const q = u.searchParams.get("q") || u.searchParams.get("query");
  const name = place ?? search ?? q ?? undefined;
  if (name) {
    const decoded = decode(name);
    if (!/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(decoded)) out.place = decoded;
  }
  const precise = u.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const at = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const coords = precise ?? at;
  if (coords) {
    out.lat = Number(coords[1]);
    out.lng = Number(coords[2]);
  }
  return out;
}

async function mapsPreview(url: string): Promise<Preview> {
  const page = await pagePreview(url).catch(() => null);
  const parsed = parseMapsUrl(page?.finalUrl ?? url);
  // Maps pages title themselves "Name · Address"; prefer the name from the URL.
  const [ogName, ...rest] = (page?.title ?? "").split(" · ");
  const name = parsed.place?.split(",")[0] || (ogName && ogName !== "Google Maps" ? ogName : undefined);
  return {
    url,
    title: name,
    place: parsed.place || (rest.length ? `${ogName}, ${rest.join(", ")}` : name),
    lat: parsed.lat,
    lng: parsed.lng,
    description: rest.join(" · ") || undefined,
    siteName: "Google Maps",
  };
}

function isMaps(url: string): boolean {
  const u = new URL(url);
  const h = hostOf(url);
  return h === "maps.app.goo.gl" || (h === "goo.gl" && u.pathname.startsWith("/maps")) || /^maps\.google\./.test(h) || (/^google\.[a-z.]+$/.test(h) && u.pathname.startsWith("/maps"));
}

export async function getPreview(raw: string): Promise<Preview> {
  const url = new URL(raw).toString();
  const h = hostOf(url);
  let p: Preview;
  if (h === "youtu.be" || h === "youtube.com" || h.endsWith(".youtube.com")) p = await youtubePreview(url);
  else if (h === "tiktok.com" || h.endsWith(".tiktok.com")) p = await tiktokPreview(url);
  else if (isMaps(url)) p = await mapsPreview(url);
  else {
    const { finalUrl: _, ...page } = await pagePreview(url);
    p = page;
  }
  if (p.title) p.title = p.title.replace(/\s+/g, " ").trim().slice(0, 300);
  return p;
}

async function proxyImage(raw: string): Promise<Response> {
  const { res } = await safeFetch(raw, "image/avif,image/webp,image/*,*/*;q=0.8");
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    await res.body?.cancel();
    return json({ error: "Not an image" }, 502);
  }
  const length = Number(res.headers.get("content-length") ?? 0);
  if (length > MAX_IMAGE) {
    await res.body?.cancel();
    return json({ error: "Image too large" }, 502);
  }
  const bytes = await readLimited(res, MAX_IMAGE);
  return new Response(bytes, {
    headers: { "content-type": type, "cache-control": "public, max-age=86400, s-maxage=604800" },
  });
}
