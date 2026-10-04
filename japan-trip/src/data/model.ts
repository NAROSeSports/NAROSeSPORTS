import type { Category, Item, Todo, TodoList, Trip, TripData } from "../types";
import { newId } from "../lib/id";

export const LOCAL_ME = "me";

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "food", label: "Food & drink", emoji: "🍜" },
  { id: "sight", label: "Sights", emoji: "⛩️" },
  { id: "activity", label: "Activities", emoji: "🎎" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "nightlife", label: "Nightlife", emoji: "🍶" },
  { id: "stay", label: "Stay", emoji: "🏨" },
  { id: "transport", label: "Travel", emoji: "🚄" },
  { id: "other", label: "Other", emoji: "📌" },
];

export const categoryInfo = (id: Category | undefined) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export const DEFAULT_CITIES = ["Tokyo", "Kyoto", "Osaka", "Nara", "Hakone", "Hiroshima"];

export function defaultTrip(): Trip {
  return { name: `Japan ${new Date().getFullYear() + 1}`, start: null, end: null, cities: [...DEFAULT_CITIES], days: {}, names: {} };
}

export function emptyData(): TripData {
  return { trip: defaultTrip(), items: [], todos: [] };
}

export const SUGGESTED_TODOS: { text: string; list: TodoList }[] = [
  { text: "Check passports are valid for the whole trip", list: "todo" },
  { text: "Book flights", list: "todo" },
  { text: "Book hotels / ryokan", list: "todo" },
  { text: "Travel insurance", list: "todo" },
  { text: "Decide on JR Pass vs individual tickets", list: "todo" },
  { text: "Sort out eSIM or pocket Wi-Fi", list: "todo" },
  { text: "Get an IC card for trains (Suica / PASMO / ICOCA)", list: "todo" },
  { text: "Book timed tickets (teamLab, Ghibli Museum, Shibuya Sky…)", list: "todo" },
  { text: "Restaurant reservations for special dinners", list: "todo" },
  { text: "Get some yen cash (many small places are cash only)", list: "todo" },
  { text: "Complete Visit Japan Web before flying", list: "todo" },
  { text: "Passports", list: "packing" },
  { text: "Phone chargers + power bank", list: "packing" },
  { text: "Plug adapters (Type A)", list: "packing" },
  { text: "Comfy walking shoes", list: "packing" },
  { text: "Coin purse", list: "packing" },
  { text: "Small towel / handkerchief", list: "packing" },
  { text: "Rubbish bag (few public bins!)", list: "packing" },
  { text: "Spare bag for shopping haul", list: "packing" },
];

export function suggestedTodos(by: string): Todo[] {
  const now = Date.now();
  return SUGGESTED_TODOS.map((t, i) => ({ id: newId(), text: t.text, list: t.list, done: false, addedBy: by, createdAt: now + i }));
}

/** Fills in missing fields on data that came from storage, a backup file or Firestore. */
export function normalizeItem(raw: Partial<Item> & { id: string }): Item {
  return {
    ...raw,
    id: raw.id,
    title: raw.title ?? "Untitled",
    source: raw.source ?? "note",
    category: raw.category ?? "other",
    likes: Array.isArray(raw.likes) ? raw.likes : [],
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
  };
}

export function normalizeTodo(raw: Partial<Todo> & { id: string }): Todo {
  return {
    ...raw,
    id: raw.id,
    text: raw.text ?? "",
    done: !!raw.done,
    list: raw.list === "packing" ? "packing" : "todo",
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
  };
}

export function normalizeTrip(raw: Partial<Trip> | undefined): Trip {
  const base = defaultTrip();
  return {
    ...base,
    ...raw,
    name: raw?.name || base.name,
    cities: Array.isArray(raw?.cities) ? raw.cities : base.cities,
    days: raw?.days ?? {},
    names: raw?.names ?? {},
  };
}

export function normalizeData(raw: Partial<TripData> | undefined | null): TripData {
  return {
    trip: normalizeTrip(raw?.trip),
    items: (raw?.items ?? []).filter((i) => i && i.id).map(normalizeItem),
    todos: (raw?.todos ?? []).filter((t) => t && t.id).map(normalizeTodo),
  };
}

/** Rewrites who-did-what keys, e.g. local "me" -> your email when moving data into a shared trip. */
export function remapMember(data: TripData, from: string, to: string): TripData {
  const swap = (k?: string | null) => (k === from ? to : k);
  return {
    trip: data.trip,
    items: data.items.map((i) => ({ ...i, addedBy: swap(i.addedBy) ?? undefined, likes: (i.likes ?? []).map((l) => swap(l)!) })),
    todos: data.todos.map((t) => ({ ...t, addedBy: swap(t.addedBy) ?? undefined, doneBy: swap(t.doneBy) ?? null })),
  };
}

export function hasContent(data: TripData): boolean {
  return data.items.length > 0 || data.todos.length > 0 || !!data.trip.start;
}

/** Items in a day, in display order. */
export function dayItems(items: Item[], day: string): Item[] {
  return items.filter((i) => i.day === day).sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
}

/** Order value that puts a new item at the end of a day. */
export function endOrder(items: Item[], day: string): number {
  const list = dayItems(items, day);
  const last = list[list.length - 1];
  return last ? (last.order ?? last.createdAt) + 1 : 1;
}

/**
 * Order value for an item with `time` so it lands chronologically among the day's other timed items,
 * while untimed items keep their manual positions.
 */
export function orderForTime(items: Item[], day: string, time: string, selfId: string): number {
  const list = dayItems(items, day).filter((i) => i.id !== selfId);
  const ord = (i: Item) => i.order ?? i.createdAt;
  const laterIdx = list.findIndex((i) => i.time && i.time > time);
  if (laterIdx === -1) {
    // After the last timed item (or at the end if none are timed).
    let lastTimed = -1;
    list.forEach((i, idx) => i.time && (lastTimed = idx));
    if (lastTimed === -1) return list.length ? ord(list[list.length - 1]) + 1 : 1;
    const next = list[lastTimed + 1];
    return next ? (ord(list[lastTimed]) + ord(next)) / 2 : ord(list[lastTimed]) + 1;
  }
  const prev = list[laterIdx - 1];
  return prev ? (ord(prev) + ord(list[laterIdx])) / 2 : ord(list[laterIdx]) - 1;
}

/** Order value for moving an item one place up (-1) or down (+1) within its day. */
export function orderForMove(items: Item[], item: Item, dir: -1 | 1): number | null {
  if (!item.day) return null;
  const list = dayItems(items, item.day);
  const idx = list.findIndex((i) => i.id === item.id);
  const target = idx + dir;
  if (idx === -1 || target < 0 || target >= list.length) return null;
  const ord = (i: Item) => i.order ?? i.createdAt;
  const beyond = list[target + dir];
  return beyond ? (ord(list[target]) + ord(beyond)) / 2 : ord(list[target]) + dir;
}
