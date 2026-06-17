# Sprite Collection — install as an app

You have a complete Progressive Web App (PWA). Once it's hosted on HTTPS, it installs to your phone or computer with its own icon, opens without browser chrome, and works offline.

## The files (keep them all together)

These eight files must sit in the **same folder / same root** — the app uses relative paths, so don't put them in subfolders:

- `index.html` — the app
- `manifest.webmanifest` — tells the OS it's installable
- `sw.js` — service worker (offline support)
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — app icons
- `apple-touch-icon.png` — iOS home-screen icon
- `favicon-32.png` — browser tab icon

**Optional (only for Epic cloud sync):** `netlify.toml`, `package.json`, and the `netlify/` folder add a "Sign in with Epic" backend. The app works perfectly without them — if they're absent, it's just the static tracker above and the account bar never appears. See **Connecting your Epic account** below.

## Why hosting is required

Install and offline only switch on when the app is served over **HTTPS**. Opening the file directly (`file://...`) won't trigger them. Both options below give you free HTTPS automatically.

---

## Option A — Netlify Drop (fastest, ~1 minute, no account needed to start)

1. Put all eight files in one folder on your computer.
2. Go to **app.netlify.com/drop** in your browser.
3. Drag the folder straight onto that page.
4. Netlify uploads it and gives you a live URL like `https://something-random.netlify.app`.
5. Open that URL on any device and install it (see "Installing" below).

Make a free Netlify account if you want to rename the site to something memorable or keep it permanently.

## Option B — GitHub Pages (free, permanent, a few more steps)

1. Create a free account at **github.com**.
2. Click **New repository**, give it a name like `fortnite-sprites`, set it **Public**, and create it.
3. On the repo page choose **Add file → Upload files**, drag in all eight files (they must land at the repo root, not inside a folder), then **Commit changes**.
4. Go to **Settings → Pages**. Under **Source** pick **Deploy from a branch**, set the branch to **main** and the folder to **/ (root)**, then **Save**.
5. Wait about a minute. Your app will be live at `https://YOUR-USERNAME.github.io/fortnite-sprites/`.

---

## Installing the app

- **Android (Chrome):** tap the **⤓ Install app** button in the tracker, or use the browser menu → *Install app / Add to Home screen*.
- **Desktop (Chrome / Edge):** click the **⤓ Install app** button, or the small install icon at the right of the address bar.
- **iPhone / iPad (Safari):** the auto-install button doesn't exist on iOS, so tap the **Share** icon → **Add to Home Screen**. It then opens full-screen with its own icon.

After the first load it works **offline** — fonts and all.

## Tracking sprites, levels, and mastery

- **Variants:** tap the **Standard / Gold / Gummy** chips on a card as you find each one.
- **Level:** each card has a **Level 1–5** row — tap the level your sprite is currently at. Tap the current level again to step it down; tap **1** twice to clear it.
- **Mastered:** reaching **Level 5** automatically flags the sprite as **★ Mastered**. The line under the meter shows how many sprites you've mastered. (Mastery is tracked per sprite and doesn't change the collection percentage.)
- **Add:** tap **+ Add Sprite** to add a new sprite (with or without Gold/Gummy variants).
- **Delete:** every card has an **✕** in its corner. Custom sprites are gone for good; removed built-in sprites come back with **Reset**.
- **Reset:** clears all checkmarks and levels and restores any removed built-in sprites. Sprites you added yourself are kept.

Levels and deletions are included in **Export/Import** backups and in **cloud sync**.

## Moving your collection between devices

Your progress saves on each device separately (that's how browser storage works). To copy it across:

1. On the device that has your progress, tap **Export backup** — it downloads a small JSON file.
2. Move that file to the other device (AirDrop, email, cloud, etc.).
3. Open the app there and tap **Import backup**, then pick the file.

Or set up **cloud sync** (below) so it copies automatically.

---

## Cloud sync — two ways

Both options sync **the checkmarks you tap** across devices. (Neither can auto-detect which sprites you *own* — Epic has no public API for that.) Both need the serverless functions deployed, so use a deploy that runs them: connect the folder as a **Git repo** in Netlify, or use the **Netlify CLI** (`npm i -g netlify-cli`, `netlify login`, then `netlify deploy --prod`). The plain drag-and-drop at app.netlify.com/drop uploads static files only and won't run the functions.

| | Sync code (simplest) | Sign in with Epic |
|---|---|---|
| Setup | Just deploy the functions | Register an Epic app + brand review + 4 env vars |
| Accounts | None — a shared passphrase | Real Epic login |
| Best when | You just want it working fast | You want it tied to a real identity |

### Option 1 — Sync code (no account, no Epic setup)

1. Deploy with functions on (Git or CLI, as above). No environment variables are required.
2. Open the app — a **Use a sync code** button appears under the title.
3. Tap it, then **Generate one** (or type your own, 6+ characters), then **Connect**. Save the code somewhere safe.
4. On any other device, open the app, tap **Use a sync code**, enter the **same code**, and **Connect**. Both devices now share one collection.

> Anyone who has the code can view and edit that collection, so treat it like a password. Tap **Copy code** anytime to grab it, or **Disconnect** to stop syncing on a device (your local progress stays).

### Option 2 — Connecting your Epic account (cloud sync)

> **Read this first — what it can and can't do.** Epic/Fortnite do **not** provide any public way for an app to read which cosmetics you own. So this **cannot auto-detect** your sprites. What "Sign in with Epic" *does*: it ties **the checkmarks you tap** to your Epic account and stores them in the cloud, so the same collection follows you onto every device automatically — no Export/Import files. You still tick sprites manually; they just sync now.

This part is **optional and more advanced** than the rest of the app. It needs a registered Epic app, a few secret keys, and a deploy method that runs serverless functions. The plain static app keeps working without any of it.

### How it works
- A **"Sign in with Epic"** button sends you to Epic's official login, then back to the app.
- Five small serverless functions in `netlify/functions/` handle the login handshake and read/write your progress.
- Your collection is stored per Epic account using **Netlify Blobs** (no database to set up).

### Step 1 — Register an Epic application
1. Go to the **Epic Games Dev Portal** → <https://dev.epicgames.com/portal>, and create an **Organization** (one-time) and a **Product**.
2. In the product, open **Epic Account Services** and create a new application.
3. Add the **`basic_profile`** scope (that's all this app needs).
4. Set the **Redirect URI** to exactly:
   ```
   https://spritetracker.netlify.app/api/auth/callback
   ```
   (Use your real site URL if it ever changes. It must match character-for-character.)
5. Copy the **Client ID** and **Client Secret** — you'll need them in Step 3.

> Epic requires a short **brand review** before *anyone* can log in, but you can test with accounts in your own organization right away.

### Step 2 — Deploy with functions on
The simple drag-and-drop at app.netlify.com/drop uploads static files only — it does **not** run functions. Use one of these instead:

- **Easiest (Git):** push this folder to a GitHub repo, then in Netlify choose **Add new site → Import an existing project** and pick the repo. Netlify auto-detects `netlify.toml` and deploys the functions.
- **CLI:** install the Netlify CLI (`npm i -g netlify-cli`), run `netlify login`, then from this folder run `netlify deploy --prod`.

### Step 3 — Add your secret keys
In Netlify: **Site configuration → Environment variables**, add these four, then redeploy:

| Variable | Value |
|---|---|
| `EPIC_CLIENT_ID` | from Step 1 |
| `EPIC_CLIENT_SECRET` | from Step 1 |
| `SESSION_SECRET` | any long random string you make up (signs login cookies) |
| `APP_URL` | `https://spritetracker.netlify.app` |

### Step 4 — Try it
Open the site, tap **Sign in with Epic**, approve, and you'll land back on a green **"Synced as <your name>"** bar. Tick a few sprites, open the site on another device, sign in with the same Epic account — your collection is there.

If sign-in fails, the usual causes are: the Redirect URI not matching exactly, a missing environment variable, or the deploy not including functions (Step 2).

## Updating the app later

When you edit `index.html` (or change icons), re-upload the changed files **and** open `sw.js` and bump the version line near the top:

```
const CACHE = "sprites-v3";   →   "sprites-v4"
```

That tells installed copies to drop the old cache and pull the new version on next launch. Without the bump, devices may keep showing the cached older version.

New sprites or variants from a Fortnite patch don't need any of this — just use the **+ Add Sprite** button inside the app, set its level as you grind it up, and remove any you no longer want with the **✕** on its card.
