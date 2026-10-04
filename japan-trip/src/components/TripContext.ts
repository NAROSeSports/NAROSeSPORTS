import { createContext, useContext } from "react";
import type { Backend, SyncState, TripData } from "../types";
import type { SharedInput } from "../lib/share";

export interface Account {
  email: string;
  name: string;
  signOut: () => void;
  switchTrip: () => void;
}

export interface QuickAddInit extends SharedInput {
  day?: string | null;
}

export interface TripContextValue {
  data: TripData;
  sync: SyncState;
  backend: Backend;
  me: string;
  /** Member keys in a stable order (for avatar colours). */
  members: string[];
  /** All trip dates, YYYY-MM-DD. */
  days: string[];
  account: Account | null;
  nameOf: (key?: string | null) => string;
  openItem: (id: string) => void;
  openQuickAdd: (init?: QuickAddInit) => void;
  planItem: (id: string) => void;
}

export const TripContext = createContext<TripContextValue | null>(null);

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside <Planner>");
  return ctx;
}
