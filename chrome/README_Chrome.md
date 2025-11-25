# Tabula Rasa (Chrome Edition)

A keyboard-first tab manager for Chrome that lets you search, navigate, and close tabs (or recent history) without touching your mouse.

## Quick Start

Press **Alt+Shift+Period** (after assigning it via `chrome://extensions/shortcuts`) to launch Tabula Rasa. Type to filter, press **Enter** to focus the list, then use **J/K** to move, **Space** to multi-select, and **Ctrl/Cmd + Enter** to close all selected tabs.

## Core Features

- **Instant search** across open tabs or browser history (`history:` prefix)
- **Vim-style navigation** (`J/K`, `Ctrl/Cmd + J/K`, `Home/End`)
- **Batch actions**: select via **Space**, close with **Ctrl/Cmd + Enter**
- **Sort modes**: Browser order, Recent, Oldest (`1/2/3`)
- **Two layouts**: toolbar popup or full-page view with URL/metadata
- **Custom preferences** stored per profile (hide pins, confirm before close, layout, etc.)

## Keyboard Shortcuts

Once the tab list has focus (press **Enter** after typing):

- **Alt+Shift+Period** — Launch Tabula Rasa (set via `chrome://extensions/shortcuts`)
- **J / K** — Move down / up
- **Ctrl/Cmd + J / K** — Jump to top / bottom
- **Enter** — Switch to focused tab (history items open in new tabs)
- **X** — Close focused tab (delete history item)
- **Space** — Toggle selection
- **Ctrl/Cmd + Enter** — Close/delete all selected
- **P** — Toggle pinned tabs visibility
- **A** — Select/deselect all visible
- **1 / 2 / 3** — Switch sort modes
- **S / Esc** — Focus search / clear search
- **L** — Toggle layout in full view
- **F** — Open full-page view (from popup)
- **Q** — Exit popup or close full-page tab

## Privacy

All data stays in your browser. No accounts, no tracking, no remote servers.

## Workflow Examples

### Batch triage

1. Launch (toolbar button or shortcut).
2. Filter tabs (search box focused by default).
3. **Enter** to move focus to results.
4. **J/K** to navigate, **Space** to mark tabs to close.
5. **X** for quick closes; **Enter** to activate a tab.
6. Relaunch, press **Ctrl/Cmd + Enter** to close all selected.
7. **Q** to exit.

### History Search

1. Launch, press **S** if you’re not in the search box.
2. Type `history:keyword`.
3. **J/K** to browse results.
4. **Enter** opens in new tab, **X** deletes from history.
5. **Space** + **Ctrl/Cmd + Enter** deletes multiple entries.

## Advanced Search

- `history:` / `hist:` — search browsing history instead of tabs.
- `url:term` — match URLs only.
- `title:term` — match titles only.
- Multiple terms use AND logic (`term1 term2 url:github`).

## Views at a Glance

- **Popup View**: fast triage inside the toolbar window.
- **Full View**: rich layout showing URL + last accessed; open via **F** or `Open full page view (F)`.

## Options Panel

Press **O** or click **Options** to configure:

- Default view (popup vs full page)
- Layout (horizontal/vertical split)
- Focus search first, confirm before close, hide pins, pin tabs at top, show favicons, etc.
- Launch shortcut: Chrome controls it—use the built-in button to open `chrome://extensions/shortcuts` and set your key combo.

## Installing in Chrome

1. Open `chrome://extensions`, enable **Developer Mode**.
2. Click **Load unpacked** and select the `chrome/` directory.
3. After loading, open `chrome://extensions/shortcuts` and assign your preferred shortcut.

## Quick Smoke Test

- Launch from toolbar, verify search/filter and tab closing.
- Press **F** to open the full-page view; try layout toggles and batch close.
- Run a `history:` search and delete an entry to confirm permissions.

## History

“Tabula Rasa” nods to both browser tabs and “clean slate.” It began as a fast tab-closing helper and evolved into a full keyboard-driven navigator.

## Supporting the Author

Tabula Rasa is a personal project. Tips and messages are welcome via the in-app Tip button or [buymeacoffee.com/fejikso](https://buymeacoffee.com/fejikso).

## License

Released under the GNU GPL v3.0.