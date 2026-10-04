// Shared mode: Google sign-in + Firestore, with offline support so it keeps working
// on the subway (changes sync when you're back online).
//
// Firestore layout:
//   trips/{tripId}                 name, start, end, cities, days, members[], names{}
//   trips/{tripId}/items/{itemId}  ideas and plan items
//   trips/{tripId}/todos/{todoId}  to-do and packing lists

import { FirebaseError, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import {
  FieldPath,
  arrayRemove,
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  initializeFirestore,
  memoryLocalCache,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
  type WriteBatch,
} from "firebase/firestore";
import type { Backend, DayInfo, Item, SyncState, Todo, Trip, TripData } from "../types";
import { LOCAL_ME, normalizeItem, normalizeTodo, normalizeTrip, remapMember } from "./model";
import { reportError } from "../lib/notify";

let auth: Auth;
let db: Firestore;

export function initFirebase(config: FirebaseOptions): void {
  if (db) return;
  const app = initializeApp(config);
  auth = getAuth(app);
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
  } catch {
    db = initializeFirestore(app, { localCache: memoryLocalCache(), ignoreUndefinedProperties: true });
  }
  // For local testing against `firebase emulators:start` (see README).
  if (import.meta.env.VITE_FIREBASE_EMULATORS === "1") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    // Lets automated tests sign in as a fake Google user without the popup.
    Object.assign(window, {
      emulatorSignIn: (email: string, name: string) =>
        signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name }))),
    });
  }
  getRedirectResult(auth).catch((err) => reportError(err, "Sign-in failed"));
}

export const emailOf = (user: User) => (user.email ?? "").toLowerCase();
export const firstName = (user: User) => user.displayName?.split(" ")[0] || emailOf(user).split("@")[0];

export function watchUser(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const code = err instanceof FirebaseError ? err.code : "";
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
    } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
      throw err;
    }
  }
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export interface TripSummary {
  id: string;
  name: string;
}

/** Trips this account has been added to. `settled` is false until the server has answered. */
export function watchMyTrips(
  email: string,
  cb: (trips: TripSummary[], settled: boolean) => void,
  onError: (err: unknown) => void,
): () => void {
  const q = query(collection(db, "trips"), where("members", "array-contains", email));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) || "Trip" })), !snap.metadata.fromCache),
    onError,
  );
}

export async function createTrip(user: User, seed: TripData): Promise<string> {
  const email = emailOf(user);
  const ref = doc(collection(db, "trips"));
  const data = remapMember(seed, LOCAL_ME, email);
  const { members: _m, names: _n, ...trip } = data.trip;
  await setDoc(ref, {
    ...trip,
    members: [email],
    names: { [email]: firstName(user) },
    createdBy: email,
    createdAt: serverTimestamp(),
  });
  await writeAll(ref.id, data.items, data.todos, []);
  return ref.id;
}

async function writeAll(tripId: string, items: Item[], todos: Todo[], extra: Array<(b: WriteBatch) => void>) {
  const tripRef = doc(db, "trips", tripId);
  const ops: Array<(b: WriteBatch) => void> = [...extra];
  for (const { id, ...rest } of items) ops.push((b) => b.set(doc(tripRef, "items", id), rest));
  for (const { id, ...rest } of todos) ops.push((b) => b.set(doc(tripRef, "todos", id), rest));
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
}

export function createCloudBackend(tripId: string, user: User, onLost: () => void): Backend {
  const me = emailOf(user);
  const tripRef = doc(db, "trips", tripId);
  const itemsCol = collection(tripRef, "items");
  const todosCol = collection(tripRef, "todos");
  let latestTrip: Trip | null = null;
  let namedSelf = false;

  const fail = (err: unknown) => reportError(err, "Sync problem");
  const run = (p: Promise<unknown>) => void p.catch(fail);
  const stripId = <T extends { id?: string }>(o: T) => {
    const { id: _, ...rest } = o;
    return rest;
  };

  return {
    kind: "cloud",
    me,
    subscribe(listener) {
      let trip: Trip | null = null;
      let items: Item[] | null = null;
      let todos: Todo[] | null = null;
      const meta = { trip: { cache: true, pending: false }, items: { cache: true, pending: false }, todos: { cache: true, pending: false } };

      const emit = () => {
        if (!trip || !items || !todos) return;
        const all = Object.values(meta);
        let sync: SyncState = "synced";
        if (!navigator.onLine) sync = "offline";
        else if (all.some((m) => m.pending || m.cache)) sync = "pending";
        listener({ trip, items, todos }, sync);
      };
      const onDenied = (err: unknown) => {
        if (err instanceof FirebaseError && err.code === "permission-denied") onLost();
        else fail(err);
      };

      const unsubs = [
        onSnapshot(
          tripRef,
          { includeMetadataChanges: true },
          (snap) => {
            if (!snap.exists()) {
              if (!snap.metadata.fromCache) onLost();
              return;
            }
            trip = latestTrip = normalizeTrip(snap.data() as Partial<Trip>);
            meta.trip = { cache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites };
            // First visit after being invited: record your display name.
            if (!snap.metadata.fromCache && !trip.names?.[me] && !namedSelf) {
              namedSelf = true;
              run(updateDoc(tripRef, new FieldPath("names", me), firstName(user)));
            }
            emit();
          },
          onDenied,
        ),
        onSnapshot(
          itemsCol,
          { includeMetadataChanges: true },
          (snap) => {
            items = snap.docs.map((d) => normalizeItem({ ...(d.data() as Partial<Item>), id: d.id }));
            meta.items = { cache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites };
            emit();
          },
          onDenied,
        ),
        onSnapshot(
          todosCol,
          { includeMetadataChanges: true },
          (snap) => {
            todos = snap.docs.map((d) => normalizeTodo({ ...(d.data() as Partial<Todo>), id: d.id }));
            meta.todos = { cache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites };
            emit();
          },
          onDenied,
        ),
      ];
      window.addEventListener("online", emit);
      window.addEventListener("offline", emit);
      return () => {
        unsubs.forEach((u) => u());
        window.removeEventListener("online", emit);
        window.removeEventListener("offline", emit);
      };
    },
    addItem(item) {
      run(setDoc(doc(itemsCol, item.id), stripId(item)));
    },
    updateItem(id, patch) {
      run(updateDoc(doc(itemsCol, id), { ...stripId(patch), updatedAt: Date.now() }));
    },
    deleteItem(id) {
      run(deleteDoc(doc(itemsCol, id)));
    },
    setLike(id, liked) {
      run(updateDoc(doc(itemsCol, id), { likes: liked ? arrayUnion(me) : arrayRemove(me) }));
    },
    updateTrip(patch) {
      run(updateDoc(tripRef, patch));
    },
    setDay(date, info: DayInfo) {
      const pairs = Object.entries(info).flatMap(([k, v]) => [new FieldPath("days", date, k), v ?? ""]);
      if (pairs.length >= 2) {
        const [field, value, ...more] = pairs as [FieldPath, unknown, ...unknown[]];
        run(updateDoc(tripRef, field, value, ...more));
      }
    },
    setName(name) {
      run(updateDoc(tripRef, new FieldPath("names", me), name));
    },
    addTodo(todo) {
      run(setDoc(doc(todosCol, todo.id), stripId(todo)));
    },
    updateTodo(id, patch) {
      run(updateDoc(doc(todosCol, id), stripId(patch)));
    },
    deleteTodo(id) {
      run(deleteDoc(doc(todosCol, id)));
    },
    async importData(incoming) {
      const data = remapMember(incoming, LOCAL_ME, me);
      const extra: Array<(b: WriteBatch) => void> = [];
      const cities = data.trip.cities.filter((c) => !latestTrip?.cities.includes(c));
      if (cities.length) extra.push((b) => b.update(tripRef, { cities: arrayUnion(...cities) }));
      if (!latestTrip?.start && data.trip.start) {
        extra.push((b) => b.update(tripRef, { start: data.trip.start, end: data.trip.end ?? null }));
      }
      for (const [date, info] of Object.entries(data.trip.days ?? {})) {
        if (!latestTrip?.days?.[date]) extra.push((b) => b.update(tripRef, new FieldPath("days", date), info));
      }
      await writeAll(tripId, data.items, data.todos, extra);
    },
    invite(email) {
      run(updateDoc(tripRef, { members: arrayUnion(email.trim().toLowerCase()) }));
    },
    removeMember(email) {
      run(updateDoc(tripRef, { members: arrayRemove(email) }));
    },
  };
}
