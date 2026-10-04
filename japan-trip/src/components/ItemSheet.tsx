import { useEffect, useState } from "react";
import { CircleCheck, ExternalLink, MapPin, RefreshCw, Trash2 } from "lucide-react";
import type { Item } from "../types";
import { useTrip } from "./TripContext";
import { Button, Chip, ChipRow, EditableText, Label, Sheet, SourceBadge, Thumb, cx, inputClass, sourceLabel } from "./ui";
import { HeartButton, LikeAvatars } from "./ItemCard";
import { DaySelect } from "./DaySelect";
import { CATEGORIES, categoryInfo, endOrder, orderForTime } from "../data/model";
import { itemMapsUrl } from "../lib/links";
import { captureThumb, fetchPreview } from "../lib/preview";
import { notify } from "../lib/notify";

export function ItemSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, backend, nameOf } = useTrip();
  const item = data.items.find((i) => i.id === id);

  // Closed if someone else deletes it while it's open.
  useEffect(() => {
    if (!item) onClose();
  }, [item, onClose]);
  if (!item) return null;

  const update = (patch: Partial<Item>) => backend.updateItem(item.id, patch);

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <span className="text-base font-semibold text-muted">
          {categoryInfo(item.category).emoji} {[item.city, categoryInfo(item.category).label].filter(Boolean).join(" · ")}
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm(`Delete "${item.title}"?`)) {
                backend.deleteItem(item.id);
                onClose();
                notify("Deleted");
              }
            }}
          >
            <Trash2 size={16} /> Delete
          </Button>
          <span className="truncate text-xs text-muted">
            Added by {nameOf(item.addedBy)} · {new Date(item.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </span>
        </div>
      }
    >
      <ItemDetails item={item} update={update} />
    </Sheet>
  );
}

function ItemDetails({ item, update }: { item: Item; update: (patch: Partial<Item>) => void }) {
  const { data, days } = useTrip();
  const [refreshing, setRefreshing] = useState(false);

  const setDay = (day: string | null) => {
    if (day === (item.day ?? null)) return;
    const order = day ? (item.time ? orderForTime(data.items, day, item.time, item.id) : endOrder(data.items, day)) : undefined;
    update({ day, order, done: day ? item.done : false });
    if (day) notify(`Moved to Day ${days.indexOf(day) + 1}`);
  };
  const setTime = (time: string) => {
    const patch: Partial<Item> = { time: time || null };
    if (item.day && time) patch.order = orderForTime(data.items, item.day, time, item.id);
    update(patch);
  };

  const refresh = async () => {
    if (!item.url) return;
    setRefreshing(true);
    const p = await fetchPreview(item.url);
    const thumb = p?.image ? (await captureThumb(p.image)) ?? p.image : null;
    setRefreshing(false);
    if (!p) return notify("Couldn't load a preview for that link");
    update({
      thumb: thumb ?? item.thumb ?? null,
      author: p.author ?? item.author ?? null,
      place: item.place || p.place || null,
    });
    notify("Preview updated");
  };

  return (
    <div className="space-y-5">
      {item.thumb && (
        <div className="relative">
          <Thumb src={item.thumb} category={item.category} className="h-56 w-full rounded-2xl sm:h-64" />
          <span className="absolute bottom-3 left-3">
            <SourceBadge source={item.source} size={26} />
          </span>
        </div>
      )}

      <div>
        <EditableText
          value={item.title}
          onSave={(title) => title && update({ title })}
          ariaLabel="Title"
          wrap
          className="resize-none border-transparent bg-transparent px-0 py-1 font-display text-xl leading-snug font-bold focus:border-line focus:bg-card focus:px-3"
        />
        {item.author && <div className="text-sm text-muted">by {item.author}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-paper"
          >
            <ExternalLink size={16} /> Open {item.source === "web" ? "link" : `in ${sourceLabel(item.source)}`}
          </a>
        )}
        {item.source !== "maps" && (
          <a
            href={itemMapsUrl(item)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-medium"
          >
            <MapPin size={16} /> Maps
          </a>
        )}
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-card pr-3 pl-1">
          <HeartButton item={item} />
          <LikeAvatars item={item} />
        </span>
        {item.day && (
          <button
            type="button"
            onClick={() => update({ done: !item.done })}
            className={cx(
              "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
              item.done ? "bg-matcha text-white dark:text-black" : "border border-line bg-card",
            )}
          >
            <CircleCheck size={16} /> {item.done ? "Done!" : "Mark done"}
          </button>
        )}
      </div>

      <div>
        <Label>When</Label>
        <div className="flex gap-2">
          <DaySelect value={item.day} onChange={setDay} preferCity={item.city} className="min-w-0 flex-1" />
          {item.day && (
            <input
              type="time"
              value={item.time ?? ""}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Time"
              className={cx(inputClass, "w-36 shrink-0")}
            />
          )}
        </div>
      </div>

      <div>
        <Label>City</Label>
        <ChipRow>
          {data.trip.cities.map((c) => (
            <Chip key={c} active={item.city === c} onClick={() => update({ city: item.city === c ? null : c })}>
              {c}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div>
        <Label>Type</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={item.category === c.id} onClick={() => update({ category: c.id })}>
              <span aria-hidden>{c.emoji}</span> {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <EditableText value={item.notes ?? ""} onSave={(notes) => update({ notes: notes || null })} placeholder="What to order, opening hours, tips…" multiline className="min-h-20 resize-y" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Place / address</Label>
          <EditableText value={item.place ?? ""} onSave={(place) => update({ place: place || null })} placeholder="Used for Google Maps" />
        </div>
        <div>
          <Label>Booking ref</Label>
          <EditableText value={item.booking ?? ""} onSave={(booking) => update({ booking: booking || null })} placeholder="Confirmation number" />
        </div>
      </div>

      <div>
        <Label>Link</Label>
        <div className="flex gap-2">
          <EditableText value={item.url ?? ""} onSave={(url) => update({ url: url || null })} placeholder="https://…" className="min-w-0 text-sm" />
          {item.url && (
            <Button size="sm" className="h-auto shrink-0" onClick={refresh} disabled={refreshing} aria-label="Refresh preview">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
