import { useEffect, useState } from "react";
import { onToast, type Toast } from "../lib/notify";
import { cx } from "./ui";

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(
    () =>
      onToast((t) => {
        setToasts((all) => [...all.filter((x) => x.message !== t.message).slice(-2), t]);
        setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), t.tone === "error" ? 7000 : 3500);
      }),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "pointer-events-auto flex max-w-md animate-toast-in items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg",
            t.tone === "error" ? "bg-accent text-accent-ink" : "bg-ink text-paper",
          )}
        >
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="-my-1 rounded-full px-2 py-1 font-semibold underline-offset-2 hover:underline"
              onClick={() => {
                t.action?.run();
                setToasts((all) => all.filter((x) => x.id !== t.id));
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
