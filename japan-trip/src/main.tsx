import { createRoot } from "react-dom/client";
import { App } from "./App";
import { captureShareFromUrl } from "./lib/share";
import { listenForInstallPrompt } from "./lib/install";
import "./index.css";

captureShareFromUrl();
listenForInstallPrompt();

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("Service worker failed", err));
  });
}
// Ask the browser not to clear our offline data when space is low.
navigator.storage?.persist?.().catch(() => {});
