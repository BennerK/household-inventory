# Household Inventory App

A shared household inventory tracker for the family. Tracks the freezer, pantry, under-house storage, nursery, shopping lists, and specialty store lists (Asian Store, Costco, Amazon).

## Features
- 4 inventory sections with themed designs (icicles, hanging pantry items, cobwebs, forest)
- Shared shopping list with check-off
- Specialty shopping with per-store sub-lists
- Dark/light mode toggle  
- Syncs between two phones
- Installable to phone home screen (works like a native app)

## Live URL
Once deployed: `https://YOUR_USERNAME.github.io/household-inventory/`

## Setup

### First-time deploy
1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. The site builds and deploys automatically on every push to `main`

### Enable cross-device sync
Open `src/App.jsx` and fill in the two constants near the top:

```js
const JSONBIN_ID  = "";   // your jsonbin.io Bin ID
const JSONBIN_KEY = "";   // your jsonbin.io Master Key
```

Create a free account at [jsonbin.io](https://jsonbin.io), create a bin with `{}` as content,
and paste the Bin ID and Master Key above. Commit the change — GitHub redeploys automatically.

## File structure
```
household-inventory/
├── .github/
│   └── workflows/
│       └── deploy.yml       ← auto-deploy to GitHub Pages
├── src/
│   ├── App.jsx              ← the full app (edit this to make changes)
│   └── main.jsx             ← React entry point
├── index.html
├── package.json
├── vite.config.js
├── manifest.webmanifest     ← makes it installable on phones
├── icon.png                 ← home screen icon
└── .gitignore
```

## Adding to phone home screen

**iPhone (Safari only):**
Share button → Add to Home Screen → Add

**Android (Chrome):**
⋮ menu → Add to Home screen → Add
