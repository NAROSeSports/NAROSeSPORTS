// "This device only" mode, used until Firebase is configured. Data lives in IndexedDB.

import type { Backend, SyncState, TripData } from "../types";
import { kvGet, kvSet } from "./kv";
import { LOCAL_ME, emptyData, normalizeData } from "./model";
import { reportError } from "../lib/notify";

const KEY = "local-trip";

export async function loadLocalData(): Promise<TripData> {
  try {
    return normalizeData(await kvGet<TripData>(KEY));
  } catch (err) {
    reportError(err, "Couldn't read saved data");
    return emptyData();
  }
}

export async function clearLocalData(): Promise<void> {
  await kvSet(KEY, emptyData());
}

export async function createLocalBackend(): Promise<Backend> {
  let data = await loadLocalData();
  const listeners = new Set<(d: TripData, s: SyncState) => void>();
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("japan-trip-local") : null;

  const emit = () => listeners.forEach((l) => l(data, "local"));
  const commit = (next: TripData) => {
    data = next;
    emit();
    kvSet(KEY, data)
      .then(() => channel?.postMessage("changed"))
      .catch((err) => reportError(err, "Couldn't save"));
  };
  // Keep other open tabs/windows in step.
  if (channel) {
    channel.onmessage = async () => {
      data = await loadLocalData();
      emit();
    };
  }

  const now = () => Date.now();

  return {
    kind: "local",
    me: LOCAL_ME,
    subscribe(listener) {
      listeners.add(listener);
      listener(data, "local");
      return () => listeners.delete(listener);
    },
    addItem(item) {
      commit({ ...data, items: [...data.items, item] });
    },
    updateItem(id, patch) {
      commit({ ...data, items: data.items.map((i) => (i.id === id ? { ...i, ...patch, id, updatedAt: now() } : i)) });
    },
    deleteItem(id) {
      commit({ ...data, items: data.items.filter((i) => i.id !== id) });
    },
    setLike(id, liked) {
      commit({
        ...data,
        items: data.items.map((i) => {
          if (i.id !== id) return i;
          const likes = new Set(i.likes ?? []);
          if (liked) likes.add(LOCAL_ME);
          else likes.delete(LOCAL_ME);
          return { ...i, likes: [...likes] };
        }),
      });
    },
    updateTrip(patch) {
      commit({ ...data, trip: { ...data.trip, ...patch } });
    },
    setDay(date, info) {
      const days = data.trip.days ?? {};
      commit({ ...data, trip: { ...data.trip, days: { ...days, [date]: { ...days[date], ...info } } } });
    },
    setName(name) {
      commit({ ...data, trip: { ...data.trip, names: { ...data.trip.names, [LOCAL_ME]: name } } });
    },
    addTodo(todo) {
      commit({ ...data, todos: [...data.todos, todo] });
    },
    updateTodo(id, patch) {
      commit({ ...data, todos: data.todos.map((t) => (t.id === id ? { ...t, ...patch, id } : t)) });
    },
    deleteTodo(id) {
      commit({ ...data, todos: data.todos.filter((t) => t.id !== id) });
    },
    async importData(incoming) {
      const items = new Map(data.items.map((i) => [i.id, i]));
      incoming.items.forEach((i) => items.set(i.id, i));
      const todos = new Map(data.todos.map((t) => [t.id, t]));
      incoming.todos.forEach((t) => todos.set(t.id, t));
      const cities = [...new Set([...data.trip.cities, ...incoming.trip.cities])];
      commit({
        trip: {
          ...data.trip,
          start: data.trip.start ?? incoming.trip.start,
          end: data.trip.end ?? incoming.trip.end,
          cities,
          days: { ...incoming.trip.days, ...data.trip.days },
        },
        items: [...items.values()],
        todos: [...todos.values()],
      });
    },
  };
}
