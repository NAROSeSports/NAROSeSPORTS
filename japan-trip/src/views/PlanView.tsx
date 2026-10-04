import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Circle, CircleCheck, Pencil, Plus, Route, Search } from "lucide-react";
import type { Item } from "../types";
import { useTrip } from "../components/TripContext";
import { TripDates } from "../components/TripDates";
import { Button, EditableText, EmptyState, IconButton, Sheet, SourceBadge, Thumb, cx, inputClass } from "../components/ui";
import { categoryInfo, dayItems, endOrder, orderForMove } from "../data/model";
import { formatDay, formatTime, todayIso } from "../lib/dates";
import { mapsDirectionsUrl } from "../lib/links";
import { notify } from "../lib/notify";

export function PlanView() {
  const { data, days } = useTrip();
  const [editingDates, setEditingDates] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const today = todayIso();

  // During the trip, jump straight to today.
  useEffect(() => {
    if (days.includes(today)) document.getElementById(`day-${today}`)?.scrollIntoView({ block: "start" });
  }, []); // only on first open

  const outside = useMemo(() => data.items.filter((i) => i.day && !days.includes(i.day)), [data.items, days]);

  if (days.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold">Plan</h1>
        <div className="rounded-3xl border border-line bg-card p-5">
          <h2 className="mb-1 font-display text-xl font-bold">When are you going?</h2>
          <p className="mb-4 text-sm text-muted">Add your dates and you'll get a day-by-day plan to drop ideas into.</p>
          <TripDates />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Plan</h1>
        <Button size="sm" variant="ghost" onClick={() => setEditingDates(!editingDates)}>
          <Pencil size={15} /> Dates
        </Button>
      </div>
      {editingDates && (
        <div className="rounded-2xl border border-line bg-card p-4">
          <TripDates />
        </div>
      )}

      <DayStrip />

      <div className="space-y-4">
        {days.map((d, i) => (
          <DayCard key={d} date={d} index={i} isToday={d === today} onAdd={() => setAddingTo(d)} />
        ))}
      </div>

      {outside.length > 0 && (
        <div className="rounded-2xl border border-dashed border-accent/50 p-4">
          <h3 className="font-semibold">Outside your trip dates</h3>
          <p className="mb-2 text-sm text-muted">These were planned for days that are no longer in the trip — pick a new day for them.</p>
          <ul className="divide-y divide-line">
            {outside.map((i) => (
              <DayItemRow key={i.id} item={i} compact />
            ))}
          </ul>
        </div>
      )}

      {addingTo && <AddToDaySheet key={addingTo} day={addingTo} onClose={() => setAddingTo(null)} />}
    </div>
  );
}

function DayStrip() {
  const { data, days } = useTrip();
  const today = todayIso();
  return (
    <div className="no-scrollbar sticky top-[calc(env(safe-area-inset-top)+3.25rem)] z-20 -mx-4 flex gap-2 overflow-x-auto bg-paper/90 px-4 py-2 backdrop-blur-md md:top-0 md:-mx-8 md:px-8">
      {days.map((d, i) => {
        const count = dayItems(data.items, d).length;
        const city = data.trip.days?.[d]?.city;
        return (
          <button
            key={d}
            type="button"
            onClick={() => document.getElementById(`day-${d}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={cx(
              "flex w-14 shrink-0 flex-col items-center rounded-2xl border py-1.5 transition",
              d === today ? "border-accent bg-accent text-accent-ink" : "border-line bg-card hover:bg-sunken",
            )}
          >
            <span className="text-[10px] font-semibold uppercase opacity-80">{formatDay(d, { weekday: "short" })}</span>
            <span className="font-display text-lg leading-tight font-bold">{formatDay(d, { day: "numeric" })}</span>
            <span className="max-w-full truncate px-1 text-[10px] opacity-80">{city ? city.slice(0, 7) : `D${i + 1}`}</span>
            <span className={cx("mt-0.5 size-1.5 rounded-full", count ? (d === today ? "bg-accent-ink" : "bg-accent") : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}

function DayCard({ date, index, isToday, onAdd }: { date: string; index: number; isToday: boolean; onAdd: () => void }) {
  const { data, backend } = useTrip();
  const info = data.trip.days?.[date] ?? {};
  const list = dayItems(data.items, date);
  const stops = list
    .map((i) => i.place || (i.source === "maps" ? i.title : null))
    .filter((s): s is string => !!s)
    .map((s) => (info.city && !s.toLowerCase().includes(info.city.toLowerCase()) ? `${s}, ${info.city}` : s));
  const route = stops.length >= 2 ? mapsDirectionsUrl(stops) : null;
  const done = list.filter((i) => i.done).length;

  return (
    <section id={`day-${date}`} className={cx("scroll-mt-32 rounded-3xl border bg-card p-4 md:scroll-mt-24", isToday ? "border-accent shadow-md shadow-accent/10" : "border-line")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold tracking-wide text-accent uppercase">
            Day {index + 1}
            {isToday && " · Today"}
          </div>
          <h3 className="font-display text-xl font-bold">{formatDay(date, { weekday: "long", day: "numeric", month: "long" })}</h3>
        </div>
        <select
          value={info.city ?? ""}
          onChange={(e) => backend.setDay(date, { city: e.target.value })}
          aria-label={`City for day ${index + 1}`}
          className={cx(
            "h-9 max-w-36 shrink-0 rounded-full border px-3 text-sm font-medium",
            info.city ? "border-ink bg-ink text-paper" : "border-dashed border-line bg-transparent text-muted",
          )}
        >
          <option value="">Where?</option>
          {data.trip.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <EditableText
        value={info.note ?? ""}
        onSave={(note) => backend.setDay(date, { note })}
        placeholder="Notes for the day — hotel, check-out time, reminders…"
        className="mt-2 border-transparent bg-transparent px-0 py-1 text-sm text-muted focus:border-line focus:bg-paper focus:px-3"
      />

      {list.length > 0 ? (
        <ul className="mt-1 divide-y divide-line">
          {list.map((i, idx) => (
            <DayItemRow key={i.id} item={i} first={idx === 0} last={idx === list.length - 1} />
          ))}
        </ul>
      ) : (
        <p className="py-3 text-sm text-muted">Nothing planned yet.</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAdd}>
          <Plus size={16} /> Add
        </Button>
        {route && (
          <a href={route} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ai hover:bg-ai-soft">
            <Route size={16} /> Route in Maps
          </a>
        )}
        {list.length > 0 && done > 0 && (
          <span className="ml-auto text-xs text-muted">
            {done}/{list.length} done
          </span>
        )}
      </div>
    </section>
  );
}

export function DayItemRow({ item, first, last, compact }: { item: Item; first?: boolean; last?: boolean; compact?: boolean }) {
  const { data, backend, openItem } = useTrip();
  const move = (dir: -1 | 1) => {
    const order = orderForMove(data.items, item, dir);
    if (order !== null) backend.updateItem(item.id, { order });
  };
  return (
    <li className="flex items-center gap-2 py-2">
      <button
        type="button"
        onClick={() => backend.updateItem(item.id, { done: !item.done })}
        aria-label={item.done ? "Mark not done" : "Mark done"}
        className={cx("shrink-0 rounded-full p-1 transition active:scale-90", item.done ? "text-matcha" : "text-line hover:text-muted")}
      >
        {item.done ? <CircleCheck size={22} /> : <Circle size={22} />}
      </button>
      <button type="button" onClick={() => openItem(item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Thumb src={item.thumb} category={item.category} className={cx("size-11 shrink-0 rounded-xl", item.done && "opacity-50")} />
        <span className="min-w-0 flex-1">
          <span className={cx("line-clamp-2 text-[15px] leading-snug font-medium", item.done && "text-muted line-through")}>{item.title}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            {item.time && <span className="font-semibold text-ink tabular-nums">{formatTime(item.time)}</span>}
            <SourceBadge source={item.source} size={14} />
            <span className="truncate">
              {categoryInfo(item.category).emoji} {item.booking ? `Booked · ${item.booking}` : item.place || item.city || categoryInfo(item.category).label}
            </span>
          </span>
        </span>
      </button>
      {!compact && (
        <div className="flex shrink-0 flex-col">
          <IconButton label="Move up" onClick={() => move(-1)} disabled={first} className="size-7">
            <ChevronUp size={18} />
          </IconButton>
          <IconButton label="Move down" onClick={() => move(1)} disabled={last} className="size-7">
            <ChevronDown size={18} />
          </IconButton>
        </div>
      )}
    </li>
  );
}

function AddToDaySheet({ day, onClose }: { day: string; onClose: () => void }) {
  const { data, days, backend, members, openQuickAdd } = useTrip();
  const [q, setQ] = useState("");
  const dayCity = data.trip.days?.[day]?.city;
  const ideas = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const score = (i: Item) =>
      (dayCity && i.city === dayCity ? 1000 : 0) + (members.every((m) => i.likes?.includes(m)) ? 100 : 0) + (i.likes?.length ?? 0) * 10;
    return data.items
      .filter((i) => !i.day)
      .filter((i) => words.every((w) => [i.title, i.city, i.notes, i.place].join(" ").toLowerCase().includes(w)))
      .sort((a, b) => score(b) - score(a) || b.createdAt - a.createdAt);
  }, [data.items, q, dayCity, members]);

  const add = (item: Item) => {
    backend.updateItem(item.id, { day, order: endOrder(data.items, day), done: false });
    notify(`Added to Day ${days.indexOf(day) + 1}`);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Add to Day ${days.indexOf(day) + 1}`}
      footer={
        <Button
          variant="primary"
          className="w-full"
          onClick={() => {
            onClose();
            setTimeout(() => openQuickAdd({ day }), 50);
          }}
        >
          <Plus size={18} /> Something new
        </Button>
      }
    >
      <p className="-mt-1 mb-3 text-sm text-muted">
        {formatDay(day, { weekday: "long", day: "numeric", month: "long" })}
        {dayCity ? ` · ${dayCity} ideas first` : ""}
      </p>
      <div className="relative mb-3">
        <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your ideas" className={cx(inputClass, "pl-10")} />
      </div>
      {ideas.length === 0 ? (
        <EmptyState emoji="💡" title="No unplanned ideas">
          Add something new below.
        </EmptyState>
      ) : (
        <ul className="space-y-1.5">
          {ideas.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => add(i)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-2 text-left transition hover:bg-sunken active:scale-[0.99]"
              >
                <Thumb src={i.thumb} category={i.category} className="size-12 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[15px] leading-snug font-medium">{i.title}</span>
                  <span className="text-xs text-muted">
                    {[i.city, categoryInfo(i.category).label].filter(Boolean).join(" · ")}
                    {(i.likes?.length ?? 0) > 0 && ` · ${"♥".repeat(Math.min(2, i.likes!.length))}`}
                  </span>
                </span>
                <Plus size={20} className="mr-1 shrink-0 text-accent" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
