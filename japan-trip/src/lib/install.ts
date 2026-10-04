// Captures Chrome's install prompt so the app can offer an "Install" button.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function listenForInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function canInstall(): boolean {
  return deferred !== null;
}

export function onInstallChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function promptInstall(): Promise<void> {
  if (!deferred) return;
  await deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  listeners.forEach((l) => l());
}

export function isInstalled(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches;
}
