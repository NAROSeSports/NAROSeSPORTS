# 🇯🇵 Japan Trip Planner

A shared trip-planning app for two. Save things you find on TikTok, YouTube, Instagram, Google Maps or anywhere on the web, then drag them into a day-by-day plan together.

- **Save from any app on your phone**: in TikTok, YouTube, Instagram, Google Maps or Chrome, tap **Share → Japan Trip**. The title and thumbnail fill in automatically, and the city and type (food, sights, shopping…) are guessed for you.
- **On the computer**: press <kbd>Ctrl</kbd>+<kbd>V</kbd> anywhere in the app to add a link, or use the **+ Japan Trip** bookmark button (Settings → Adding from anywhere).
- **Ideas**: everything you've saved, with search and filters by city, type and source. ❤️ things you want to do. When you've both hearted something, it shows under *You both want these*.
- **Plan**: one card per day of the trip. Set the city for each day, add ideas (ideas from that day's city are listed first), set times, reorder, tick things off as you go, and open the day's route in Google Maps.
- **Lists**: a shared to-do list and packing list, with suggested Japan to-dos to start you off.
- **Works offline**: it opens without signal and syncs your changes when you're back online.
- **Installable**: it works as a home-screen app on Android and as an app on Windows/Mac (Chrome or Edge), and it also runs in any browser.

---

## 1. Put it online (Cloudflare, free, ~5 minutes)

The app lives in the `japan-trip/` folder of this repo and runs on Cloudflare Workers (free plan, no card needed). Every push to GitHub redeploys it automatically.

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (free).
2. Go to **Workers & Pages → Create application → Import a repository**, connect GitHub, and pick this repository.
3. Fill in the settings:
   - **Project / Worker name:** `japan-trip`. This must match `name` in `wrangler.jsonc`.
   - **Root directory** (may be under *Advanced settings* and called *Path*): `japan-trip`
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (the default)
4. Click **Deploy**. Your app's address will look like `https://japan-trip.<your-name>.workers.dev`.

> Cloudflare publishes the repo's **main** branch as the live site. If this code is still on another branch, merge it into `main` first.

At this point the app works, but **everything is saved only on the device you're using**. To share one trip between both of your phones and your computer, do step 2.

## 2. Turn on syncing so you can both use it (Firebase, free, ~10 minutes)

Firebase handles Google sign-in and the shared database. The free "Spark" plan is far more than you'll need.

1. **Create a project.** Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Create a project**. Call it `japan-trip`. You can turn Google Analytics off.
2. **Turn on Google sign-in.** Go to **Build → Authentication → Get started → Sign-in method → Google**, switch it on, pick your email as the support email, and save.
3. **Allow your app's address.** Still in Authentication, open **Settings → Authorized domains → Add domain** and add your app's domain, e.g. `japan-trip.yourname.workers.dev` (no `https://`).
4. **Create the database.** Go to **Build → Firestore Database → Create database**. Choose the *Standard* edition if asked, pick the location closest to you, and start in **production mode**.
5. **Add the security rules.** In Firestore open the **Rules** tab, replace everything with the contents of [`firestore.rules`](./firestore.rules), and click **Publish**. These rules mean only people you invite can see your trip.
6. **Get the web config.** Open ⚙️ **Project settings → General → Your apps** and click the **`</>`** (Web) icon. Register an app called "Japan Trip" (you don't need Firebase Hosting). Copy the `firebaseConfig = { … }` block it shows you.
7. **Give the config to the app**, using either option:
   - **Easiest:** paste it into the chat with Claude and ask for it to be added. Or paste the object into `src/config.ts` yourself (replace `null`), then commit and push. Cloudflare redeploys automatically.
   - **Or in Cloudflare:** open your Worker's **Settings → Build → Variables and secrets**, add a *build* variable `VITE_FIREBASE_CONFIG`, paste the whole `{ apiKey: "…", … }` block as the value, then trigger a new deploy (for example by pushing any change).

   This config is **not** a secret. It's meant to be public, and the rules from step 5 are what protect your data.
8. Open the app. It now asks you to **Sign in with Google**. Tap **Start our trip**. Anything you'd already saved on that device can be brought along.
9. **Invite your partner:** go to **Settings → People → Invite someone** and enter their Gmail address. When they open the app and sign in with that account, the trip opens for them automatically.

**Optional extra lock:** in `firestore.rules` you can restrict who is allowed to *create* trips to just your two emails (see the `canCreateTrips` comment), then publish the rules again.

## 3. Install it on your Pixels

1. Open your app's address in **Chrome**.
2. Tap **⋮ → Add to Home screen → Install** (or use the *Install app* button on the app's Home screen). You need the full install, not just a shortcut, for the share button to work.
3. Done. **Japan Trip** now shows up in Android's share sheet.

### Saving things

| From | How |
| --- | --- |
| **TikTok** | Share arrow → swipe the bottom row to **More** (⋯) → **Japan Trip** |
| **YouTube** | Share → **Japan Trip** (tap *More* if it isn't in the first row) |
| **Instagram** | Paper plane → **Share to…** / **More** → **Japan Trip** |
| **Google Maps** | Open a place → **Share** → **Japan Trip** (saves the name, address and map link) |
| **Chrome / Google search** | ⋮ → **Share** → **Japan Trip** |
| **Computer** | Copy a link, then press <kbd>Ctrl</kbd>+<kbd>V</kbd> in the app, or drag the **+ Japan Trip** bookmark from Settings to your bookmarks bar |

Tip: in Android's share sheet you can long-press **Japan Trip** and choose **Pin** to keep it at the top.

**On a computer:** open the app in Chrome or Edge and click the install icon in the address bar to get it as a desktop app (optional).

---

## How it works

- `src/`: the app (React + TypeScript + Tailwind). It uses hash-based pages, so it works on any static host.
- `worker/`: a small Cloudflare Worker. It serves the app and answers `/api/preview`, which reads link titles and thumbnails. It resolves TikTok and Google Maps short links and reads YouTube/TikTok oEmbed and Open Graph tags. Browsers can't read those sites directly, so this runs on the server. Thumbnails are shrunk to about 15 KB and stored with each idea, so they still show offline and don't break when TikTok's image links expire.
- `public/manifest.webmanifest`: makes the app installable and registers it in Android's share sheet (`share_target`).
- `public/sw.js`: the service worker that caches the app so it opens offline.
- `src/data/local.ts`: the "this device only" mode, stored in IndexedDB.
- `src/data/cloud.ts`: the shared mode, using Firebase Auth and Firestore with offline persistence.
- `firestore.rules`: who can read and write what.

## Developing

```bash
cd japan-trip
npm install
npm run dev        # http://localhost:5173 (link previews work locally too)
npm test           # unit tests
npm run build      # type-check + production build into dist/
npm run preview    # build, then run it in Cloudflare's local Worker runtime
npm run deploy     # deploy by hand from your computer (asks you to log in to Cloudflare)
```

To test syncing locally without a real Firebase project, run the Firebase emulators (`npx firebase-tools emulators:start --only auth,firestore --project demo-japan-trip` from this folder) and start the app with:

```bash
VITE_FIREBASE_EMULATORS=1 VITE_FIREBASE_CONFIG='{"apiKey":"demo","authDomain":"demo-japan-trip.firebaseapp.com","projectId":"demo-japan-trip","appId":"demo"}' npm run dev
```

## Troubleshooting

- **"Japan Trip" isn't in the share sheet**: the app has to be *installed* from Chrome (⋮ → Add to Home screen → **Install**), not added as a bookmark shortcut. After installing, it can take a minute to appear.
- **Sign-in popup does nothing inside the installed app**: sign in once in normal Chrome at the same address. The installed app shares Chrome's sign-in, so it'll be signed in too.
- **"Missing or insufficient permissions"**: the Firestore rules from step 2.5 haven't been published yet.
- **Sign-in says the domain isn't authorized**: add your `…workers.dev` domain in Firebase → Authentication → Settings → Authorized domains.
- **Cloudflare build fails with a name mismatch**: the Worker's name in the dashboard must be `japan-trip`, or change `name` in `wrangler.jsonc` to match.
- **A link has no title or picture**: some sites (Instagram especially) hide this from apps. Just type a title; the link still opens the post. In the idea's details, the ↻ button next to the link tries the preview again.
