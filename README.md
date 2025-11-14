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

| Shortcut | Action |
| --- | --- |
| **F8** | Launch Tabula Rasa from anywhere. |
| **S** / **Esc** | Focus the search box / clear it. |
| **J / K** | Move focus down / up the list. |
| **Enter** | Jump to the focused tab in Firefox. |
| **Space** | Toggle the focused tab’s checkbox. |
| **X** | Close the focused tab item. |
| **Ctrl/Cmd + Enter** | Close all selected tabs. |
| **Ctrl/Cmd + Click** | Close the clicked tab instantly. |
| **A** | Select or clear all visible tabs. |
| **1 / 2 / 3** | Switch sorting: browser / recent / oldest. |
| **L** | Toggle between horizontal and vertical full-view layouts. |
| **F** | Open the full-page view (when in the popup). |
| **Q** | Close the full-page view tab. |

You can revisit these at any time via the **Hotkeys** button.

---

## Tips & Support

- Need to show pinned tabs? Toggle **Hide pinned** at the top of the list.  
- Sorting and view preferences persist automatically between sessions.  
- The **Tip** button (or [buymeacoffee.com/fejikso](https://buymeacoffee.com/fejikso)) helps support ongoing development.  
- Found a bug or have a feature request? Open an issue on the project repo or send a message via Buy Me a Coffee.

---

## Customize the F8 Shortcut

Firefox lets you remap an extension shortcut with `about:config`:

1. Open a new tab and visit `about:config`, then accept the warning prompt.
2. Search for `extensions.webextensions.commands`.
3. Locate the preference whose name includes **tabula-rasa** (its value looks like `{"_execute_action":{"shortcut":"F8"}}`).
4. Edit the value and change the `shortcut` string to the key combo you prefer (e.g. `Ctrl+Shift+F`), then confirm.
5. Reload the extension (disable/enable it from **about:addons**) if the new shortcut does not take effect immediately.

You can revert at any time by using the Reset action on the same preference.

---

## License

Tabula Rasa is released under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
