import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Bookmark, CloudOff, Download, LogOut, Plus, Share2, Upload, UserPlus, X } from "lucide-react";
import { useTrip } from "../components/TripContext";
import { TripDates } from "../components/TripDates";
import { Avatar, Button, Chip, EditableText, Label, avatarColor, cx, inputClass } from "../components/ui";
import { LOCAL_ME, normalizeData } from "../data/model";
import { notify, reportError } from "../lib/notify";
import { isInstalled, promptInstall } from "../lib/install";
import { useCanInstall } from "../lib/hooks";
import { todayIso } from "../lib/dates";

export function SettingsView() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <TripSettings />
      <PeopleSettings />
      <AddFromAnywhere />
      <Backup />
      <p className="pb-4 text-center text-xs text-muted">Japan Trip Planner · made for two 🇯🇵</p>
    </div>
  );
}

function Card({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
        {icon}
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TripSettings() {
  const { data, backend } = useTrip();
  const [city, setCity] = useState("");
  const addCity = (e: FormEvent) => {
    e.preventDefault();
    const c = city.trim();
    if (c && !data.trip.cities.some((x) => x.toLowerCase() === c.toLowerCase())) backend.updateTrip({ cities: [...data.trip.cities, c] });
    setCity("");
  };
  return (
    <Card title="Trip">
      <div>
        <Label>Name</Label>
        <EditableText value={data.trip.name} onSave={(name) => name && backend.updateTrip({ name })} ariaLabel="Trip name" />
      </div>
      <TripDates />
      <div>
        <Label>Cities &amp; areas</Label>
        <div className="flex flex-wrap gap-2">
          {data.trip.cities.map((c) => (
            <Chip
              key={c}
              onClick={() => {
                if (confirm(`Remove ${c} from your cities? Ideas tagged ${c} keep their tag.`)) {
                  backend.updateTrip({ cities: data.trip.cities.filter((x) => x !== c) });
                }
              }}
              aria-label={`Remove ${c}`}
            >
              {c} <X size={14} className="text-muted" />
            </Chip>
          ))}
        </div>
        <form onSubmit={addCity} className="mt-3 flex gap-2">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Add a place, e.g. Kanazawa" className={inputClass} />
          <Button type="submit" disabled={!city.trim()} aria-label="Add city">
            <Plus size={18} />
          </Button>
        </form>
      </div>
    </Card>
  );
}

function PeopleSettings() {
  const { data, backend, account, me, members, nameOf } = useTrip();
  const [email, setEmail] = useState("");

  if (backend.kind === "local") {
    return (
      <Card title="You & syncing" icon={<CloudOff size={20} className="text-muted" />}>
        <div>
          <Label>Your name</Label>
          <EditableText value={data.trip.names?.[LOCAL_ME] ?? ""} onSave={(n) => backend.setName(n)} placeholder="e.g. Will" ariaLabel="Your name" />
        </div>
        <div className="rounded-2xl bg-sunken p-4 text-sm">
          <p className="mb-2 font-semibold">Syncing is off — everything is saved on this device only.</p>
          <p className="mb-2 text-muted">To plan together from both phones and your computer, connect a free Firebase project (about 10 minutes, once):</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted">
            <li>Create a Firebase project and a Web app.</li>
            <li>Turn on Google sign-in and Firestore, and paste in the rules from <code>firestore.rules</code>.</li>
            <li>Put the config in <code>src/config.ts</code> (or the <code>VITE_FIREBASE_CONFIG</code> setting on Vercel) and redeploy.</li>
          </ol>
          <p className="mt-2 text-muted">
            Full step-by-step guide: <code>japan-trip/README.md</code>. Anything you've already saved here can be moved into the shared trip when you
            first sign in.
          </p>
        </div>
      </Card>
    );
  }

  const invite = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return notify("That doesn't look like an email address");
    if (members.includes(value)) return notify("They're already in");
    backend.invite?.(value);
    setEmail("");
    notify(`Invited ${value} — they just sign in with that Google account`);
  };

  return (
    <Card title="People">
      <div>
        <Label>Your name</Label>
        <EditableText value={data.trip.names?.[me] ?? ""} onSave={(n) => n && backend.setName(n)} ariaLabel="Your name" />
      </div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m} className="flex items-center gap-3">
            <Avatar name={nameOf(m)} color={avatarColor(m, members)} size={34} />
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {nameOf(m)}
                {m === me && <span className="text-muted"> (you)</span>}
                {!data.trip.names?.[m] && m !== me && <span className="text-xs text-muted"> · hasn't signed in yet</span>}
              </div>
              <div className="truncate text-xs text-muted">{m}</div>
            </div>
            {m !== me && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => confirm(`Remove ${m} from this trip?`) && backend.removeMember?.(m)}
                aria-label={`Remove ${m}`}
              >
                <X size={16} />
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={invite}>
        <Label>Invite someone</Label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Their Gmail / Google account"
            className={inputClass}
          />
          <Button type="submit" variant="primary" className="shrink-0" disabled={!email.trim()}>
            <UserPlus size={18} /> Invite
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">Then send them the app link. When they sign in with that account, the trip appears for them.</p>
      </form>
      {account && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm">
          <span className="text-muted">Signed in as {account.email}</span>
          <Button size="sm" onClick={account.signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      )}
    </Card>
  );
}

function AddFromAnywhere() {
  const canInstall = useCanInstall();
  const bookmarklet = useRef<HTMLAnchorElement>(null);
  const appUrl = `${location.origin}${location.pathname}`;

  useEffect(() => {
    // React blocks javascript: URLs in JSX, so set the bookmarklet link directly.
    const code = `javascript:(()=>{window.open('${appUrl}?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'japantrip','width=520,height=780')})()`;
    bookmarklet.current?.setAttribute("href", code);
  }, [appUrl]);

  return (
    <Card title="Adding from anywhere" icon={<Share2 size={20} className="text-accent" />}>
      <div>
        <Label>On your phones</Label>
        <ol className="list-decimal space-y-1 pl-5 text-[15px]">
          <li>
            Open this app in Chrome and choose <b>⋮ → Add to Home screen → Install</b>.
          </li>
          <li>
            In TikTok, YouTube, Instagram, Google Maps or Chrome, tap <b>Share</b> and pick <b>Japan Trip</b>.
          </li>
          <li>Pick a city and type, tap Save. Done!</li>
        </ol>
        {isInstalled() ? (
          <p className="mt-2 text-sm text-matcha">✓ Installed on this device</p>
        ) : (
          canInstall && (
            <Button variant="primary" size="sm" className="mt-3" onClick={promptInstall}>
              <Download size={16} /> Install app
            </Button>
          )
        )}
      </div>
      <div>
        <Label>On a computer</Label>
        <p className="mb-3 text-[15px]">
          Copy a link and press <kbd className="rounded border border-line bg-sunken px-1.5 text-sm">Ctrl</kbd>+
          <kbd className="rounded border border-line bg-sunken px-1.5 text-sm">V</kbd> anywhere in the app. Or drag this button to your bookmarks
          bar, then click it on any page (YouTube, a blog, Google Maps…) to save that page:
        </p>
        <a
          ref={bookmarklet}
          onClick={(e) => {
            e.preventDefault();
            notify("Drag this button onto your bookmarks bar");
          }}
          className="inline-flex h-10 cursor-grab items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-paper"
        >
          <Bookmark size={16} /> + Japan Trip
        </a>
      </div>
    </Card>
  );
}

function Backup() {
  const { data, backend } = useTrip();
  const fileInput = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `japan-trip-backup-${todayIso()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const importFile = async (file: File) => {
    try {
      const parsed = normalizeData(JSON.parse(await file.text()));
      await backend.importData(parsed);
      notify(`Imported ${parsed.items.length} ideas and ${parsed.todos.length} list items`);
    } catch (err) {
      reportError(err, "Couldn't import that file");
    }
  };

  return (
    <Card title="Backup">
      <p className="text-sm text-muted">Download everything as a file, or bring a backup back in (it's merged with what's here).</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportData}>
          <Download size={16} /> Export
        </Button>
        <Button onClick={() => fileInput.current?.click()}>
          <Upload size={16} /> Import
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className={cx("text-xs text-muted")}>
        {data.items.length} ideas · {data.todos.length} list items
      </p>
    </Card>
  );
}
