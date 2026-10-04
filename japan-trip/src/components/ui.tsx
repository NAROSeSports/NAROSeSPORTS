import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Globe, MapPin, StickyNote, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { Category, Source } from "../types";
import { categoryInfo } from "../data/model";
import { useBackToClose } from "../lib/hooks";

/** Joins class names; later Tailwind classes win over conflicting earlier ones (e.g. w-32 over w-full). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(" "));
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none",
        size === "md" ? "h-11 px-5 text-[15px]" : "h-9 px-3.5 text-sm",
        variant === "primary" && "bg-accent text-accent-ink hover:bg-accent-strong shadow-sm",
        variant === "secondary" && "bg-card text-ink border border-line hover:bg-sunken",
        variant === "ghost" && "text-ink hover:bg-sunken",
        variant === "danger" && "text-accent hover:bg-accent-soft",
        className,
      )}
    />
  );
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-sunken hover:text-ink active:scale-95 disabled:opacity-30",
        className,
      )}
    />
  );
}

export function Chip({ active, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...props}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition active:scale-95",
        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:bg-sunken",
        className,
      )}
    />
  );
}

export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5", className)}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{children}</div>;
}

export const inputClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none";

/** Text input that keeps its own draft and saves on blur / Enter / unmount, so remote updates don't fight your typing. */
export function EditableText({
  value,
  onSave,
  placeholder,
  multiline,
  className,
  ariaLabel,
  rows = 3,
  wrap,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  /** Single-line value that wraps onto several lines; Enter saves instead of adding a newline. */
  wrap?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const latest = useRef({ draft, value, onSave });
  latest.current = { draft, value, onSave };

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  useEffect(
    () => () => {
      const { draft: d, value: v, onSave: save } = latest.current;
      if (d !== v) save(d);
    },
    [],
  );

  const commit = () => {
    focused.current = false;
    if (draft !== value) onSave(draft.trim());
  };
  const common = {
    value: draft,
    placeholder,
    "aria-label": ariaLabel ?? placeholder,
    onFocus: () => (focused.current = true),
    onBlur: commit,
    className: cx(inputClass, className),
  };
  if (wrap) {
    return (
      <textarea
        {...common}
        rows={1}
        onChange={(e) => setDraft(e.target.value.replace(/\n/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        className={cx(common.className, "resize-none")}
      />
    );
  }
  return multiline ? (
    <textarea {...common} rows={rows} onChange={(e) => setDraft(e.target.value)} />
  ) : (
    <input
      {...common}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** Bottom sheet on phones, centred dialog on larger screens. Android Back closes it. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useBackToClose(open, onClose);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          "relative flex max-h-[92dvh] w-full animate-sheet-up flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl sm:rounded-3xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line sm:hidden" />
        {title !== undefined && (
          <div className="flex items-center gap-2 px-5 pt-3 pb-2">
            <h2 className="min-w-0 flex-1 font-display text-xl font-bold">{title}</h2>
            <IconButton label="Close" onClick={onClose} className="-mr-2">
              <X size={20} />
            </IconButton>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line bg-paper px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

const SOURCE_LABEL: Record<Source, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  maps: "Google Maps",
  web: "Web",
  note: "Note",
};

export const sourceLabel = (s: Source) => SOURCE_LABEL[s];

export function SourceBadge({ source, size = 20 }: { source: Source; size?: number }) {
  const s = { width: size, height: size };
  const label = SOURCE_LABEL[source];
  switch (source) {
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" style={s} role="img" aria-label={label}>
          <rect width="24" height="24" rx="6" fill="#111" />
          <path d="M14.2 5.5c.4 1.6 1.6 2.8 3.3 3v2.3c-1.2 0-2.3-.4-3.3-1v4.7a4.2 4.2 0 1 1-4.2-4.2h.5v2.4a1.9 1.9 0 1 0 1.4 1.8V5.5h2.3Z" fill="#25F4EE" transform="translate(-0.6 -0.4)" />
          <path d="M14.2 5.5c.4 1.6 1.6 2.8 3.3 3v2.3c-1.2 0-2.3-.4-3.3-1v4.7a4.2 4.2 0 1 1-4.2-4.2h.5v2.4a1.9 1.9 0 1 0 1.4 1.8V5.5h2.3Z" fill="#FE2C55" transform="translate(0.6 0.4)" />
          <path d="M14.2 5.5c.4 1.6 1.6 2.8 3.3 3v2.3c-1.2 0-2.3-.4-3.3-1v4.7a4.2 4.2 0 1 1-4.2-4.2h.5v2.4a1.9 1.9 0 1 0 1.4 1.8V5.5h2.3Z" fill="#fff" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" style={s} role="img" aria-label={label}>
          <rect width="24" height="24" rx="6" fill="#FF0033" />
          <path d="M9.5 8v8l7-4-7-4Z" fill="#fff" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" style={s} role="img" aria-label={label}>
          <defs>
            <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FEDA75" />
              <stop offset=".35" stopColor="#FA7E1E" />
              <stop offset=".6" stopColor="#D62976" />
              <stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig)" />
          <rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.8" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="15.6" cy="8.4" r=".9" fill="#fff" />
        </svg>
      );
    case "maps":
      return (
        <span style={s} className="inline-flex items-center justify-center rounded-md bg-white text-[#EA4335] ring-1 ring-black/10" aria-label={label}>
          <MapPin size={size * 0.72} strokeWidth={2.5} />
        </span>
      );
    case "web":
      return (
        <span style={s} className="inline-flex items-center justify-center rounded-md bg-ai-soft text-ai" aria-label={label}>
          <Globe size={size * 0.68} />
        </span>
      );
    default:
      return (
        <span style={s} className="inline-flex items-center justify-center rounded-md bg-sunken text-muted" aria-label={label}>
          <StickyNote size={size * 0.68} />
        </span>
      );
  }
}

const CATEGORY_TINT: Record<Category, string> = {
  food: "bg-[#f6dfc9] dark:bg-[#3a2a1c]",
  sight: "bg-[#f3d6cf] dark:bg-[#3a201b]",
  activity: "bg-[#dde6f2] dark:bg-[#1f2838]",
  shopping: "bg-[#efdcea] dark:bg-[#33202f]",
  nightlife: "bg-[#ddd9ef] dark:bg-[#25213a]",
  stay: "bg-[#dcebdf] dark:bg-[#1d2e22]",
  transport: "bg-[#e3e3e0] dark:bg-[#2a2a28]",
  other: "bg-sunken",
};

export function Thumb({ src, category, className }: { src?: string | null; category: Category; className?: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (src && !broken) {
    return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cx("object-cover", className)} />;
  }
  return (
    <div className={cx("flex items-center justify-center", CATEGORY_TINT[category], className)}>
      <span className="text-2xl" aria-hidden>
        {categoryInfo(category).emoji}
      </span>
    </div>
  );
}

const AVATAR_COLORS = ["bg-sakura text-white", "bg-ai text-white dark:text-[#10131a]", "bg-matcha text-white", "bg-accent text-accent-ink"];

export function avatarColor(key: string, members: string[]): string {
  const idx = members.indexOf(key);
  if (idx >= 0) return AVATAR_COLORS[idx % AVATAR_COLORS.length];
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function Avatar({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  return (
    <span
      title={name}
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-card", color)}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-5xl">{emoji}</div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {children && <div className="mt-2 max-w-sm text-[15px] text-muted">{children}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("inline-flex rounded-full bg-sunken p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "h-8 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition",
            value === o.value ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
