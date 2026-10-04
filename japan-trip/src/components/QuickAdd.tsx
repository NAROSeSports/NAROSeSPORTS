import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardPaste, Heart, LoaderCircle } from "lucide-react";
import type { Category, Item } from "../types";
import { useTrip, type QuickAddInit } from "./TripContext";
import { Button, Chip, ChipRow, Label, Sheet, SourceBadge, Thumb, cx, inputClass, sourceLabel } from "./ui";
import { DaySelect } from "./DaySelect";
import { CATEGORIES, endOrder, orderForTime } from "../data/model";
import { cleanSharedText, detectSource, extractUrl, guessCategory, guessCity, normalizeUrl, tidyTitle } from "../lib/links";
import { captureThumb, fetchPreview, type LinkPreview } from "../lib/preview";
import { newId } from "../lib/id";
import { notify } from "../lib/notify";

export function QuickAdd({ init, onClose }: { init: QuickAddInit; onClose: () => void }) {
  const { data, backend, me, days, openItem } = useTrip();
  const cities = data.trip.cities;

  const sharedLink = init.url || extractUrl(init.text) || extractUrl(init.title);
  const sharedHuman = useMemo(
    () => cleanSharedText([init.title, init.text].filter(Boolean).join("\n"), sharedLink),
    [init.title, init.text, sharedLink],
  );
  const [firstLine, ...otherLines] = sharedHuman.split("\n");

  const [input, setInput] = useState(sharedLink ?? sharedHuman);
  const link = extractUrl(input);
  const source = detectSource(link);

  const [title, setTitle] = useState(sharedLink ? (firstLine ?? "") : "");
  const titleTouched = useRef(false);
  const [city, setCity] = useState<string | null>(null);
  const [cityTouched, setCityTouched] = useState(false);
  const [category, setCategory] = useState<Category>("other");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [day, setDay] = useState<string | null>(init.day ?? null);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [liked, setLiked] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [capturedThumb, setCapturedThumb] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const thumb = useRef<{ for: string; promise: Promise<string | null>; result?: string | null } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch title + thumbnail whenever the link changes.
  useEffect(() => {
    setPreview(null);
    setCapturedThumb(null);
    if (!link) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const p = await fetchPreview(link);
      if (cancelled) return;
      setLoading(false);
      setPreview(p);
      if (p?.title) setTitle((cur) => (titleTouched.current && cur ? cur : tidyTitle(p.title!)));
      if (p?.image && thumb.current?.for !== p.image) {
        const entry: NonNullable<typeof thumb.current> = { for: p.image, promise: captureThumb(p.image) };
        entry.promise.then((r) => {
          entry.result = r;
          if (r && thumb.current === entry) setCapturedThumb(r);
        });
        thumb.current = entry;
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setLoading(false);
    };
  }, [link]);

  const effectiveTitle = link ? title : input.split("\n")[0];
  // Guess from the raw caption too: hashtags like #kyoto #ramen are great hints.
  const guessText = [effectiveTitle, preview?.title, sharedHuman, preview?.description, preview?.place, preview?.author].filter(Boolean).join(" ");

  useEffect(() => {
    if (!cityTouched) setCity(guessCity(guessText, cities));
    if (!categoryTouched) setCategory(source === "maps" && guessCategory(guessText) === "other" ? "sight" : guessCategory(guessText));
  }, [guessText, cities, cityTouched, categoryTouched, source]);

  useEffect(() => {
    // Only grab the keyboard when opened by hand, not when something was shared in.
    if (!sharedLink && !sharedHuman) inputRef.current?.focus();
  }, [sharedLink, sharedHuman]);

  const duplicate = useMemo(() => {
    if (!link) return null;
    const key = normalizeUrl(link);
    return data.items.find((i) => i.url && normalizeUrl(i.url) === key) ?? null;
  }, [link, data.items]);

  const canSave = !!(link || input.trim());

  const save = () => {
    if (!canSave) return;
    const id = newId();
    const lines = input.trim().split("\n");
    const fallbackTitle = link ? preview?.title || `${sourceLabel(source)} ${source === "maps" ? "place" : "link"}` : lines[0];
    const extraNotes = link ? "" : lines.slice(1).join("\n");
    const place = preview?.place || (source === "maps" ? [firstLine, ...otherLines].filter(Boolean).join(", ") : "") || null;
    const captured = thumb.current?.result;
    const item: Item = {
      id,
      title: (link ? title.trim() : lines[0].trim()) || fallbackTitle,
      source,
      category,
      city,
      url: link,
      thumb: captured || preview?.image || null,
      author: preview?.author || null,
      notes: [extraNotes, notes.trim()].filter(Boolean).join("\n") || null,
      place,
      mapsUrl: source === "maps" ? link : null,
      day,
      time: day && time ? time : null,
      order: day ? (time ? orderForTime(data.items, day, time, id) : endOrder(data.items, day)) : undefined,
      likes: liked ? [me] : [],
      addedBy: me,
      createdAt: Date.now(),
    };
    backend.addItem(item);
    // If the thumbnail is still downloading, attach it when it's ready.
    if (!captured && thumb.current) {
      thumb.current.promise.then((dataUrl) => dataUrl && backend.updateItem(id, { thumb: dataUrl }));
    }
    const dayNo = day ? days.indexOf(day) + 1 : 0;
    notify(day ? `Added to Day ${dayNo}` : "Saved to ideas", { label: "View", run: () => openItem(id) });
    onClose();
    // Opened from the desktop bookmarklet popup: close it once saved.
    if (window.name === "japantrip" && window.opener) setTimeout(() => window.close(), 900);
  };

  const canPaste = typeof navigator !== "undefined" && !!navigator.clipboard?.readText;
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(text.trim());
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={sharedLink || sharedHuman ? "Save to your trip" : "Add an idea"}
      footer={
        <Button variant="primary" className="w-full" disabled={!canSave} onClick={save}>
          {day ? "Add to plan" : "Save idea"}
        </Button>
      }
    >
      <div
        className="space-y-5"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
        }}
      >
        <div>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={link ? 1 : 2}
              placeholder="Paste a TikTok, YouTube or Maps link — or just type an idea"
              aria-label="Link or idea"
              className={cx(inputClass, "resize-none pr-24", link && "text-sm text-muted")}
            />
            {canPaste && (
              <button
                type="button"
                onClick={paste}
                className="absolute top-2 right-2 inline-flex h-8 items-center gap-1 rounded-full bg-sunken px-3 text-xs font-semibold text-ink hover:bg-line"
              >
                <ClipboardPaste size={14} /> Paste
              </button>
            )}
          </div>
        </div>

        {link && (
          <div className="flex gap-3">
            <div className="relative shrink-0">
              <Thumb src={capturedThumb ?? preview?.image} category={category} className="size-24 rounded-2xl" />
              <span className="absolute -right-1.5 -bottom-1.5 rounded-md ring-2 ring-paper">
                <SourceBadge source={source} size={22} />
              </span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/25 text-white">
                  <LoaderCircle className="animate-spin" size={22} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <textarea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  titleTouched.current = true;
                }}
                rows={2}
                placeholder={loading ? "Getting the title…" : "Give it a name"}
                aria-label="Title"
                className={cx(inputClass, "resize-none py-2 font-medium")}
              />
              {(preview?.author || preview?.siteName) && (
                <div className="mt-1 truncate text-xs text-muted">
                  {[preview?.author, preview?.siteName].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>
        )}

        {duplicate && (
          <div className="flex items-center gap-3 rounded-2xl bg-ai-soft px-4 py-3 text-sm text-ai">
            <span className="flex-1">
              Already saved: <strong>{duplicate.title}</strong>
            </span>
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                onClose();
                setTimeout(() => openItem(duplicate.id), 50);
              }}
            >
              Open
            </button>
          </div>
        )}

        <div>
          <Label>City</Label>
          <ChipRow>
            {cities.map((c) => (
              <Chip
                key={c}
                active={city === c}
                onClick={() => {
                  setCity(city === c ? null : c);
                  setCityTouched(true);
                }}
              >
                {c}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div>
          <Label>Type</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => {
                  setCategory(c.id);
                  setCategoryTouched(true);
                }}
              >
                <span aria-hidden>{c.emoji}</span> {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label>When</Label>
          <div className="flex gap-2">
            <DaySelect value={day} onChange={setDay} preferCity={city} className="flex-1" />
            {day && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Time"
                className={cx(inputClass, "w-36 shrink-0")}
              />
            )}
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opening hours, what to order, need to book…"
            className={cx(inputClass, "min-h-18 resize-none")}
          />
        </div>

        <button
          type="button"
          onClick={() => setLiked(!liked)}
          aria-pressed={liked}
          className={cx(
            "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] transition",
            liked ? "border-sakura bg-sakura-soft text-sakura" : "border-line bg-card text-ink",
          )}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
          <span className="font-medium">{liked ? "You really want to do this" : "Mark as a must-do for you"}</span>
        </button>
      </div>
    </Sheet>
  );
}
