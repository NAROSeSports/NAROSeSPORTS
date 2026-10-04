import { Lightbulb } from "lucide-react";
import { useTrip } from "./TripContext";
import { Sheet, cx } from "./ui";
import { TripDates } from "./TripDates";
import { dayItems, endOrder, orderForTime } from "../data/model";
import { formatDay } from "../lib/dates";
import { notify } from "../lib/notify";

/** "Which day shall we do this?" — quick way to move an idea into the plan. */
export function DayPickerSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, days, backend } = useTrip();
  const item = data.items.find((i) => i.id === id);
  if (!item) return null;

  const choose = (day: string | null) => {
    if (day !== item.day) {
      const order = day ? (item.time ? orderForTime(data.items, day, item.time, item.id) : endOrder(data.items, day)) : undefined;
      backend.updateItem(item.id, { day, order, done: false });
      notify(day ? `Added to Day ${days.indexOf(day) + 1}` : "Moved back to ideas");
    }
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title="Which day?">
      <p className="-mt-1 mb-4 line-clamp-2 text-sm text-muted">{item.title}</p>
      {days.length === 0 ? (
        <div className="space-y-3">
          <p className="text-[15px]">First, when are you going?</p>
          <TripDates />
        </div>
      ) : (
        <div className="space-y-1.5">
          {item.day && (
            <button
              type="button"
              onClick={() => choose(null)}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-left text-[15px] hover:bg-sunken"
            >
              <Lightbulb size={18} className="text-muted" /> Back to ideas (unplan)
            </button>
          )}
          {days.map((d, i) => {
            const city = data.trip.days?.[d]?.city;
            const count = dayItems(data.items, d).length;
            const match = !!item.city && city === item.city;
            const current = item.day === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => choose(d)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition hover:bg-sunken",
                  current ? "border-ink bg-sunken" : match ? "border-accent/40 bg-accent-soft/50" : "border-line bg-card",
                )}
              >
                <span className="w-12 shrink-0 font-display text-lg font-bold text-accent">D{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{formatDay(d, { weekday: "long", day: "numeric", month: "short" })}</span>
                  <span className="block truncate text-xs text-muted">
                    {[city ?? "No city set", count ? `${count} planned` : "Free day"].join(" · ")}
                  </span>
                </span>
                {match && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink">{city}</span>}
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
