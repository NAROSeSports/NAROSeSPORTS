export type Category =
  | "food"
  | "sight"
  | "activity"
  | "shopping"
  | "nightlife"
  | "stay"
  | "transport"
  | "other";

export type Source = "tiktok" | "youtube" | "instagram" | "maps" | "web" | "note";

/** Anything you might do or visit. Unscheduled items are "ideas"; items with a `day` are in the plan. */
export interface Item {
  id: string;
  title: string;
  source: Source;
  category: Category;
  url?: string | null;
  /** Small JPEG data URL (captured when saved) or a remote image URL. */
  thumb?: string | null;
  author?: string | null;
  notes?: string | null;
  city?: string | null;
  /** Place name or address used for Google Maps search/directions. */
  place?: string | null;
  mapsUrl?: string | null;
  /** YYYY-MM-DD when scheduled, null when it's just an idea. */
  day?: string | null;
  /** HH:MM, optional. */
  time?: string | null;
  /** Manual sort position within a day. */
  order?: number;
  /** Booking / confirmation reference. */
  booking?: string | null;
  /** Member keys (emails in cloud mode) who hearted this. */
  likes?: string[];
  done?: boolean;
  addedBy?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface DayInfo {
  city?: string;
  note?: string;
}

export interface Trip {
  name: string;
  start?: string | null;
  end?: string | null;
  cities: string[];
  /** Per-day info keyed by YYYY-MM-DD. */
  days?: Record<string, DayInfo>;
  /** Lowercase emails allowed into this trip (cloud mode). */
  members?: string[];
  /** Display names keyed by member key. */
  names?: Record<string, string>;
}

export type TodoList = "todo" | "packing";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  list: TodoList;
  addedBy?: string;
  doneBy?: string | null;
  createdAt: number;
}

export interface TripData {
  trip: Trip;
  items: Item[];
  todos: Todo[];
}

export type SyncState = "local" | "synced" | "pending" | "offline";

export interface Backend {
  kind: "local" | "cloud";
  /** Key identifying the current person (email in cloud mode). */
  me: string;
  subscribe(listener: (data: TripData, sync: SyncState) => void): () => void;
  addItem(item: Item): void;
  updateItem(id: string, patch: Partial<Item>): void;
  deleteItem(id: string): void;
  setLike(id: string, liked: boolean): void;
  updateTrip(patch: Partial<Pick<Trip, "name" | "start" | "end" | "cities">>): void;
  setDay(date: string, info: DayInfo): void;
  setName(name: string): void;
  addTodo(todo: Todo): void;
  updateTodo(id: string, patch: Partial<Todo>): void;
  deleteTodo(id: string): void;
  /** Adds everything from a backup (or local data) into this trip. */
  importData(data: TripData): Promise<void>;
  /** Shared trips only: let another Google account in / out. */
  invite?(email: string): void;
  removeMember?(email: string): void;
}
