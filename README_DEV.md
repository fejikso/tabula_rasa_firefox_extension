# README for Developers

## Project Overview

Tabula Rasa is a Firefox WebExtension focused on rapid tab triage. The codebase lives at [github.com/fejikso/tabula_rasa_firefox_extension](https://github.com/fejikso/tabula_rasa_firefox_extension).

```
├── manifest.json          # Extension registration & permissions
├── popup.html / popup.css / popup.js
│   └─ Popup UI shared with the full-page view
├── full.html              # Full-page layout reusing popup script/styles
├── README.md              # User-facing walkthrough
├── README_DEV.md          # You are here
└── ideas/, icon.svg       # Artwork and references
```

The popup and full view both load `popup.js` so changes there affect both surfaces.

## Prerequisites

- Node.js 18+
- npm
- Firefox (latest release or Developer Edition)
- [`web-ext`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/) CLI:

```bash
npm install --global web-ext
```

## Local Development

Run the extension in a temporary profile with live reload:

```bash
web-ext run
```

The command watches source files and auto-reloads the add-on when you save changes. Keep the terminal open while developing.

### Manual Loading

1. Open `about:debugging#/runtime/this-firefox` in Firefox.  
2. Click **Load Temporary Add-on…**.  
3. Pick `manifest.json`.  
4. After testing, remove or reload the entry from the same page.

## Building for Distribution

Create a ZIP suitable for AMO upload:

```bash
web-ext build --overwrite-dest
```

The bundle appears under `web-ext-artifacts/`. Upload that archive to the Firefox Add-ons dashboard for signing or release.

## Storage Keys

The extension uses `browser.storage.local`:

| Key | Purpose |
| --- | --- |
| `tabulaRasa.sortMode` | Last chosen sort order (`window`, `recent`, `oldest`). |
| `tabulaRasa.launchFullView` | Boolean flag indicating whether the full page should open by default (F8/command invocation). |

Always guard `storage.local` reads with defaults to avoid regressions.

## Coding Notes

- `popup.js` is written in modern ES modules and runs in both views—feature flags should check `isPopupView` / `isFullView`.  
- Styling prefers CSS custom properties and Flex/Grid for layout. Full view adjustments live under `body.layout-full`.  
- Keep the Hotkeys dialog in sync with any shortcut changes.  
- Run `read_lints` (or your editor’s diagnostics) after touching HTML/CSS/JS to catch regressions early.

Happy hacking!

