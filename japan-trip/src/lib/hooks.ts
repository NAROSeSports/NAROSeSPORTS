import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canInstall, onInstallChange } from "./install";

export type Tab = "home" | "ideas" | "plan" | "lists" | "settings";
const TABS: Tab[] = ["home", "ideas", "plan", "lists", "settings"];

function readTab(): Tab {
  const t = location.hash.replace(/^#\/?/, "").split(/[/?]/)[0] as Tab;
  return TABS.includes(t) ? t : "home";
}

/** Hash-based tabs (works on any static host). Tab switches replace history so Back exits the app. */
export function useTab(): [Tab, (t: Tab) => void] {
  const [tab, setTab] = useState<Tab>(readTab);
  useEffect(() => {
    const onHash = () => setTab(readTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = useCallback((t: Tab) => {
    history.replaceState(null, "", `#/${t}`);
    setTab(t);
    window.scrollTo({ top: 0 });
  }, []);
  return [tab, go];
}

// --- Android back button closes the top-most sheet instead of leaving the app. ---
const stack: Array<() => void> = [];
let ignorePops = 0;
window.addEventListener("popstate", () => {
  if (ignorePops > 0) {
    ignorePops--;
    return;
  }
  stack.pop()?.();
});

export function useBackToClose(open: boolean, onClose: () => void): void {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!open) return;
    let closedByBack = false;
    const entry = () => {
      closedByBack = true;
      ref.current();
    };
    stack.push(entry);
    history.pushState({ sheet: stack.length }, "");
    return () => {
      const i = stack.indexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      if (!closedByBack) {
        ignorePops++;
        history.back();
      }
    };
  }, [open]);
}

export function useCanInstall(): boolean {
  return useSyncExternalStore(onInstallChange, canInstall);
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
  );
}
