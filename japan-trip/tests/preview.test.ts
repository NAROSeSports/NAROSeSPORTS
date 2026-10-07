import { describe, expect, it } from "vitest";
import { assertPublic, decodeEntities, parseMapsUrl, parseMeta } from "../worker/preview";

describe("parseMeta", () => {
  it("reads Open Graph tags in any attribute order", () => {
    const html = `<html><head><title>Fallback</title>
      <meta content="Ichiran &amp; Co" property="og:title">
      <meta property='og:image' content='https://img.example/x.jpg'/>
      <meta name="description" content="Tasty">
    </head></html>`;
    const { meta, title } = parseMeta(html);
    expect(meta["og:title"]).toBe("Ichiran & Co");
    expect(meta["og:image"]).toBe("https://img.example/x.jpg");
    expect(meta["description"]).toBe("Tasty");
    expect(title).toBe("Fallback");
  });
  it("decodes numeric entities", () => {
    expect(decodeEntities("Caf&#233; &#x2764; &quot;hi&quot;")).toBe('Café ❤ "hi"');
  });
});

describe("parseMapsUrl", () => {
  it("gets name and precise coordinates from a place URL", () => {
    const url =
      "https://www.google.com/maps/place/Ichiran+Shibuya/@35.6614,139.6983,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d35.6615!4d139.7012";
    expect(parseMapsUrl(url)).toEqual({ place: "Ichiran Shibuya", lat: 35.6615, lng: 139.7012 });
  });
  it("handles ?q= links and the EU consent wrapper", () => {
    expect(parseMapsUrl("https://maps.google.com/?q=Fushimi+Inari+Taisha").place).toBe("Fushimi Inari Taisha");
    const wrapped = `https://consent.google.com/m?continue=${encodeURIComponent("https://www.google.com/maps/place/Kinkaku-ji/@35.03,135.72,15z")}`;
    expect(parseMapsUrl(wrapped)).toMatchObject({ place: "Kinkaku-ji", lat: 35.03, lng: 135.72 });
  });
  it("ignores bare coordinates as a name", () => {
    expect(parseMapsUrl("https://www.google.com/maps/search/35.1,135.2").place).toBeUndefined();
  });
});

describe("assertPublic", () => {
  it("allows normal sites", () => {
    expect(assertPublic("https://vm.tiktok.com/abc").hostname).toBe("vm.tiktok.com");
  });
  it.each(["http://localhost:8080/", "http://127.0.0.1/", "http://192.168.1.1/", "http://[::1]/", "http://10.0.0.5/", "http://printer.local/", "file:///etc/passwd", "http://user:pw@example.com/"])(
    "blocks %s",
    (url) => expect(() => assertPublic(url)).toThrow(),
  );
});
