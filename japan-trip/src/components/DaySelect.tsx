import { useTrip } from "./TripContext";
import { cx, inputClass } from "./ui";
import { formatDay } from "../lib/dates";

/** Native select of trip days (great on Android), with "just an idea" as the first option. */
export function DaySelect({
  value,
  onChange,
  preferCity,
  className,
}: {
  value: string | null | undefined;
  onChange: (day: string | null) => void;
  preferCity?: string | null;
  className?: string;
}) {
  const { days, data } = useTrip();
  if (days.length === 0) {
    return (
      <div className={cx("rounded-xl bg-sunken px-3.5 py-2.5 text-sm text-muted", className)}>
        Add your trip dates on the Plan tab to schedule things.
      </div>
    );
  }
  const outside = value && !days.includes(value);
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Day"
      className={cx(inputClass, "appearance-auto", className)}
    >
      <option value="">💡 Just an idea for now</option>
      {outside && <option value={value}>{formatDay(value)} (outside trip dates)</option>}
      {days.map((d, i) => {
        const city = data.trip.days?.[d]?.city;
        const match = preferCity && city === preferCity ? " ★" : "";
        return (
          <option key={d} value={d}>
            {`Day ${i + 1} · ${formatDay(d)}${city ? ` · ${city}` : ""}${match}`}
          </option>
        );
      })}
    </select>
  );
}
