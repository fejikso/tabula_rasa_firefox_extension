# Tabula Rasa

Streamline how you review, sort, and close Firefox tabs. Tabula Rasa presents a fast, keyboard-friendly list of the tabs in your current window so you can decide what stays open and what goes. The project lives at [github.com/fejikso/tabula_rasa_firefox_extension](https://github.com/fejikso/tabula_rasa_firefox_extension).

---

## Quick Start

1. Click the Tabula Rasa toolbar icon (popup view) or press **F8** (full-page view).  
2. Filter tabs by typing in the search box – use **Esc** to clear the query.  
3. Press **1 / 2 / 3** to switch between browser order, most recently used, or oldest tabs first.  
4. Tick the tabs you want to close and hit **Ctrl/Cmd + Enter**, or click the ❌ next to any single tab to close it immediately.  
5. Want the full-page layout by default? Open the full view and enable **“Always open Tabula Rasa in full view.”**

---

## Views at a Glance

| Popup | Full View |
| --- | --- |
| Compact list for quick triage. | Spacious layout with URL + “last accessed” metadata. |
| Toggle hidden pinned tabs on/off. | Fix the action buttons in the top-right corner. |
| Launches from the toolbar icon. | Opened via F8 or by clicking **Open full page view**. |

You can switch between them at any time; both share the same filters, selections, and preferences.

---

## Keyboard Shortcuts

> While the search field has focus, letter shortcuts just type into it. Press Enter once to return focus to the tab list so the shortcuts below work.

| Shortcut | Action |
| --- | --- |
| **Launch hotkey** | Launch Tabula Rasa from anywhere (default F8; configurable in Options). |
| **S** / **Esc** | Focus the search box / clear it. |
| **Enter** | Open the focused tab. |
| **Space** | Toggle the focused tab’s checkbox. |
| **J / K** | Move focus down / up the list. |
| **Ctrl/Cmd + J / K** | Jump to top / bottom of the list (like Home/End). |
| **Home / End** | Jump to top / bottom of the list. |
| **X** | Close the focused tab item. |
| **Ctrl/Cmd + Click** | Close the clicked tab instantly. |
| **Ctrl/Cmd + Enter** | Close all selected tabs. |
| **?** | Open/close the hotkeys dialog. |
| **O** | Open/close the options panel. |
| **P** | Hide or show pinned tabs. |
| **A** | Select or clear all visible tabs. |
| **1 / 2 / 3** | Switch sorting: browser / recent / oldest. |
| **L** | Toggle between horizontal and vertical full-view layouts. |
| **F** | Open the full-page view (when in the popup). |
| **Q** | Close Tabula Rasa (popup or full view). |

You can revisit these at any time via the **Hotkeys** button.

---

## Tips & Support

- Need to show pinned tabs? Toggle **Hide pins** at the top of the list.  
- Sorting and view preferences persist automatically between sessions.  
- Customize your experience via the **Options** panel (press **O** or click the Options button).
- The **Tip** button (or [buymeacoffee.com/fejikso](https://buymeacoffee.com/fejikso)) helps support ongoing development.  
- Found a bug or have a feature request? Open an issue on the project repo or send a message via Buy Me a Coffee.

---

## Options Panel

The **Options** panel (accessible via the **O** key or the Options button) lets you customize:

- **Always open in full view**: Open Tabula Rasa in full-page view by default.
- **Vertical layout**: Use vertical split layout in full view (controls on top, tabs below).
- **Launch hotkey**: Choose your preferred keyboard shortcut to launch Tabula Rasa (F8, F9, Ctrl+Comma, Ctrl+Shift+Comma, Ctrl+Period, or Ctrl+Shift+Period).

All preferences are saved automatically and persist across sessions.

---

## Advanced: Customize Shortcuts via about:config

If you need a shortcut not available in the Options panel, Firefox lets you remap extension shortcuts with `about:config`. However, the **easier method** is to use Firefox's built-in UI:

### Recommended: Use Firefox's UI

1. Go to `about:addons` (or Tools → Add-ons and Themes).
2. Find **Tabula Rasa** and click the gear icon (or "Manage").
3. Click **Keyboard Shortcuts**.
4. Change the shortcut for "Open Tabula Rasa" to your preferred key combination.

### Alternative: Manual about:config Method

If you prefer to edit preferences directly:

1. Open a new tab and visit `about:config`, then accept the warning prompt.
2. Search for `tabula` or `rasa` to find preferences related to the extension.
3. If no results appear, you may need to find your extension ID first:
   - Go to `about:debugging` → **This Firefox**.
   - Find Tabula Rasa in the list and note its **Internal UUID** (extension ID).
   - In `about:config`, search for that UUID or for `extensions.webextensions.commands`.
4. Look for a preference whose name includes the extension ID or **tabula-rasa**. The preference value should be a JSON string like `{"_execute_action":{"shortcut":"F8"}}`.
5. Double-click the preference to edit it, and change the `shortcut` value to your preferred key combo (e.g. `Ctrl+Shift+F`). The full JSON should look like `{"_execute_action":{"shortcut":"Ctrl+Shift+F"}}`.
6. Reload the extension (disable/enable it from **about:addons**) if the new shortcut does not take effect immediately.

**Note:** The preference may not exist until the extension has been installed and the command has been used at least once. If you can't find it, use the UI method above instead.

You can revert at any time by using the Reset action on the same preference, or change it back via the Options panel or the Keyboard Shortcuts UI.

---

## License

Tabula Rasa is released under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
