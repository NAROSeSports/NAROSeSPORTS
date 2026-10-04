import { useMemo, useState } from "react";
import { Heart, Search, X } from "lucide-react";
import type { Category, Item, Source } from "../types";
import { useTrip } from "../components/TripContext";
import { IdeaRow } from "../components/ItemCard";
import { Button, Chip, ChipRow, EmptyState, Segmented, SourceBadge, cx, inputClass, sourceLabel } from "../components/ui";
import { CATEGORIES } from "../data/model";

type Status = "all" | "ideas" | "planned";
type Sort = "new" | "loved";

export function IdeasView() {
  const { data, openQuickAdd, members } = useTrip();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("ideas");
  const [city, setCity] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [lovedOnly, setLovedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("new");

  const sources = useMemo(() => [...new Set(data.items.map((i) => i.source))], [data.items]);
  const counts = useMemo(() => {
    const c = { all: data.items.length, ideas: 0, planned: 0 };
    data.items.forEach((i) => (i.day ? c.planned++ : c.ideas++));
    return c;
  }, [data.items]);

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const match = (i: Item) => {
      if (status === "ideas" && i.day) return false;
      if (status === "planned" && !i.day) return false;
      if (city && i.city !== city) return false;
      if (category && i.category !== category) return false;
      if (source && i.source !== source) return false;
      if (lovedOnly && !(i.likes?.length)) return false;
      if (words.length) {
        const hay = [i.title, i.notes, i.place, i.author, i.city].join(" ").toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    };
    const score = (i: Item) => (members.every((m) => i.likes?.includes(m)) ? 100 : 0) + (i.likes?.length ?? 0);
    return data.items
      .filter(match)
      .sort((a, b) => (sort === "loved" ? score(b) - score(a) || b.createdAt - a.createdAt : b.createdAt - a.createdAt));
  }, [data.items, q, status, city, category, source, lovedOnly, sort, members]);

  const filtered = !!(q || city || category || source || lovedOnly);
  const clear = () => {
    setQ("");
    setCity(null);
    setCategory(null);
    setSource(null);
    setLovedOnly(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Ideas</h1>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "ideas", label: `To plan · ${counts.ideas}` },
            { value: "planned", label: `Planned · ${counts.planned}` },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ideas, notes, places…"
          aria-label="Search"
          className={cx(inputClass, "h-11 rounded-full pl-11")}
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted">
            <X size={16} />
          </button>
        )}
      </div>

      <ChipRow>
        <Chip active={lovedOnly} onClick={() => setLovedOnly(!lovedOnly)}>
          <Heart size={14} fill={lovedOnly ? "currentColor" : "none"} /> Hearted
        </Chip>
        {data.trip.cities.map((c) => (
          <Chip key={c} active={city === c} onClick={() => setCity(city === c ? null : c)}>
            {c}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>
            <span aria-hidden>{c.emoji}</span> {c.label}
          </Chip>
        ))}
        {sources.length > 1 &&
          sources.map((s) => (
            <Chip key={s} active={source === s} onClick={() => setSource(source === s ? null : s)}>
              <SourceBadge source={s} size={16} /> {sourceLabel(s)}
            </Chip>
          ))}
      </ChipRow>

      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {list.length} {list.length === 1 ? "thing" : "things"}
          {filtered && (
            <button type="button" onClick={clear} className="ml-2 font-semibold text-accent">
              Clear filters
            </button>
          )}
        </span>
        <label className="inline-flex items-center gap-1.5">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg bg-transparent py-1 font-medium text-ink">
            <option value="new">Newest</option>
            <option value="loved">Most loved</option>
          </select>
        </label>
      </div>

      {list.length > 0 ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {list.map((i) => (
            <IdeaRow key={i.id} item={i} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState emoji="🗾" title="No ideas yet">
          Share a TikTok, YouTube video or Google Maps place to the app, paste a link, or tap + to type one.
          <div className="mt-4">
            <Button variant="primary" onClick={() => openQuickAdd()}>
              Add your first idea
            </Button>
          </div>
        </EmptyState>
      ) : (
        <EmptyState emoji="🔍" title="Nothing matches">
          {status === "ideas" && counts.ideas === 0 ? "Everything's been planned — nice work!" : "Try a different filter."}
        </EmptyState>
      )}
    </div>
  );
}
