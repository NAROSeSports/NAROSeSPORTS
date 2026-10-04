import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import type { FirebaseOptions } from "firebase/app";
import { LoaderCircle, LogOut } from "lucide-react";
import { Planner, Splash, Logo } from "./Planner";
import { Button } from "./ui";
import type { Account } from "./TripContext";
import { clearLocalData, loadLocalData } from "../data/local";
import { emptyData, hasContent } from "../data/model";
import type { TripData } from "../types";

type CloudModule = typeof import("../data/cloud");
const TRIP_KEY = "trip-id";

function storedTrip(): string | null {
  try {
    return localStorage.getItem(TRIP_KEY);
  } catch {
    return null;
  }
}
function storeTrip(id: string | null) {
  try {
    if (id) localStorage.setItem(TRIP_KEY, id);
    else localStorage.removeItem(TRIP_KEY);
  } catch {
    /* ignore */
  }
}

/** Shared mode: sign in with Google, find (or create) your trip, then show the planner. */
export function CloudGate({ config }: { config: FirebaseOptions }) {
  const [cloud, setCloud] = useState<CloudModule | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [tripId, setTripId] = useState<string | null>(storedTrip);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    import("../data/cloud")
      .then((m) => {
        m.initFirebase(config);
        setCloud(m);
      })
      .catch((err) => setLoadError(String(err)));
  }, [config]);
  useEffect(() => cloud?.watchUser(setUser), [cloud]);

  const choose = useCallback((id: string | null) => {
    storeTrip(id);
    setTripId(id);
  }, []);
  const leave = useCallback(() => choose(null), [choose]);

  if (loadError) return <Centered>Couldn't start: {loadError}</Centered>;
  if (!cloud || user === undefined) return <Splash />;
  if (!user) return <SignIn cloud={cloud} />;
  if (!tripId) return <TripChooser cloud={cloud} user={user} onChoose={choose} />;
  return <CloudPlanner key={`${user.uid}:${tripId}`} cloud={cloud} user={user} tripId={tripId} onLeave={leave} />;
}

function CloudPlanner({ cloud, user, tripId, onLeave }: { cloud: CloudModule; user: User; tripId: string; onLeave: () => void }) {
  const backend = useMemo(() => cloud.createCloudBackend(tripId, user, onLeave), [cloud, tripId, user, onLeave]);
  const account = useMemo<Account>(
    () => ({
      email: cloud.emailOf(user),
      name: cloud.firstName(user),
      signOut: () => {
        storeTrip(null);
        void cloud.signOutUser();
      },
      switchTrip: onLeave,
    }),
    [cloud, user, onLeave],
  );
  return <Planner backend={backend} account={account} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">{children}</div>
    </div>
  );
}

function SignIn({ cloud }: { cloud: CloudModule }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Centered>
      <div className="mx-auto mb-5 w-fit">
        <Logo size={72} />
      </div>
      <h1 className="font-display text-3xl font-bold">Japan Trip</h1>
      <p className="mt-2 text-muted">Collect ideas from TikTok, YouTube &amp; Maps and plan every day of your trip — together.</p>
      <Button
        variant="primary"
        className="mt-8 w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await cloud.signInWithGoogle();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <LoaderCircle className="animate-spin" size={18} /> : <GoogleG />} Sign in with Google
      </Button>
      {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      <p className="mt-6 text-xs text-muted">Only Google accounts added to your trip can see it.</p>
    </Centered>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" opacity=".95" />
      <path fill="#fff" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" opacity=".8" />
      <path fill="#fff" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" opacity=".65" />
      <path fill="#fff" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" opacity=".9" />
    </svg>
  );
}

function TripChooser({ cloud, user, onChoose }: { cloud: CloudModule; user: User; onChoose: (id: string) => void }) {
  const email = cloud.emailOf(user);
  const [trips, setTrips] = useState<{ id: string; name: string }[] | null>(null);
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<TripData | null>(null);
  const [bringLocal, setBringLocal] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(
    () =>
      cloud.watchMyTrips(
        email,
        (t, isSettled) => {
          setTrips(t);
          setSettled(isSettled);
        },
        (err) => setError(err instanceof Error ? err.message : String(err)),
      ),
    [cloud, email],
  );
  useEffect(() => {
    loadLocalData().then((d) => setLocal(hasContent(d) ? d : null));
  }, []);

  // Exactly one trip (the usual case) — go straight in once the server has confirmed it.
  useEffect(() => {
    if (settled && trips?.length === 1) onChoose(trips[0].id);
  }, [trips, settled, onChoose]);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const seed = bringLocal && local ? local : emptyData();
      const id = await cloud.createTrip(user, seed);
      if (bringLocal && local) await clearLocalData();
      onChoose(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCreating(false);
    }
  };

  const signOut = (
    <button type="button" onClick={() => cloud.signOutUser()} className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted">
      <LogOut size={15} /> Not {email}? Sign out
    </button>
  );

  if (error) {
    return (
      <Centered>
        <h1 className="font-display text-2xl font-bold">Couldn't load your trips</h1>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <p className="mt-3 text-sm text-muted">
          If this says “missing or insufficient permissions”, the Firestore rules haven't been published yet — see the README.
        </p>
        <Button className="mt-6" onClick={() => location.reload()}>
          Try again
        </Button>
        <div>{signOut}</div>
      </Centered>
    );
  }

  if (!trips || (!settled && trips.length === 0)) {
    return (
      <Centered>
        <LoaderCircle className="mx-auto animate-spin text-accent" size={32} />
        <p className="mt-3 text-muted">Looking for your trip…</p>
      </Centered>
    );
  }

  if (trips.length > 1) {
    return (
      <Centered>
        <h1 className="mb-4 font-display text-2xl font-bold">Which trip?</h1>
        <div className="space-y-2">
          {trips.map((t) => (
            <Button key={t.id} className="w-full" onClick={() => onChoose(t.id)}>
              {t.name}
            </Button>
          ))}
        </div>
        {signOut}
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="mx-auto mb-4 w-fit">
        <Logo size={56} />
      </div>
      <h1 className="font-display text-2xl font-bold">Hi {cloud.firstName(user)}!</h1>
      <div className="mt-6 rounded-3xl border border-line bg-card p-5 text-left">
        <h2 className="font-semibold">Has your partner already set it up?</h2>
        <p className="mt-1 text-sm text-muted">
          Ask them to invite <b className="text-ink">{email}</b> in Settings → People. This page will open the trip automatically.
        </p>
      </div>
      <div className="mt-3 rounded-3xl border border-line bg-card p-5 text-left">
        <h2 className="font-semibold">First one here?</h2>
        <p className="mt-1 text-sm text-muted">Start your shared trip, then invite them.</p>
        {local && (
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={bringLocal} onChange={(e) => setBringLocal(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
            <span>
              Bring in the {local.items.length} ideas and {local.todos.length} list items saved on this device
            </span>
          </label>
        )}
        <Button variant="primary" className="mt-4 w-full" disabled={creating} onClick={create}>
          {creating && <LoaderCircle className="animate-spin" size={18} />} Start our trip
        </Button>
      </div>
      {signOut}
    </Centered>
  );
}
