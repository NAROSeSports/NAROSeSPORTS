// Tiny event bus so any module (including the data layer) can show a toast.

export interface Toast {
  id: number;
  message: string;
  tone: "info" | "error";
  action?: { label: string; run: () => void };
}

type Listener = (toast: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function onToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify(message: string, action?: Toast["action"]): void {
  const toast: Toast = { id: nextId++, message, tone: "info", action };
  listeners.forEach((l) => l(toast));
}

export function reportError(err: unknown, context = "Something went wrong"): void {
  console.error(context, err);
  const detail = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const toast: Toast = { id: nextId++, message: detail ? `${context}: ${detail}` : context, tone: "error" };
  listeners.forEach((l) => l(toast));
}
