// Things shared into the app from Android's share sheet (manifest share_target),
// the desktop bookmarklet, or the "Add idea" app shortcut arrive as URL params.

export interface SharedInput {
  title?: string;
  text?: string;
  url?: string;
}

const KEY = "pending-share";

/** Reads share params from the URL once at startup, cleans the URL, and remembers them. */
export function captureShareFromUrl(): void {
  const params = new URLSearchParams(location.search);
  const shared: SharedInput = {
    title: params.get("title") ?? undefined,
    text: params.get("text") ?? undefined,
    url: params.get("url") ?? undefined,
  };
  const isAdd = location.hash.startsWith("#/add");
  if (shared.title || shared.text || shared.url || isAdd) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(shared));
    } catch {
      /* private mode: share still works for this page load via memory below */
    }
    memory = shared;
    history.replaceState(null, "", `${location.pathname}#/ideas`);
  }
}

let memory: SharedInput | null = null;

/** Returns (and forgets) whatever was shared, if anything. */
export function takePendingShare(): SharedInput | null {
  let shared = memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) shared = JSON.parse(raw) as SharedInput;
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  memory = null;
  return shared;
}
