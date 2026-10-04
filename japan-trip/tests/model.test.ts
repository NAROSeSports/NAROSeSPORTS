import { describe, expect, it } from "vitest";
import type { Item } from "../src/types";
import { dayItems, endOrder, normalizeData, orderForMove, orderForTime, remapMember } from "../src/data/model";
import { tripDays, tripPhase } from "../src/lib/dates";

const D = "2027-04-05";
const mk = (id: string, order: number, time?: string): Item => ({
  id,
  title: id,
  source: "note",
  category: "other",
  day: D,
  order,
  time: time ?? null,
  createdAt: 0,
});

describe("ordering within a day", () => {
  const items = [mk("a", 1, "09:00"), mk("b", 2), mk("c", 3, "15:00")];

  it("appends to the end", () => {
    expect(endOrder(items, D)).toBe(4);
    expect(endOrder(items, "2027-04-06")).toBe(1);
  });

  it("slots a timed item chronologically", () => {
    const o = orderForTime(items, D, "12:00", "new");
    const sorted = dayItems([...items, { ...mk("new", o, "12:00") }], D).map((i) => i.id);
    expect(sorted).toEqual(["a", "b", "new", "c"]);
    expect(dayItems([...items, mk("early", orderForTime(items, D, "07:00", "early"), "07:00")], D)[0].id).toBe("early");
    expect(dayItems([...items, mk("late", orderForTime(items, D, "20:00", "late"), "20:00")], D).at(-1)!.id).toBe("late");
  });

  it("moves up and down", () => {
    const up = orderForMove(items, items[2], -1)!;
    expect(dayItems([items[0], items[1], { ...items[2], order: up }], D).map((i) => i.id)).toEqual(["a", "c", "b"]);
    const down = orderForMove(items, items[0], 1)!;
    expect(dayItems([{ ...items[0], order: down }, items[1], items[2]], D).map((i) => i.id)).toEqual(["b", "a", "c"]);
    expect(orderForMove(items, items[0], -1)).toBeNull();
  });
});

describe("data helpers", () => {
  it("fills in missing fields", () => {
    const d = normalizeData({ items: [{ id: "x" } as Item] });
    expect(d.items[0]).toMatchObject({ title: "Untitled", source: "note", category: "other", likes: [] });
    expect(d.trip.cities.length).toBeGreaterThan(0);
  });
  it("remaps the local user to an email", () => {
    const d = remapMember(
      { trip: normalizeData(null).trip, items: [{ ...mk("a", 1), addedBy: "me", likes: ["me"] }], todos: [] },
      "me",
      "w@x.com",
    );
    expect(d.items[0].addedBy).toBe("w@x.com");
    expect(d.items[0].likes).toEqual(["w@x.com"]);
  });
});

describe("dates", () => {
  it("lists trip days inclusively", () => {
    expect(tripDays("2027-03-30", "2027-04-02")).toEqual(["2027-03-30", "2027-03-31", "2027-04-01", "2027-04-02"]);
    expect(tripDays("2027-04-02", "2027-03-30")).toEqual([]);
  });
  it("knows where we are in the trip", () => {
    expect(tripPhase("2027-04-05", "2027-04-18", "2027-04-01")).toEqual({ phase: "before", daysToGo: 4 });
    expect(tripPhase("2027-04-05", "2027-04-18", "2027-04-07")).toEqual({ phase: "during", dayNumber: 3, totalDays: 14 });
    expect(tripPhase("2027-04-05", "2027-04-18", "2027-05-01")).toEqual({ phase: "after" });
  });
});
