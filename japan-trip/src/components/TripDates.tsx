import { useTrip } from "./TripContext";
import { cx, inputClass } from "./ui";
import { addDays } from "../lib/dates";

/** Start/end date pickers that save as you change them. */
export function TripDates({ className }: { className?: string }) {
  const { data, backend } = useTrip();
  const { start, end } = data.trip;
  return (
    <div className={cx("grid grid-cols-2 gap-3", className)}>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">Fly out</span>
        <input
          type="date"
          value={start ?? ""}
          onChange={(e) => {
            const s = e.target.value || null;
            // Keep the end date sensible when the start moves.
            const newEnd = s && (!end || end < s) ? addDays(s, 13) : end;
            backend.updateTrip({ start: s, end: s ? newEnd : end });
          }}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">Fly home</span>
        <input
          type="date"
          value={end ?? ""}
          min={start ?? undefined}
          onChange={(e) => backend.updateTrip({ end: e.target.value || null })}
          className={inputClass}
        />
      </label>
    </div>
  );
}
