import type { Category, Source } from "../types";

const URL_RE = /https?:\/\/[^\s<>"'`]+/i;

/** Finds the first link in shared text, e.g. "Check out this video! https://vm.tiktok.com/abc/". */
export function extractUrl(text: string | null | undefined): string | null {
  const match = text?.match(URL_RE);
  if (!match) return null;
  return match[0].replace(/[).,!?;:'"\]]+$/, "");
}

function host(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\.|^m\./, "");
  } catch {
    return "";
  }
}

export function detectSource(url: string | null | undefined): Source {
  if (!url) return "note";
  const h = host(url);
  if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return "tiktok";
  if (h === "youtu.be" || h === "youtube.com" || h.endsWith(".youtube.com")) return "youtube";
  if (h === "instagram.com" || h === "instagr.am") return "instagram";
  if (isMapsUrl(url)) return "maps";
  return "web";
}

export function isMapsUrl(url: string): boolean {
  const h = host(url);
  let path = "";
  try {
    path = new URL(url).pathname;
  } catch {
    return false;
  }
  return (
    h === "maps.app.goo.gl" ||
    (h === "goo.gl" && path.startsWith("/maps")) ||
    /^maps\.google\./.test(h) ||
    (/^google\.[a-z.]+$/.test(h) && path.startsWith("/maps"))
  );
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\.|^m\.|^music\./, "");
    if (h === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (h !== "youtube.com") return null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Removes tracking junk so the same video shared twice is recognised as a duplicate. */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const yt = youtubeId(url);
    if (yt) return `youtube:${yt}`;
    const keep = new URLSearchParams();
    for (const [k, v] of u.searchParams) {
      if (!/^(utm_|si$|igsh|igshid|_r$|_t$|is_from_webapp|sender_device|share_|fbclid|gclid|ref$|feature$)/i.test(k)) keep.set(k, v);
    }
    const q = keep.toString();
    return `${u.hostname.replace(/^www\.|^m\./, "")}${u.pathname.replace(/\/$/, "")}${q ? `?${q}` : ""}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

const SHARE_BOILERPLATE = [
  /check out .{0,60}? (video|post|reel)s?( on (tiktok|instagram))?!?/gi,
  /#?tiktok\b/gi,
  /watch .{0,10}on youtube/gi,
  /shared via .*$/gim,
];

/** The human part of shared text, minus the link and app boilerplate. */
export function cleanSharedText(text: string | null | undefined, url?: string | null): string {
  let t = text ?? "";
  if (url) t = t.split(url).join(" ");
  t = t.replace(new RegExp(URL_RE, "gi"), " ");
  for (const re of SHARE_BOILERPLATE) t = t.replace(re, " ");
  return t
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

/** Drops the wall of hashtags TikTok/Instagram captions end with. */
export function tidyTitle(title: string): string {
  const trimmed = title.replace(/(\s*#[\p{L}\p{N}_]+)+\s*$/u, "").replace(/\s+/g, " ").trim();
  return trimmed || title.trim();
}

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Google Maps directions through the given stops (max ~10 on mobile). */
export function mapsDirectionsUrl(stops: string[], mode: "transit" | "walking" = "walking"): string | null {
  const s = stops.filter(Boolean).slice(0, 10);
  if (s.length === 0) return null;
  if (s.length === 1) return mapsSearchUrl(s[0]);
  const params = new URLSearchParams({ api: "1", origin: s[0], destination: s[s.length - 1] });
  // Transit directions don't support waypoints, so only use it for simple A→B.
  if (s.length > 2) params.set("waypoints", s.slice(1, -1).join("|"));
  params.set("travelmode", s.length > 2 ? "walking" : mode);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Best Google Maps link for an item: its own maps link, else a search for place/title + city. */
export function itemMapsUrl(item: { mapsUrl?: string | null; place?: string | null; title: string; city?: string | null }): string {
  if (item.mapsUrl) return item.mapsUrl;
  const base = item.place || item.title;
  const city = item.city && !base.toLowerCase().includes(item.city.toLowerCase()) ? `, ${item.city}` : "";
  return mapsSearchUrl(`${base}${city}, Japan`);
}

export const CITY_KEYWORDS: Record<string, string[]> = {
  Tokyo: [
    "tokyo", "shibuya", "shinjuku", "harajuku", "ginza", "akihabara", "akiba", "asakusa", "ueno", "roppongi",
    "ikebukuro", "odaiba", "nakameguro", "naka-meguro", "shimokitazawa", "shimokita", "ebisu", "tsukiji", "toyosu",
    "koenji", "kichijoji", "daikanyama", "omotesando", "yanaka", "sumida", "skytree", "golden gai", "kabukicho",
    "nakano", "azabu", "teamlab planets", "tokyo tower", "meiji",
  ],
  Kyoto: [
    "kyoto", "gion", "arashiyama", "fushimi", "inari", "kiyomizu", "pontocho", "kinkaku", "ginkaku", "nishiki",
    "higashiyama", "philosopher", "sagano", "kurama", "uji",
  ],
  Osaka: [
    "osaka", "dotonbori", "dotombori", "namba", "umeda", "shinsekai", "universal studios", "usj", "super nintendo",
    "kuromon", "shinsaibashi", "tsutenkaku", "amerikamura",
  ],
  Nara: ["nara", "todai-ji", "todaiji", "deer park", "kasuga"],
  Hakone: ["hakone", "owakudani", "lake ashi", "gora"],
  Hiroshima: ["hiroshima", "miyajima", "itsukushima", "peace memorial"],
  "Mt Fuji": ["mt fuji", "mount fuji", "fujisan", "kawaguchiko", "kawaguchi", "chureito", "fujiyoshida", "lake fuji"],
  Yokohama: ["yokohama", "minato mirai"],
  Kamakura: ["kamakura", "enoshima"],
  Nikko: ["nikko", "nikkō"],
  Kanazawa: ["kanazawa", "kenroku"],
  Sapporo: ["sapporo", "hokkaido", "otaru", "niseko"],
  Fukuoka: ["fukuoka", "hakata"],
  Okinawa: ["okinawa", "naha"],
};

export function guessCity(text: string, cities: string[]): string | null {
  const t = ` ${text.toLowerCase()} `;
  let best: { city: string; score: number } | null = null;
  for (const city of cities) {
    const words = new Set([city.toLowerCase(), ...(CITY_KEYWORDS[city] ?? [])]);
    let score = 0;
    for (const w of words) if (t.includes(w)) score += w === city.toLowerCase() ? 2 : 1;
    if (score > 0 && (!best || score > best.score)) best = { city, score };
  }
  return best?.city ?? null;
}

const CATEGORY_KEYWORDS: Record<Exclude<Category, "other">, string[]> = {
  food: [
    "ramen", "sushi", "food", "eat", "eats", "restaurant", "cafe", "café", "coffee", "izakaya", "yakitori", "wagyu",
    "matcha", "dessert", "bakery", "street food", "tempura", "udon", "soba", "okonomiyaki", "takoyaki", "gyoza",
    "katsu", "tonkatsu", "omakase", "breakfast", "lunch", "dinner", "kissaten", "yakiniku", "sukiyaki", "onigiri",
    "konbini", "7-eleven", "lawson", "mochi", "taiyaki", "crepe", "pancake", "kaiseki", "unagi", "curry", "foodie",
    "michelin", "tsukemen", "donburi", "market", "snack", "ichiran",
  ],
  sight: [
    "temple", "shrine", "castle", "garden", "park", "view", "museum", "tower", "torii", "bamboo", "pagoda",
    "viewpoint", "observation", "sakura", "cherry blossom", "scenic", "sunset", "landmark", "crossing", "skytree",
    "gallery", "autumn leaves", "momiji", "lake", "photo spot",
  ],
  activity: [
    "teamlab", "onsen", "tour", "class", "experience", "karaoke", "arcade", "disney", "universal studios", "hike",
    "hiking", "kimono", "sumo", "go-kart", "gokart", "mario kart", "workshop", "festival", "matsuri", "tea ceremony",
    "cooking class", "theme park", "aquarium", "zoo", "baseball", "show", "sento", "spa", "game center",
  ],
  shopping: [
    "shop", "shopping", "store", "vintage", "thrift", "don quijote", "donki", "mall", "souvenir", "uniqlo",
    "pokemon center", "daiso", "100 yen", "depachika", "loft", "tokyu hands", "book off", "outlet", "haul",
    "gachapon", "gacha", "anime", "manga",
  ],
  nightlife: ["bar", "bars", "nightlife", "club", "golden gai", "cocktail", "sake bar", "night out", "speakeasy", "highball", "pub"],
  stay: ["hotel", "ryokan", "hostel", "airbnb", "capsule", "where to stay", "accommodation", "check-in", "check in"],
  transport: ["flight", "shinkansen", "jr pass", "train", "airport", "narita", "haneda", "kansai airport", "bullet train", "bus", "ferry"],
};

export function guessCategory(text: string): Category {
  const t = ` ${text.toLowerCase().replace(/[#_]/g, " ")} `;
  let best: { cat: Category; score: number } = { cat: "other", score: 0 };
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    let score = 0;
    for (const w of words) {
      const re = new RegExp(`[^a-z]${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z]`);
      if (re.test(t)) score++;
    }
    if (score > best.score) best = { cat, score };
  }
  return best.cat;
}
