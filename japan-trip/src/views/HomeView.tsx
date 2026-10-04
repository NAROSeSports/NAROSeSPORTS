import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ClipboardPaste, Download, Heart, Users, X } from "lucide-react";
import { useTrip } from "../components/TripContext";
import { IdeaRow, IdeaTile } from "../components/ItemCard";
import { TripDates } from "../components/TripDates";
import { Button, cx, inputClass } from "../components/ui";
import { DayItemRow } from "./PlanView";
import { dayItems } from "../data/model";
import { formatDay, todayIso, tripPhase } from "../lib/dates";
import { isInstalled, promptInstall } from "../lib/install";
import { useCanInstall, type Tab } from "../lib/hooks";

export function HomeView({ go }: { go: (t: Tab) => void }) {
  const { data, days, members, backend } = useTrip();
  const { items, trip } = data;
  const ideas = items.filter((i) => !i.day);
  const bothWant = members.length > 1 ? ideas.filter((i) => members.every((m) => i.likes?.includes(m))) : [];
  const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  const phase = tripPhase(trip.start, trip.end);
  const today = todayIso();
  const todayList = phase.phase === "during" ? dayItems(items, today) : [];
  const openTodos = data.todos.filter((t) => !t.done && t.list === "todo").length;

  return (
    <div className="space-y-7">
      <Hero />
      <QuickBar />

      <Nudges go={go} />

      {phase.phase === "during" && (
        <Section title={`Today · ${data.trip.days?.[today]?.city ?? formatDay(today)}`} action={<SeeAll onClick={() => go("plan")} label="Full plan" />}>
          {todayList.length ? (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-card px-3">
              {todayList.map((i) => (
                <DayItemRow key={i.id} item={i} compact />
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-muted">Nothing planned today — free to wander!</p>
          )}
        </Section>
      )}

      {bothWant.length > 0 && (
        <Section
          title={
            <span className="inline-flex items-center gap-2">
              <Heart size={18} className="text-sakura" fill="currentColor" /> You both want these
            </span>
          }
          subtitle="Hearted by both of you but not in the plan yet"
        >
          <div className="space-y-2">
            {bothWant.slice(0, 5).map((i) => (
              <IdeaRow key={i.id} item={i} />
            ))}
          </div>
        </Section>
      )}

      {recent.length > 0 ? (
        <Section title="Recently saved" action={<SeeAll onClick={() => go("ideas")} label="All ideas" />}>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:-mx-8 md:px-8">
            {recent.map((i) => (
              <IdeaTile key={i.id} item={i} />
            ))}
          </div>
        </Section>
      ) : (
        <HowToAdd />
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Ideas" value={ideas.length} onClick={() => go("ideas")} />
        <Stat label="Planned" value={items.length - ideas.length} sub={days.length ? `over ${days.length} days` : undefined} onClick={() => go("plan")} />
        <Stat label="To-dos left" value={openTodos} onClick={() => go("lists")} />
      </div>

      {backend.kind === "local" && items.length > 0 && (
        <p className="text-center text-xs text-muted">Saved on this device only · turn on syncing in Settings to share</p>
      )}
    </div>
  );
}

function Hero() {
  const { data } = useTrip();
  const { trip } = data;
  const phase = tripPhase(trip.start, trip.end);
  let big: ReactNode = null;
  let small = "";
  if (phase.phase === "before") {
    big = phase.daysToGo;
    small = phase.daysToGo === 1 ? "day to go!" : "days to go";
  } else if (phase.phase === "during") {
    big = `Day ${phase.dayNumber}`;
    small = `of ${phase.totalDays} · enjoy!`;
  } else if (phase.phase === "after") {
    big = "おかえり";
    small = "Welcome home — hope it was amazing";
  }
  return (
    <section className="relative overflow-hidden rounded-3xl bg-accent p-6 text-accent-ink shadow-lg shadow-accent/20">
      {/* Hinomaru-style circle for a bit of flavour */}
      <div className="pointer-events-none absolute -top-10 -right-10 size-44 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute top-8 right-8 size-14 rounded-full bg-white/20" />
      <div className="relative">
        <div className="text-xs font-semibold tracking-[0.2em] uppercase opacity-80">{trip.name}</div>
        {phase.phase === "undated" ? (
          <div className="mt-3">
            <div className="font-display text-2xl font-bold">When are you going?</div>
            <div className="mt-3 rounded-2xl bg-paper p-3 text-ink">
              <TripDates />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-2 font-display text-5xl leading-none font-bold tabular-nums">{big}</div>
            <div className="mt-1 text-lg font-medium opacity-95">{small}</div>
            <div className="mt-4 text-sm opacity-85">
              {formatDay(trip.start!, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} – {formatDay(trip.end!, { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function QuickBar() {
  const { openQuickAdd } = useTrip();
  const [text, setText] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return openQuickAdd();
    openQuickAdd({ text: text.trim() });
    setText("");
  };
  const pasteAndAdd = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      openQuickAdd(clip ? { text: clip } : {});
    } catch {
      openQuickAdd();
    }
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a link or jot an idea…"
        aria-label="Quick add"
        className={cx(inputClass, "h-12 rounded-full px-5")}
      />
      {text ? (
        <Button type="submit" variant="primary" className="h-12 shrink-0">
          Add
        </Button>
      ) : (
        <Button onClick={pasteAndAdd} className="h-12 shrink-0" aria-label="Paste a link from clipboard">
          <ClipboardPaste size={18} /> Paste
        </Button>
      )}
    </form>
  );
}

function dismissed(key: string): boolean {
  try {
    return localStorage.getItem(`dismiss:${key}`) === "1";
  } catch {
    return false;
  }
}

function Nudges({ go }: { go: (t: Tab) => void }) {
  const { backend, members } = useTrip();
  const canInstall = useCanInstall();
  const [, force] = useState(0);
  const dismiss = (key: string) => {
    try {
      localStorage.setItem(`dismiss:${key}`, "1");
    } catch {
      /* ignore */
    }
    force((n) => n + 1);
  };

  const cards: ReactNode[] = [];
  if (!isInstalled() && !dismissed("install")) {
    cards.push(
      <Nudge key="install" icon={<Download size={20} />} onDismiss={() => dismiss("install")} title="Put it on your home screen">
        Then in TikTok, YouTube or Maps tap <b>Share → Japan Trip</b> to save things in two taps.
        {canInstall ? (
          <Button variant="primary" size="sm" className="mt-3 flex" onClick={promptInstall}>
            Install app
          </Button>
        ) : (
          <span className="mt-1 block text-xs">In Chrome: ⋮ menu → “Add to Home screen” / “Install app”.</span>
        )}
      </Nudge>,
    );
  }
  if (backend.kind === "local" && !dismissed("sync")) {
    cards.push(
      <Nudge key="sync" icon={<Users size={20} />} onDismiss={() => dismiss("sync")} title="Plan it together">
        Right now everything is saved on this device. Turn on syncing so you can both add ideas from your own phones.
        <Button size="sm" className="mt-3 flex" onClick={() => go("settings")}>
          How to set it up <ArrowRight size={16} />
        </Button>
      </Nudge>,
    );
  } else if (backend.kind === "cloud" && members.length < 2 && !dismissed("invite")) {
    cards.push(
      <Nudge key="invite" icon={<Users size={20} />} onDismiss={() => dismiss("invite")} title="Invite your travel buddy">
        Add their Google account so they see everything and can add their own finds.
        <Button size="sm" className="mt-3 flex" onClick={() => go("settings")}>
          Invite <ArrowRight size={16} />
        </Button>
      </Nudge>,
    );
  }
  return cards.length ? <div className="space-y-3">{cards}</div> : null;
}

function Nudge({ icon, title, children, onDismiss }: { icon: ReactNode; title: string; children: ReactNode; onDismiss: () => void }) {
  return (
    <div className="relative flex gap-3 rounded-2xl border border-line bg-card p-4 pr-10">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</div>
      <div className="min-w-0 text-sm text-muted">
        <div className="mb-0.5 text-[15px] font-semibold text-ink">{title}</div>
        {children}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="absolute top-2 right-2 rounded-full p-1.5 text-muted hover:bg-sunken">
        <X size={16} />
      </button>
    </div>
  );
}

function HowToAdd() {
  const steps = [
    { emoji: "📱", title: "From TikTok, YouTube, Instagram or Maps", text: "Tap Share → Japan Trip. The title and thumbnail fill in automatically." },
    { emoji: "💻", title: "On the computer", text: "Copy a link and press Ctrl+V anywhere in the app, or use the bookmark button from Settings." },
    { emoji: "✍️", title: "Just an idea?", text: "Tap + and type it — “try a konbini egg sandwich”." },
  ];
  return (
    <Section title="Start collecting ideas">
      <div className="space-y-2">
        {steps.map((s) => (
          <div key={s.title} className="flex gap-3 rounded-2xl border border-line bg-card p-4">
            <div className="text-2xl">{s.emoji}</div>
            <div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-muted">{s.text}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Section({ title, subtitle, action, children }: { title: ReactNode; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent">
      {label} <ArrowRight size={15} />
    </button>
  );
}

function Stat({ label, value, sub, onClick }: { label: string; value: number; sub?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-line bg-card p-3 text-left transition hover:bg-sunken">
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-medium text-muted">{label}</div>
      {sub && <div className="text-[11px] text-muted/80">{sub}</div>}
    </button>
  );
}
