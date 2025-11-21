# **Tabula Rasa: Look ma, no mouse!**

A keyboard-first simple tab manager that lets you navigate, search, and close tabs instantly—all without touching your mouse.

## **Quick Start**

Press **F8** to launch, type to search, then use **J/K** to navigate and **Enter** to switch tabs. Close individual tabs with **X**, or select multiple tabs with **Space** and batch-close with **Ctrl+Enter**.

## **Core Features**

**Low-latency tab control** for power users:

- **Search & filter** tabs and browser history instantly as you type
- **Navigate** with Vim-style **J/K** keys (or jump to top/bottom with **Ctrl+J/K**)
- **Batch operations**: Select multiple tabs with **Space**, close all selected with **Ctrl+Enter**
- **Sort tabs** by browser order, most recent, or oldest (**1/2/3** keys)
- **Two views**: Compact popup for quick actions, or full-page view with URL and metadata
- **Customizable**: Change launch hotkey, default view, layout, and behavior preferences

## **Keyboard Shortcuts**

Once the tab list has focus (press **Enter** after searching), these shortcuts work:

- **F8** — Launch Tabula Rasa
- **J/K** — Navigate down/up
- **Ctrl/Cmd + J/K** — Jump to top/bottom of the list
- **Enter** — Switch to focused tab (or open history item in new tab)
- **X** — Close focused tab (or delete history item from history)
- **Space** — Toggle selection
- **Ctrl/Cmd + Enter** — Close all selected tabs (or delete all selected history items)
- **P** — Toggle pinned tabs
- **A** — Select/deselect all visible tabs
- **1/2/3** — Switch sorting: Browser / Recent / Oldest
- **S / Esc** — **S** focuses search / **Esc** clears search
- **L** — Toggle horizontal/vertical layout (Full View only)
- **Q** — Exit Tabula Rasa (popup or full view)

## **Privacy First**

All tab data stays in your browser. No accounts, no tracking, nothing is ever sent to external servers.

Perfect for developers, researchers, and anyone who manages dozens of tabs and wants to do it efficiently with just the keyboard.

## **🚀 Full Keyboard Workflow Example 1**

Follow this step-by-step example to experience the core value of Tabula Rasa—managing your tabs without touching the mouse.

1. **Launch:** Press **F8** (the default hotkey, which you can change in the Options panel).  

2. **Filter/Focus:** Since the search box is focused by default (a configurable option), type a substring like "docs" to filter the list. Then press **Enter** to move the focus from the search box to the list of tabs.  

3. **Navigate:** Use the **J** key to move focus down the list, and the **K** key to move focus up.  

4. **Select Tabs to Close:** When focused on a tab you want to close later, press **Spacebar** to toggle its selection checkbox. Repeat this process for multiple tabs.  

5. **Close Focused Tab:** If you immediately want to close the tab currently in focus, press **X**. The focus automatically shifts to the next tab. For history items, **X** deletes the item from history instead.  

6. **Switch to Tab:** Find a tab you want to switch to and continue working on. While it's in focus, press **Enter**. Tabula Rasa will close, and your browser will immediately jump to that tab. For history items, **Enter** opens the page in a new tab.  

7. **Batch Close:** After relaunching, if you have selected tabs remaining, press **Ctrl/Cmd \+ Enter** to close all selected tabs at once. For history items, this deletes all selected items from history.  

8. **Exit:** Press **Q** to exit Tabula Rasa (works in both popup and full views).

## **🚀 Full Keyboard Workflow Example 2**

1. Launch the app (default key: F8)

2. Press **S** to focus on the search bar (if you're not there already)

3. Type a search query to filter the list.

4. Press **Enter** to go to the tab list.

5. Select the tab you want (using **J/K** to navigate)

6. Press **Enter** for the browser to refocus to that tab.

## **🚀 Full Keyboard Workflow Example 3: History Search**

1. Launch the app (default key: F8)

2. Press **S** to focus on the search bar (if you're not there already)

3. Type `history:` or `hist:` followed by your search term (e.g., `history:github`)

4. Browse your history results using **J/K** to navigate

5. Press **Enter** to open a history item in a new tab, or **X** to delete it from history

6. Use **Space** to select multiple history items, then **Ctrl/Cmd + Enter** to delete all selected items from history

## **🔍 Advanced Search Features**

The search box supports advanced filtering with prefixes and multiple search terms. All searches are case-insensitive.

### **History Search**

Search your browser history instead of open tabs:

- **`history:` or `hist:`** prefix searches browser history instead of open tabs.  
  Example: `history:github` or `hist:github` searches your browsing history for "github".

**History search features:**

- Results are limited to 250 items maximum. The search label shows "history search (N results)" or "history search (N results, cap reached)" if the limit is hit.
- Clicking a history item or pressing **Enter** on a focused history item **opens it in a new tab**.
- Pressing **X** on a history item **deletes it from your browser history** (not closes a tab). A confirmation dialog appears if confirmation is enabled in settings.
- History results are sorted according to your selected sort mode (**1/2/3** keys): Browser order (defaults to recent), Most Recent, or Oldest.
- History items show the same information as tabs: title, URL, and last accessed time.
- You can select history items for batch deletion using **Space** to toggle selection and **Ctrl/Cmd + Enter** to delete all selected items from history.

### **Field-Specific Search**

Use prefixes to restrict your search to specific fields:

- **`url:`** prefix restricts search to URLs only.  

  Example: `url:github` finds tabs with "github" in the URL.

- **`title:`** prefix restricts search to tab titles only.  

  Example: `title:docs` finds tabs with "docs" in the title.

- **No prefix** (default): Terms without prefixes search both title and URL.  

  Example: `mail` finds tabs with "mail" in either the title or URL.

### **Multiple Terms with AND Logic**

Space-separated terms use AND logic—all terms must match for a tab to be shown:

- **`test url:git`** finds tabs with "test" (in title or URL) AND "git" in the URL.

- **`mail sync plus`** finds tabs containing "mail" AND "sync" AND "plus" anywhere (title or URL).

- **`history: term1 term2 url:github`** searches history for items containing "term1" AND "term2" AND "github" in the URL.

## **��️ Views at a Glance**

Both views share the same filters and selections, ensuring a seamless experience when switching.

**Popup View:** Quick, compact overlay for immediate navigation and closing. Launched via toolbar icon or **F8**.

**Full View:** Spacious layout showing **URL** and **Last Accessed** metadata. Opened via **F8** or by clicking **Open full page view (F)**.

## **⚙️ Customization (Options Panel)**

Access the **Options** panel (press **O** or click the button) to configure persistent preferences:

- **Launch Hotkey:** Change the keyboard shortcut (e.g., F9, Ctrl+Comma).  The author prefers Ctrl+Shift+Comma as it seems to conflict with no other extensions or Firefox's own hotkeys.

- **Default View:** Always open in the full-page layout.  

- **Layout:** Choose between horizontal or vertical split in full view.  

- **Behavior:** Set defaults for hiding pinned tabs, confirming before close, and more.

### **Advanced Hotkey Configuration**

If the built-in hotkey options are insufficient, you can set a fully custom shortcut directly through Firefox's Add-ons UI under **Keyboard Shortcuts**.

## **📜 History**

The name "Tabula Rasa" is a playful nod to browser **tabs** and the Latin phrase meaning "clean slate," [tabula rasa](https://en.wiktionary.org/wiki/tabula_rasa). The project began as a quest for a better way to close lots of tabs quickly—wiping the slate clean—but during development it became clear the same keyboard-first interface was equally powerful for **searching** and **navigating** through every open tab. That broadened focus shaped the tool into the all-in-one tab triage and navigation experience it is today.

## **❤️ Supporting the Author**

Tabula Rasa is a **personal project** built and maintained by the developer during free time.  

If this tool helps streamline your workflow and you appreciate the dedicated effort involved, please consider sending a thank you or a tip. Your support is instrumental in motivating new feature development and ongoing maintenance.  

You can contribute a tip or send a message via the in-app Tip button or directly at:  

[buymeacoffee.com/fejikso](https://buymeacoffee.com/fejikso).

## **📄 License**

Tabula Rasa is released under the GNU General Public License v3.0.
