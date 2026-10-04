import { CalendarPlus, Heart } from "lucide-react";
import type { Item } from "../types";
import { useTrip } from "./TripContext";
import { Avatar, SourceBadge, Thumb, avatarColor, cx } from "./ui";
import { categoryInfo } from "../data/model";

export function HeartButton({ item, className }: { item: Item; className?: string }) {
  const { backend, me, members, nameOf } = useTrip();
  const likes = item.likes ?? [];
  const mine = likes.includes(me);
  const everyone = members.length > 1 && members.every((m) => likes.includes(m));
  const who = likes.map((k) => nameOf(k)).join(" & ");
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        backend.setLike(item.id, !mine);
      }}
      aria-pressed={mine}
      aria-label={mine ? "Remove your heart" : "Heart this"}
      title={who ? `${who} want${likes.length === 1 ? "s" : ""} this` : "Heart this"}
      className={cx(
        "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2 text-sm font-semibold transition active:scale-90",
        mine || everyone ? "text-sakura" : "text-muted hover:text-sakura",
        everyone && "bg-sakura-soft",
        className,
      )}
    >
      <Heart size={19} fill={mine ? "currentColor" : "none"} strokeWidth={2.2} />
      {likes.length > 1 && <span>{likes.length}</span>}
    </button>
  );
}

export function LikeAvatars({ item }: { item: Item }) {
  const { members, nameOf } = useTrip();
  const likes = item.likes ?? [];
  if (likes.length === 0 || members.length < 2) return null;
  return (
    <span className="inline-flex -space-x-1.5">
      {likes.map((k) => (
        <Avatar key={k} name={nameOf(k)} color={avatarColor(k, members)} size={18} />
      ))}
    </span>
  );
}

export function IdeaRow({ item }: { item: Item }) {
  const { openItem, planItem, days } = useTrip();
  const cat = categoryInfo(item.category);
  const dayNo = item.day ? days.indexOf(item.day) + 1 : 0;
  return (
    <div className="flex gap-1 rounded-2xl border border-line bg-card p-2 transition hover:shadow-sm">
      <button type="button" onClick={() => openItem(item.id)} className="flex min-w-0 flex-1 gap-3 text-left">
        <div className="relative shrink-0">
          <Thumb src={item.thumb} category={item.category} className={cx("size-[76px] rounded-xl", item.done && "opacity-60")} />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className={cx("line-clamp-2 text-[15px] leading-snug font-medium", item.done && "text-muted line-through")}>{item.title}</div>
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <SourceBadge source={item.source} size={16} />
            <span className="truncate">
              {[item.city, `${cat.emoji} ${cat.label}`].filter(Boolean).join(" · ")}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <LikeAvatars item={item} />
            {item.notes && <span className="truncate text-xs text-muted italic">{item.notes.split("\n")[0]}</span>}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end justify-between">
        <HeartButton item={item} />
        {item.day ? (
          <button
            type="button"
            onClick={() => planItem(item.id)}
            className="rounded-full bg-ai-soft px-2.5 py-1 text-xs font-semibold text-ai"
            title="Change day"
          >
            {dayNo > 0 ? `Day ${dayNo}` : "Planned"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => planItem(item.id)}
            className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-accent hover:bg-accent-soft"
            aria-label="Add to a day"
          >
            <CalendarPlus size={16} /> Plan
          </button>
        )}
      </div>
    </div>
  );
}

export function IdeaTile({ item }: { item: Item }) {
  const { openItem } = useTrip();
  return (
    <button type="button" onClick={() => openItem(item.id)} className="w-36 shrink-0 text-left">
      <div className="relative">
        <Thumb src={item.thumb} category={item.category} className="aspect-[4/5] w-full rounded-2xl" />
        <span className="absolute top-2 left-2">
          <SourceBadge source={item.source} size={20} />
        </span>
      </div>
      <div className="mt-1.5 line-clamp-2 text-sm leading-snug font-medium">{item.title}</div>
      {item.city && <div className="text-xs text-muted">{item.city}</div>}
    </button>
  );
}
