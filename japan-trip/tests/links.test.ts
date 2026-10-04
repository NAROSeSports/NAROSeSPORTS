import { describe, expect, it } from "vitest";
import {
  cleanSharedText,
  detectSource,
  extractUrl,
  guessCategory,
  guessCity,
  itemMapsUrl,
  mapsDirectionsUrl,
  normalizeUrl,
  tidyTitle,
  youtubeId,
} from "../src/lib/links";
import { DEFAULT_CITIES } from "../src/data/model";

describe("extractUrl", () => {
  it("finds the link in TikTok share text", () => {
    expect(extractUrl("Check out Sam's video! #TikTok https://vm.tiktok.com/ZMabc123/")).toBe("https://vm.tiktok.com/ZMabc123/");
  });
  it("strips trailing punctuation", () => {
    expect(extractUrl("look (https://example.com/page).")).toBe("https://example.com/page");
  });
  it("returns null for plain text", () => {
    expect(extractUrl("try a konbini egg sandwich")).toBeNull();
  });
});

describe("detectSource", () => {
  it.each([
    ["https://vm.tiktok.com/ZMabc/", "tiktok"],
    ["https://www.tiktok.com/@user/video/123", "tiktok"],
    ["https://youtu.be/dQw4w9WgXcQ?si=x", "youtube"],
    ["https://m.youtube.com/shorts/abcdefghijk", "youtube"],
    ["https://www.instagram.com/reel/Cxyz/", "instagram"],
    ["https://maps.app.goo.gl/AbC123", "maps"],
    ["https://www.google.com/maps/place/Ichiran", "maps"],
    ["https://goo.gl/maps/xyz", "maps"],
    ["https://www.google.com/search?q=ramen", "web"],
    ["https://www.japan-guide.com/e/e3003.html", "web"],
    [null, "note"],
  ] as const)("%s -> %s", (url, source) => {
    expect(detectSource(url)).toBe(source);
  });
});

describe("youtubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ?feature=share", "dQw4w9WgXcQ"],
    ["https://www.example.com/watch?v=x", null],
  ])("%s", (url, id) => expect(youtubeId(url)).toBe(id));
});

describe("normalizeUrl", () => {
  it("treats the same YouTube video shared differently as one", () => {
    expect(normalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe(normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
  });
  it("drops tracking params", () => {
    expect(normalizeUrl("https://www.instagram.com/reel/Cxyz/?igsh=abc&utm_source=ig")).toBe("instagram.com/reel/cxyz");
  });
});

describe("cleanSharedText", () => {
  it("removes TikTok boilerplate and the link", () => {
    const url = "https://vm.tiktok.com/ZMabc/";
    expect(cleanSharedText(`Check out Sam's video! #TikTok ${url}`, url)).toBe("");
  });
  it("keeps Google Maps place name and address lines", () => {
    const url = "https://maps.app.goo.gl/AbC123";
    expect(cleanSharedText(`Ichiran Shibuya\n1-22-7 Jinnan, Shibuya City, Tokyo\n${url}`, url)).toBe(
      "Ichiran Shibuya\n1-22-7 Jinnan, Shibuya City, Tokyo",
    );
  });
});

describe("guessing", () => {
  it("guesses the city from neighbourhood names", () => {
    expect(guessCity("Best hidden bars in Golden Gai, Shinjuku", DEFAULT_CITIES)).toBe("Tokyo");
    expect(guessCity("Arashiyama bamboo forest at sunrise", DEFAULT_CITIES)).toBe("Kyoto");
    expect(guessCity("Dotonbori street food tour", DEFAULT_CITIES)).toBe("Osaka");
    expect(guessCity("my favourite cafe", DEFAULT_CITIES)).toBeNull();
  });
  it("only suggests cities on the trip list", () => {
    expect(guessCity("Day trip to Kamakura", DEFAULT_CITIES)).toBeNull();
    expect(guessCity("Day trip to Kamakura", [...DEFAULT_CITIES, "Kamakura"])).toBe("Kamakura");
  });
  it("guesses the category from keywords", () => {
    expect(guessCategory("BEST ramen in Tokyo 🍜 #japan #foodie")).toBe("food");
    expect(guessCategory("Fushimi Inari shrine before the crowds")).toBe("sight");
    expect(guessCategory("teamLab Planets is unreal")).toBe("activity");
    expect(guessCategory("Vintage shopping in Shimokitazawa")).toBe("shopping");
    expect(guessCategory("A great day")).toBe("other");
  });
});

describe("maps links", () => {
  it("prefers an item's own maps link", () => {
    expect(itemMapsUrl({ title: "X", mapsUrl: "https://maps.app.goo.gl/a" })).toBe("https://maps.app.goo.gl/a");
  });
  it("searches place + city otherwise", () => {
    expect(itemMapsUrl({ title: "Ichiran", city: "Tokyo" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Ichiran%2C%20Tokyo%2C%20Japan",
    );
  });
  it("builds directions with waypoints", () => {
    const url = new URL(mapsDirectionsUrl(["A", "B", "C"])!);
    expect(url.searchParams.get("origin")).toBe("A");
    expect(url.searchParams.get("destination")).toBe("C");
    expect(url.searchParams.get("waypoints")).toBe("B");
  });
});

describe("tidyTitle", () => {
  it("drops trailing hashtags", () => {
    expect(tidyTitle("The BEST ramen in Shibuya 🍜 #tokyo #ramen #japantravel")).toBe("The BEST ramen in Shibuya 🍜");
    expect(tidyTitle("#tokyo #food")).toBe("#tokyo #food");
    expect(tidyTitle("Kyoto's #1 matcha spot")).toBe("Kyoto's #1 matcha spot");
  });
});
