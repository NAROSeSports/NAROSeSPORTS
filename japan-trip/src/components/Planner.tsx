import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Cloud, CloudOff, House, Lightbulb, ListChecks, Plus, RefreshCw, Settings } from "lucide-react";
import type { Backend, SyncState, TripData } from "../types";
import { TripContext, useTrip, type Account, type QuickAddInit, type TripContextValue } from "./TripContext";
import { useTab, type Tab } from "../lib/hooks";
import { takePendingShare } from "../lib/share";
import { tripDays } from "../lib/dates";
import { LOCAL_ME } from "../data/model";
import { cx, IconButton } from "./ui";
import { Toaster } from "./Toaster";
import { QuickAdd } from "./QuickAdd";
import { ItemSheet } from "./ItemSheet";
import { DayPickerSheet } from "./DayPickerSheet";
import { HomeView } from "../views/HomeView";
import { IdeasView } from "../views/IdeasView";
import { PlanView } from "../views/PlanView";
import { ListsView } from "../views/ListsView";
import { SettingsView } from "../views/SettingsView";

const NAV: { tab: Tab; label: string; icon: typeof House }[] = [
  { tab: "home", label: "Home", icon: House },
  { tab: "ideas", label: "Ideas", icon: Lightbulb },
  { tab: "plan", label: "Plan", icon: CalendarDays },
  { tab: "lists", label: "Lists", icon: ListChecks },
];

export function Planner({ backend, account }: { backend: Backend; account: Account | null }) {
  const [state, setState] = useState<{ data: TripData; sync: SyncState } | null>(null);
  const [tab, setTab] = useTab();
  const [quickAdd, setQuickAdd] = useState<(QuickAddInit & { key: number }) | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => backend.subscribe((data, sync) => setState({ data, sync })), [backend]);

  const openQuickAdd = useCallback((init: QuickAddInit = {}) => setQuickAdd({ ...init, key: Date.now() }), []);

  // Something shared from TikTok/YouTube/etc. (or the bookmarklet) opens straight into Quick Add.
  useEffect(() => {
    const shared = takePendingShare();
    if (shared) openQuickAdd(shared);
  }, [openQuickAdd]);

  // On a computer: paste a link anywhere to add it.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (document.querySelector("[role='dialog']")) return;
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (text) {
        e.preventDefault();
        openQuickAdd({ text });
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [openQuickAdd]);

  const ctx = useMemo<TripContextValue | null>(() => {
    if (!state) return null;
    const { data, sync } = state;
    const members = backend.kind === "cloud" ? (data.trip.members ?? [backend.me]) : [LOCAL_ME];
    return {
      data,
      sync,
      backend,
      me: backend.me,
      members,
      days: tripDays(data.trip.start, data.trip.end),
      account,
      nameOf: (key) => {
        if (!key) return "Someone";
        return data.trip.names?.[key] || (key === LOCAL_ME ? "Me" : key.split("@")[0]);
      },
      openItem: setItemId,
      openQuickAdd,
      planItem: setPlanId,
    };
  }, [state, backend, account, openQuickAdd]);

  if (!ctx) return <Splash />;

  const view: Record<Tab, ReactNode> = {
    home: <HomeView go={setTab} />,
    ideas: <IdeasView />,
    plan: <PlanView />,
    lists: <ListsView />,
    settings: <SettingsView />,
  };

  return (
    <TripContext.Provider value={ctx}>
      <div className="min-h-dvh md:flex">
        <Sidebar tab={tab} go={setTab} />
        <main className="min-w-0 flex-1">
          <MobileHeader go={setTab} />
          <div className="mx-auto max-w-3xl px-4 pt-2 pb-32 md:px-8 md:pt-8 md:pb-16">{view[tab]}</div>
        </main>
        <BottomNav tab={tab} go={setTab} onAdd={() => openQuickAdd()} />
      </div>
      {quickAdd && <QuickAdd key={quickAdd.key} init={quickAdd} onClose={() => setQuickAdd(null)} />}
      {itemId && <ItemSheet key={itemId} id={itemId} onClose={() => setItemId(null)} />}
      {planId && <DayPickerSheet key={planId} id={planId} onClose={() => setPlanId(null)} />}
      <Toaster />
    </TripContext.Provider>
  );
}

export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="size-10 animate-pulse rounded-full bg-accent" />
    </div>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="16" className="fill-accent" />
      <g className="fill-[#fff8f0] dark:fill-[#1a0d09]">
        <path d="M10 17.5c7 2.2 14.7 3.2 22 3.2s15-1 22-3.2l-1.6 5.3c-6.6 1.6-13.4 2.4-20.4 2.4s-13.8-.8-20.4-2.4L10 17.5Z" />
        <rect x="15" y="28" width="34" height="4" rx="1" />
        <rect x="29.5" y="23.5" width="5" height="6" />
        <path d="M19 24.5h5l1 27h-7l1-27ZM40 24.5h5l1 27h-7l1-27Z" />
      </g>
    </svg>
  );
}

function SyncBadge({ compact }: { compact?: boolean }) {
  const { sync } = useTrip();
  const info: Record<SyncState, { icon: ReactNode; text: string; className: string }> = {
    local: { icon: <CloudOff size={16} />, text: "This device only", className: "text-muted" },
    synced: { icon: <Cloud size={16} />, text: "Synced", className: "text-matcha" },
    pending: { icon: <RefreshCw size={16} className="animate-spin [animation-duration:2s]" />, text: "Syncing…", className: "text-ai" },
    offline: { icon: <CloudOff size={16} />, text: "Offline – will sync later", className: "text-accent" },
  };
  const i = info[sync];
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs font-medium", i.className)} title={i.text}>
      {i.icon}
      {!compact && <span>{i.text}</span>}
    </span>
  );
}

function MobileHeader({ go }: { go: (t: Tab) => void }) {
  const { data, sync } = useTrip();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2.5 bg-paper/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md md:hidden">
      <Logo size={30} />
      <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold">{data.trip.name}</h1>
      <button type="button" onClick={() => go("settings")} className="rounded-full px-2 py-1.5" aria-label={`Sync status: ${sync}`}>
        <SyncBadge compact={sync === "synced"} />
      </button>
      <IconButton label="Settings" onClick={() => go("settings")} className="-mr-2">
        <Settings size={21} />
      </IconButton>
    </header>
  );
}

function BottomNav({ tab, go, onAdd }: { tab: Tab; go: (t: Tab) => void; onAdd: () => void }) {
  const item = ({ tab: t, label, icon: Icon }: (typeof NAV)[number]) => (
    <button
      key={t}
      type="button"
      onClick={() => go(t)}
      aria-current={tab === t ? "page" : undefined}
      className={cx("flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1 text-[11px] font-medium transition", tab === t ? "text-accent" : "text-muted")}
    >
      <span className={cx("flex h-7 w-14 items-center justify-center rounded-full transition", tab === t && "bg-accent-soft")}>
        <Icon size={21} strokeWidth={tab === t ? 2.4 : 2} />
      </span>
      {label}
    </button>
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="flex items-end">
        {NAV.slice(0, 2).map(item)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add an idea"
            className="-mt-5 mb-1 flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg shadow-accent/30 transition active:scale-95"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
        {NAV.slice(2).map(item)}
      </div>
    </nav>
  );
}

function Sidebar({ tab, go }: { tab: Tab; go: (t: Tab) => void }) {
  const { data, openQuickAdd, account } = useTrip();
  const all = [...NAV, { tab: "settings" as Tab, label: "Settings", icon: Settings }];
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card/60 p-5 md:flex">
      <div className="mb-6 flex items-center gap-3">
        <Logo size={36} />
        <div className="min-w-0">
          <div className="truncate font-display text-lg leading-tight font-bold">{data.trip.name}</div>
          <SyncBadge />
        </div>
      </div>
      <button
        type="button"
        onClick={() => openQuickAdd()}
        className="mb-5 flex h-11 items-center justify-center gap-2 rounded-full bg-accent font-medium text-accent-ink shadow-sm transition hover:bg-accent-strong"
      >
        <Plus size={20} /> Add idea
      </button>
      <nav className="flex flex-col gap-1">
        {all.map(({ tab: t, label, icon: Icon }) => (
          <button
            key={t}
            type="button"
            onClick={() => go(t)}
            aria-current={tab === t ? "page" : undefined}
            className={cx(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition",
              tab === t ? "bg-accent-soft text-accent" : "text-ink hover:bg-sunken",
            )}
          >
            <Icon size={20} /> {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto text-xs text-muted">
        {account ? `Signed in as ${account.email}` : "Tip: paste a link anywhere (Ctrl+V) to add it."}
      </div>
    </aside>
  );
}
