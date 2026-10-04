import { useEffect, useState } from "react";
import type { Backend } from "./types";
import { firebaseConfig } from "./config";
import { createLocalBackend } from "./data/local";
import { Planner, Splash } from "./components/Planner";
import { CloudGate } from "./components/CloudGate";

export function App() {
  return firebaseConfig ? <CloudGate config={firebaseConfig} /> : <LocalApp />;
}

function LocalApp() {
  const [backend, setBackend] = useState<Backend | null>(null);
  useEffect(() => {
    createLocalBackend().then(setBackend);
  }, []);
  return backend ? <Planner backend={backend} account={null} /> : <Splash />;
}
