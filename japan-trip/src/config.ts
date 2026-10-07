import type { FirebaseOptions } from "firebase/app";

/**
 * Firebase settings that turn on syncing between your phones and computers.
 *
 * Paste the `firebaseConfig` object from the Firebase console here
 * (README → "Turn on syncing"), or set a VITE_FIREBASE_CONFIG build
 * variable on Cloudflare containing the same thing. Leave as null to keep
 * everything on this device only.
 *
 * These values are not secret: access is controlled by the Firestore rules.
 */
const FIREBASE_CONFIG: FirebaseOptions | null = null;

/** Accepts JSON or the JS object literal the Firebase console shows. */
function parseLoose(text: string | undefined): FirebaseOptions | null {
  if (!text) return null;
  const out: Record<string, string> = {};
  for (const m of text.matchAll(/(\w+)["']?\s*:\s*["']([^"']+)["']/g)) out[m[1]] = m[2];
  return out.apiKey && out.projectId ? (out as FirebaseOptions) : null;
}

export const firebaseConfig: FirebaseOptions | null =
  FIREBASE_CONFIG ?? parseLoose(import.meta.env.VITE_FIREBASE_CONFIG as string | undefined);
