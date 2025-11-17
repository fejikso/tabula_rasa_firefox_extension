const tabContainer = document.getElementById("tab-container");
const emptyState = document.getElementById("empty-state");
const closeButton = document.getElementById("close-selected");
const tabTemplate = document.getElementById("tab-item-template");
const hotkeysButton = document.getElementById("hotkeys-button");
const hotkeysPanel = document.getElementById("hotkeys-panel");
const hotkeysCloseButton = document.getElementById("hotkeys-close");
const tipButton = document.getElementById("tip-button");
const tipPanel = document.getElementById("tip-panel");
const tipCloseButton = document.getElementById("tip-close");
const sortWindowButton = document.getElementById("sort-window");
const sortRecentButton = document.getElementById("sort-recent");
const sortOldestButton = document.getElementById("sort-oldest");
const expandButton = document.getElementById("expand-button");
const togglePinnedButton = document.getElementById("toggle-pinned");
const searchInput = document.getElementById("search-tabs");
const searchClearButton = document.getElementById("search-clear");
const selectVisibleButton = document.getElementById("select-visible");
const defaultFullViewCheckbox = document.getElementById("default-full-view");
const orientationToggle = document.getElementById("full-view-orientation");
const tabCountElement = document.getElementById("tab-count");
const launchHotkeyDisplay = document.getElementById("launch-hotkey-display");
const pathName = window.location.pathname || "";
const FULL_VIEW_FILE = "tabula-rasa-full-view.html";
const isPopupView = pathName.endsWith("/popup.html") || pathName.endsWith("popup.html");
const isFullView = pathName.endsWith(`/${FULL_VIEW_FILE}`) || pathName.endsWith(FULL_VIEW_FILE);

const selectedTabIds = new Set();
let tabCache = [];
let sortMode = "window";
const SORT_MODE_KEY = "tabulaRasa.sortMode";
const LAUNCH_FULL_VIEW_KEY = "tabulaRasa.launchFullView";
const FULL_VIEW_ORIENTATION_KEY = "tabulaRasa.fullViewOrientation";
const LAUNCH_HOTKEY_KEY = "tabulaRasa.launchHotkey";
const FOCUS_SEARCH_FIRST_KEY = "tabulaRasa.focusSearchFirst";
const CONFIRM_BEFORE_CLOSE_KEY = "tabulaRasa.confirmBeforeClose";
const CLOSE_POPUP_AFTER_OPEN_KEY = "tabulaRasa.closePopupAfterOpen";
const HIDE_PINNED_BY_DEFAULT_KEY = "tabulaRasa.hidePinnedByDefault";
const PIN_TABS_AT_TOP_KEY = "tabulaRasa.pinTabsAtTop";
const SHOW_FAVICONS_KEY = "tabulaRasa.showFavicons";
const ORIENTATION_HORIZONTAL = "horizontal";
const ORIENTATION_VERTICAL = "vertical";
let hidePinned = false;
let searchQuery = "";
let launchFullViewByDefault = false;
let activeTabIdFocusTarget = null;
let shouldFocusActiveTab = false;
let fullViewOrientation = ORIENTATION_HORIZONTAL;
let focusSearchFirst = false;
let skipFocusSearchFirstOnce = false;
let confirmBeforeClose = true;
let closePopupAfterOpen = true;
let hidePinnedByDefault = false;
let pinTabsAtTop = false;
let showFavicons = false;
let launchHotkey = "Ctrl+Shift+Comma";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const URL_DISPLAY_MAX = 80;

function truncateUrl(url) {
  if (!url || url.length <= URL_DISPLAY_MAX) {
    return url;
  }

  const ellipsis = "…";
  const keep = URL_DISPLAY_MAX - ellipsis.length;
  const head = Math.ceil(keep * 0.6);
  const tail = keep - head;
  return `${url.slice(0, head)}${ellipsis}${url.slice(-tail)}`;
}

function formatLastAccessed(timestamp) {
  if (!timestamp || Number.isNaN(timestamp)) {
    return "unknown";
  }

  try {
    return dateFormatter.format(new Date(timestamp));
  } catch (error) {
    console.error("Failed to format last accessed timestamp:", error);
    return "unknown";
  }
}

async function closeSingleTabImmediate(tabId) {
  if (typeof tabId !== "number") {
    return;
  }
  if (confirmBeforeClose) {
    const tab = tabCache.find((t) => t.id === tabId);
    const tabTitle = tab?.title || "this tab";
    if (!confirm(`Close tab: ${tabTitle}?`)) {
      return;
    }
  }
  try {
    await browser.tabs.remove(tabId);
    removeClosedTabs([tabId]);
  } catch (error) {
    console.error(`Failed to close tab ${tabId}:`, error);
  }
}

function getActiveTabItem() {
  const activeElement = document.activeElement;
  const activeItem = activeElement?.closest(".tab-item");
  if (activeItem) {
    return activeItem;
  }
  return tabContainer.querySelector(".tab-item");
}

function isValidSortMode(mode) {
  return mode === "window" || mode === "recent" || mode === "oldest";
}

function focusElement(element, { preventScroll = false } = {}) {
  if (!element || typeof element.focus !== "function") {
    return;
  }
  if (preventScroll) {
    try {
      element.focus({ preventScroll: true });
      return;
    } catch (error) {
      // Fallback to default focus if preventScroll option is unsupported.
    }
  }
  element.focus();
}

function isValidOrientation(mode) {
  return mode === ORIENTATION_HORIZONTAL || mode === ORIENTATION_VERTICAL;
}

function applyFullViewOrientation(mode) {
  if (!isValidOrientation(mode)) {
    return;
  }
  fullViewOrientation = mode;
  if (!isFullView) {
    return;
  }
  const body = document.body;
  if (body) {
    body.classList.toggle("orientation-horizontal", mode === ORIENTATION_HORIZONTAL);
    body.classList.toggle("orientation-vertical", mode === ORIENTATION_VERTICAL);
  }
  if (orientationToggle) {
    const isVertical = mode === ORIENTATION_VERTICAL;
    if (orientationToggle.checked !== isVertical) {
      orientationToggle.checked = isVertical;
    }
  }
}

async function setFullViewOrientation(mode, { persist = false } = {}) {
  if (!isValidOrientation(mode)) {
    return;
  }
  const previous = fullViewOrientation;
  applyFullViewOrientation(mode);
  if (!persist || mode === previous) {
    return;
  }
  try {
    await browser.storage.local.set({
      [FULL_VIEW_ORIENTATION_KEY]: mode,
    });
  } catch (error) {
    console.error("Failed to save full view orientation preference:", error);
  }
}

function focusFirstTabItem() {
  const firstItem = tabContainer.querySelector(".tab-item");
  if (firstItem) {
    try {
      firstItem.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (error) {
      // ignore scroll errors
    }
    focusElement(firstItem, { preventScroll: false });
    return true;
  }
  return false;
}

function focusLastTabItem() {
  const items = Array.from(tabContainer.querySelectorAll(".tab-item"));
  const lastItem = items[items.length - 1];
  if (lastItem) {
    try {
      lastItem.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (error) {
      // ignore scroll errors
    }
    focusElement(lastItem, { preventScroll: false });
    return true;
  }
  return false;
}

function ensurePreferredFocus() {
  if (!isFullView) {
    return;
  }
  const active = document.activeElement;
  const isOnTabItem = active?.closest?.(".tab-item");
  const isOnSearch = active === searchInput;

  // If focus isn't on a meaningful interactive element, re-assert preference
  if (!active || active === document.body || active === document.documentElement || (!isOnTabItem && !isOnSearch)) {
    if (focusSearchFirst && searchInput) {
      try {
        searchInput.focus({ preventScroll: true });
      } catch (error) {
        searchInput.focus();
      }
      return;
    }
    if (!focusFirstTabItem()) {
      if (togglePinnedButton) {
        focusElement(togglePinnedButton, { preventScroll: true });
      }
    }
  }
}

async function restoreSortMode() {
  try {
    const stored = await browser.storage.local.get([
      SORT_MODE_KEY,
      LAUNCH_FULL_VIEW_KEY,
      FULL_VIEW_ORIENTATION_KEY,
      FOCUS_SEARCH_FIRST_KEY,
      CONFIRM_BEFORE_CLOSE_KEY,
      CLOSE_POPUP_AFTER_OPEN_KEY,
      HIDE_PINNED_BY_DEFAULT_KEY,
      PIN_TABS_AT_TOP_KEY,
      LAUNCH_HOTKEY_KEY,
    ]);
    const savedMode = stored?.[SORT_MODE_KEY];
    if (isValidSortMode(savedMode)) {
      sortMode = savedMode;
    }
    if (typeof stored?.[LAUNCH_FULL_VIEW_KEY] === "boolean") {
      launchFullViewByDefault = stored[LAUNCH_FULL_VIEW_KEY];
    }
    const savedOrientation = stored?.[FULL_VIEW_ORIENTATION_KEY];
    if (isValidOrientation(savedOrientation)) {
      applyFullViewOrientation(savedOrientation);
    } else {
      applyFullViewOrientation(ORIENTATION_HORIZONTAL);
    }
    if (typeof stored?.[FOCUS_SEARCH_FIRST_KEY] === "boolean") {
      focusSearchFirst = stored[FOCUS_SEARCH_FIRST_KEY];
    }
    if (typeof stored?.[CONFIRM_BEFORE_CLOSE_KEY] === "boolean") {
      confirmBeforeClose = stored[CONFIRM_BEFORE_CLOSE_KEY];
    }
    if (typeof stored?.[CLOSE_POPUP_AFTER_OPEN_KEY] === "boolean") {
      closePopupAfterOpen = stored[CLOSE_POPUP_AFTER_OPEN_KEY];
    }
    if (typeof stored?.[HIDE_PINNED_BY_DEFAULT_KEY] === "boolean") {
      hidePinnedByDefault = stored[HIDE_PINNED_BY_DEFAULT_KEY];
      hidePinned = hidePinnedByDefault;
    }
    if (typeof stored?.[PIN_TABS_AT_TOP_KEY] === "boolean") {
      pinTabsAtTop = stored[PIN_TABS_AT_TOP_KEY];
    }
    const storedHotkey = stored?.[LAUNCH_HOTKEY_KEY];
    if (typeof storedHotkey === "string" && storedHotkey.trim()) {
      launchHotkey = storedHotkey;
    }
    updateLaunchHotkeyDisplay();
    await loadOptions();
  } catch (error) {
    console.error("Failed to restore sort mode preference:", error);
  }
}

async function persistSortMode(mode) {
  try {
    await browser.storage.local.set({ [SORT_MODE_KEY]: mode });
  } catch (error) {
    console.error("Failed to save sort mode preference:", error);
  }
}

function updateCloseButtonState() {
  closeButton.disabled = selectedTabIds.size === 0;
  closeButton.textContent =
    selectedTabIds.size > 0
      ? `Close ${selectedTabIds.size} tab${selectedTabIds.size > 1 ? "s" : ""}`
      : "Close selected tabs";
}

function toggleEmptyState() {
  const hasTabs = tabContainer.childElementCount > 0;
  emptyState.classList.toggle("hidden", hasTabs);
  if (!hasTabs) {
    emptyState.textContent = searchQuery.trim()
      ? "No tabs match your search."
      : "No tabs to show.";
  } else {
    emptyState.textContent = "No tabs to show.";
  }
}

function updatePinnedToggleState() {
  if (!togglePinnedButton) {
    return;
  }
  togglePinnedButton.classList.toggle("unified-button--active", hidePinned);
  togglePinnedButton.setAttribute("aria-pressed", String(hidePinned));
  togglePinnedButton.textContent = hidePinned ? "Hide pins" : "Show pins";
}


function updateSearchClearVisibility() {
  if (!searchClearButton) {
    return;
  }
  const hasQuery = (searchInput?.value?.length ?? 0) > 0;
  searchClearButton.disabled = !hasQuery;
  searchClearButton.setAttribute("aria-disabled", String(!hasQuery));
}

function updateLaunchHotkeyDisplay() {
  if (launchHotkeyDisplay && launchHotkey) {
    launchHotkeyDisplay.textContent = launchHotkey;
  }
}

function updateSelectVisibleButton(currentVisibleTabs) {
  if (!selectVisibleButton) {
    return;
  }
  const visibleTabs = currentVisibleTabs ?? getVisibleTabs();
  if (visibleTabs.length === 0) {
    selectVisibleButton.disabled = true;
    selectVisibleButton.textContent = "Select all";
    return;
  }
  selectVisibleButton.disabled = false;
  const allVisibleSelected = visibleTabs.every((tab) => selectedTabIds.has(tab.id));
  selectVisibleButton.textContent = allVisibleSelected ? "Clear selection" : "Select all";
}

function toggleVisibleSelection() {
  const visibleTabs = getVisibleTabs();
  if (visibleTabs.length === 0) {
    return false;
  }
  const allVisibleSelected = visibleTabs.every((tab) => selectedTabIds.has(tab.id));
  if (allVisibleSelected) {
    visibleTabs.forEach((tab) => {
      selectedTabIds.delete(tab.id);
    });
  } else {
    visibleTabs.forEach((tab) => {
      selectedTabIds.add(tab.id);
    });
  }
  updateCloseButtonState();
  skipFocusSearchFirstOnce = true;
  renderTabs(visibleTabs);
  return true;
}

function handleCheckboxChange(tabId, checkbox) {
  if (checkbox.checked) {
    selectedTabIds.add(tabId);
  } else {
    selectedTabIds.delete(tabId);
  }
  updateCloseButtonState();
  updateSelectVisibleButton();
  // Focus the tab item so keyboard navigation works
  const tabItem = checkbox.closest(".tab-item");
  if (tabItem) {
    requestAnimationFrame(() => {
      focusElement(tabItem, { preventScroll: isFullView });
    });
  }
}

function updateTabCount() {
  if (tabCountElement) {
    const count = tabCache.length;
    tabCountElement.textContent = `(${count}) tabs`;
    tabCountElement.setAttribute("aria-label", `${count} open tab${count === 1 ? "" : "s"}`);
  }
}

function removeClosedTabs(closedIds) {
  const closedSet = new Set(closedIds);
  tabCache = tabCache.filter((tab) => !closedSet.has(tab.id));
  closedIds.forEach((tabId) => {
    selectedTabIds.delete(tabId);
  });
  updateCloseButtonState();
  updateTabCount();
  renderTabs(getVisibleTabs());
}

function renderTabs(tabs) {
  const activeTabId =
    document.activeElement?.closest(".tab-item")?.dataset.tabId ?? null;
  const shouldSkipFocusSearch = skipFocusSearchFirstOnce;
  skipFocusSearchFirstOnce = false;
  let itemToRefocus = null;
  let firstItem = null;
  let activeItemElement = null;
  const searchHasFocus = document.activeElement === searchInput;

  tabContainer.innerHTML = "";
  tabs.forEach((tab) => {
    const clone = tabTemplate.content.cloneNode(true);
    const item = clone.querySelector(".tab-item");
    const tabContent = clone.querySelector(".tab-content");
    const checkbox = clone.querySelector(".tab-toggle");
    const faviconImg = clone.querySelector(".tab-favicon");
    const titleButton = clone.querySelector(".tab-title");
    const urlSpan = clone.querySelector(".tab-url");
    const lastAccessedSpan = clone.querySelector(".tab-last-accessed");

    item.dataset.tabId = tab.id;
    if (typeof tab.windowId === "number") {
      item.dataset.windowId = String(tab.windowId);
    } else {
      delete item.dataset.windowId;
    }
    item.tabIndex = 0;

    const rawTitle = tab.title?.trim() || tab.url || "Untitled tab";
    const pinPrefix = tab.pinned ? "📌 " : "";
    const displayTitle = `${pinPrefix}${rawTitle}`;
    titleButton.textContent = displayTitle;
    titleButton.title = rawTitle;
    checkbox.checked = selectedTabIds.has(tab.id);

    if (faviconImg) {
      if (showFavicons && tab.favIconUrl) {
        faviconImg.src = tab.favIconUrl;
        faviconImg.style.display = "";
        faviconImg.alt = "";
        if (tabContent) {
          tabContent.classList.add("show-favicons");
        }
      } else {
        faviconImg.style.display = "none";
        if (tabContent) {
          tabContent.classList.remove("show-favicons");
        }
      }
    }

    checkbox.addEventListener("change", () => handleCheckboxChange(tab.id, checkbox));
    titleButton.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        closeSingleTabImmediate(tab.id).catch((error) => {
          console.error("Unexpected error closing tab with modifier click:", error);
        });
        return;
      }
      focusTab(tab.id, tab.windowId);
    });

    if (urlSpan) {
      const urlText = tab.url ?? "";
      const displayUrl = truncateUrl(urlText) || "URL unavailable";
      urlSpan.textContent = displayUrl;
      urlSpan.title = urlText || "URL unavailable";
      urlSpan.classList.toggle("hidden", !isFullView || !urlText);
    }

    if (lastAccessedSpan) {
      const formatted = formatLastAccessed(tab.lastAccessed);
      lastAccessedSpan.textContent = formatted;
      lastAccessedSpan.title = formatted;
      lastAccessedSpan.classList.toggle("hidden", !isFullView);
    }

    const handleModifierClick = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        closeSingleTabImmediate(tab.id).catch((error) => {
          console.error("Unexpected error closing tab with modifier click:", error);
        });
      }
    };

    item.addEventListener("click", handleModifierClick);
    urlSpan?.addEventListener("click", handleModifierClick);
    lastAccessedSpan?.addEventListener("click", handleModifierClick);
    const closeButton = item.querySelector(".tab-close");
    closeButton?.addEventListener("click", (event) => {
      event.preventDefault();
      closeSingleTabImmediate(tab.id).catch((error) => {
        console.error("Unexpected error closing tab via close button:", error);
      });
    });

    tabContainer.appendChild(clone);

    if (!firstItem) {
      firstItem = item;
    }

    if (activeTabId && String(tab.id) === activeTabId) {
      itemToRefocus = item;
    }
    if (activeTabIdFocusTarget && tab.id === activeTabIdFocusTarget) {
      activeItemElement = item;
    }
  });

  toggleEmptyState();
  updateSelectVisibleButton(tabs);

  if (searchHasFocus && !shouldFocusActiveTab) {
    return;
  }

  // If focusSearchFirst is enabled and we're not focusing an active tab, focus search first
  if (focusSearchFirst && !shouldFocusActiveTab && !shouldSkipFocusSearch && searchInput) {
    requestAnimationFrame(() => {
      searchInput.focus({ preventScroll: true });
    });
    return;
  }

  let targetItem = itemToRefocus ?? firstItem;
  let focusSearchAfter = false;
  if (shouldFocusActiveTab && activeItemElement) {
    targetItem = activeItemElement;
    focusSearchAfter = focusSearchFirst;
  }

  if (targetItem) {
    requestAnimationFrame(() => {
      if (focusSearchAfter && !isFullView) {
        targetItem.scrollIntoView({ block: "center", inline: "nearest" });
      }
      focusElement(targetItem, { preventScroll: isFullView });
      if (focusSearchAfter && focusSearchFirst && searchInput) {
        requestAnimationFrame(() => {
          searchInput.focus({ preventScroll: true });
        });
      }
    });
    shouldFocusActiveTab = false;
    return;
  }

  if (tabContainer.childElementCount === 0) {
    requestAnimationFrame(() => {
      if (document.hasFocus()) {
        if (focusSearchFirst && searchInput) {
          searchInput.focus({ preventScroll: true });
        } else if (!focusFirstTabItem()) {
          focusElement(togglePinnedButton, { preventScroll: isFullView });
        }
      }
    });
  }
}

async function loadTabs() {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    activeTabIdFocusTarget = tabs.find((tab) => tab.active)?.id ?? null;
    shouldFocusActiveTab = Boolean(activeTabIdFocusTarget);
    
    tabCache = tabs.map((tab) => ({
      id: tab.id,
      windowId: tab.windowId,
      title: tab.title,
      url: tab.url,
      index: tab.index ?? 0,
      lastAccessed: tab.lastAccessed ?? 0,
      pinned: Boolean(tab.pinned),
      favIconUrl: tab.favIconUrl,
    }));
    updateTabCount();
    renderTabs(getVisibleTabs());
    updateSortButtonState();
  } catch (error) {
    console.error("Failed to load tabs:", error);
    emptyState.textContent = "Unable to load tabs. Please try again.";
    emptyState.classList.remove("hidden");
  }
}

async function closeSelectedTabs() {
  if (selectedTabIds.size === 0) {
    return;
  }

  const tabIds = Array.from(selectedTabIds);

  if (confirmBeforeClose) {
    const count = tabIds.length;
    if (!confirm(`Close ${count} selected tab${count > 1 ? "s" : ""}?`)) {
      return;
    }
  }

  closeButton.disabled = true;
  closeButton.textContent = "Closing...";

  try {
    await browser.tabs.remove(tabIds);
    removeClosedTabs(tabIds);
  } catch (error) {
    console.error("Failed to close tabs:", error);
    closeButton.textContent = "Try again";
    closeButton.disabled = false;
    return;
  }

  closeButton.textContent = "Close selected tabs";
  closeButton.disabled = selectedTabIds.size === 0;
  requestAnimationFrame(() => {
    if (!focusFirstTabItem()) {
      togglePinnedButton?.focus();
    }
  });
}

closeButton.addEventListener("click", closeSelectedTabs);

async function focusTab(tabId, windowId) {
  try {
    await browser.tabs.update(tabId, { active: true });
    if (typeof windowId === "number") {
      await browser.windows.update(windowId, { focused: true });
    }
    if (closePopupAfterOpen) {
      if (isPopupView) {
        window.close();
      } else if (isFullView) {
        await closeFullViewTab();
      }
    }
  } catch (error) {
    console.error("Failed to focus tab:", error);
  }
}

function setupPanel(button, panel, closeButton) {
  if (!button || !panel || !closeButton) {
    return;
  }
  const togglePanel = (show) => {
    panel.classList.toggle("hidden", !show);
    panel.setAttribute("aria-hidden", String(!show));
    button.setAttribute("aria-expanded", String(show));
    if (show) {
      panel.focus();
    } else {
      requestAnimationFrame(() => {
        focusElement(button, { preventScroll: true });
      });
    }
  };
  button.addEventListener("click", () => {
    const willShow = panel.classList.contains("hidden");
    togglePanel(willShow);
  });
  closeButton.addEventListener("click", () => togglePanel(false));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      togglePanel(false);
    }
  });
  button.setAttribute("aria-expanded", String(!panel.classList.contains("hidden")));
}

setupPanel(hotkeysButton, hotkeysPanel, hotkeysCloseButton);
setupPanel(tipButton, tipPanel, tipCloseButton);

function updateSortButtonState() {
  if (!sortWindowButton || !sortRecentButton || !sortOldestButton) {
    return;
  }
  sortWindowButton.classList.toggle("unified-button--active", sortMode === "window");
  sortRecentButton.classList.toggle("unified-button--active", sortMode === "recent");
  sortOldestButton.classList.toggle("unified-button--active", sortMode === "oldest");
}

function getSortedTabs() {
  const tabs = [...tabCache];
  
  if (pinTabsAtTop) {
    // Split into pinned and unpinned
    const pinned = tabs.filter((tab) => tab.pinned);
    const unpinned = tabs.filter((tab) => !tab.pinned);
    
    // Sort pinned tabs by their original index (maintain relative order)
    pinned.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    
    // Sort unpinned tabs by selected sort mode
    if (sortMode === "recent") {
      unpinned.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
    } else if (sortMode === "oldest") {
      unpinned.sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));
    } else {
      unpinned.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    }
    
    // Return pinned tabs first, then unpinned
    return [...pinned, ...unpinned];
  } else {
    // Sort all tabs together by selected sort mode
    if (sortMode === "recent") {
      tabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
    } else if (sortMode === "oldest") {
      tabs.sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));
    } else {
      tabs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    }
    
    return tabs;
  }
}

function parseSearchQuery(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const terms = trimmed.split(/\s+/).filter((term) => term.length > 0);
  return terms.map((term) => {
    const lowerTerm = term.toLowerCase();
    if (lowerTerm.startsWith("url:")) {
      const value = term.slice(4).trim();
      return { type: "url", value: value.toLowerCase() };
    }
    if (lowerTerm.startsWith("title:")) {
      const value = term.slice(6).trim();
      return { type: "title", value: value.toLowerCase() };
    }
    return { type: "both", value: lowerTerm };
  });
}

function getVisibleTabs() {
  const sorted = getSortedTabs();
  const filteredByPin = hidePinned ? sorted.filter((tab) => !tab.pinned) : sorted;
  const query = searchQuery.trim();
  if (!query) {
    return filteredByPin;
  }
  const searchTerms = parseSearchQuery(query);
  if (searchTerms.length === 0) {
    return filteredByPin;
  }
  return filteredByPin.filter((tab) => {
    const title = (tab.title?.trim() || "").toLowerCase();
    const url = (tab.url || "").toLowerCase();
    return searchTerms.every((term) => {
      if (term.type === "url") {
        return url.includes(term.value);
      }
      if (term.type === "title") {
        return title.includes(term.value);
      }
      return title.includes(term.value) || url.includes(term.value);
    });
  });
}

function setSortMode(mode) {
  if (mode === sortMode) {
    return;
  }
  sortMode = mode;
  updateSortButtonState();
  renderTabs(getVisibleTabs());
  persistSortMode(sortMode).catch((error) => {
    console.error("Unexpected error persisting sort mode:", error);
  });
  requestAnimationFrame(() => {
    if (!searchInput || document.activeElement !== searchInput) {
      focusFirstTabItem();
    }
  });
}

if (sortWindowButton && sortRecentButton && sortOldestButton) {
  sortWindowButton.addEventListener("click", () => setSortMode("window"));
  sortRecentButton.addEventListener("click", () => setSortMode("recent"));
  sortOldestButton.addEventListener("click", () => setSortMode("oldest"));
}

if (togglePinnedButton) {
  togglePinnedButton.addEventListener("click", () => {
    hidePinned = !hidePinned;
    updatePinnedToggleState();
    renderTabs(getVisibleTabs());
  });
  updatePinnedToggleState();
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value ?? "";
    renderTabs(getVisibleTabs());
    updateSearchClearVisibility();
  });
  searchInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      if (focusFirstTabItem()) {
        event.preventDefault();
      }
      return;
    }
    if (event.key === "Escape") {
      if (searchInput.value) {
        searchInput.value = "";
        searchQuery = "";
        renderTabs(getVisibleTabs());
        updateSearchClearVisibility();
      } else {
        searchInput.blur();
      }
      event.preventDefault();
    }
  });
}

if (searchClearButton) {
  searchClearButton.addEventListener("click", () => {
    if (!searchInput) {
      return;
    }
    searchInput.value = "";
    searchQuery = "";
    renderTabs(getVisibleTabs());
    updateSearchClearVisibility();
    searchInput.focus();
  });
}

if (selectVisibleButton) {
  selectVisibleButton.addEventListener("click", () => {
    toggleVisibleSelection();
  });
}

// Scalable Options System
const OPTIONS_CONFIG = [
  {
    id: "launch-full-view",
    label: "Always open Tabula Rasa in full view",
    type: "checkbox",
    storageKey: LAUNCH_FULL_VIEW_KEY,
    defaultValue: false,
    onChange: async (value) => {
      launchFullViewByDefault = value;
      try {
        await browser.storage.local.set({
          [LAUNCH_FULL_VIEW_KEY]: value,
        });
      } catch (error) {
        console.error("Failed to save launch full view preference:", error);
      }
    },
  },
  {
    id: "vertical-layout",
    label: "Use vertical layout (only in full page view)",
    type: "checkbox",
    storageKey: FULL_VIEW_ORIENTATION_KEY,
    defaultValue: ORIENTATION_HORIZONTAL,
    onChange: async (checked) => {
      const mode = checked ? ORIENTATION_VERTICAL : ORIENTATION_HORIZONTAL;
      setFullViewOrientation(mode, { persist: true }).catch((error) => {
        console.error("Failed to save orientation preference:", error);
      });
    },
    getValue: () => fullViewOrientation === ORIENTATION_VERTICAL,
  },
  {
    id: "launch-hotkey",
    label: "Launch hotkey",
    type: "select",
    storageKey: LAUNCH_HOTKEY_KEY,
    defaultValue: "F8",
    options: [
      { value: "F8", label: "F8" },
      { value: "F9", label: "F9" },
      { value: "Ctrl+Comma", label: "Ctrl+Comma" },
      { value: "Ctrl+Shift+Comma", label: "Ctrl+Shift+Comma" },
      { value: "Ctrl+Period", label: "Ctrl+Period" },
      { value: "Ctrl+Shift+Period", label: "Ctrl+Shift+Period" },
    ],
    onChange: async (value) => {
      try {
        await browser.commands.update({
          name: "_execute_action",
          shortcut: value,
        });
        await browser.storage.local.set({
          [LAUNCH_HOTKEY_KEY]: value,
        });
        launchHotkey = value;
        updateLaunchHotkeyDisplay();
      } catch (error) {
        console.error("Failed to update launch hotkey:", error);
      }
    },
  },
  {
    id: "focus-search-first",
    label: "Focus on search bar first",
    type: "checkbox",
    storageKey: FOCUS_SEARCH_FIRST_KEY,
    defaultValue: false,
    onChange: async (value) => {
      focusSearchFirst = value;
      try {
        await browser.storage.local.set({
          [FOCUS_SEARCH_FIRST_KEY]: value,
        });
      } catch (error) {
        console.error("Failed to save focus search first preference:", error);
      }
    },
  },
  {
    id: "confirm-before-close",
    label: "Confirm before closing tabs",
    type: "checkbox",
    storageKey: CONFIRM_BEFORE_CLOSE_KEY,
    defaultValue: true,
    onChange: async (value) => {
      confirmBeforeClose = value;
      try {
        await browser.storage.local.set({
          [CONFIRM_BEFORE_CLOSE_KEY]: value,
        });
      } catch (error) {
        console.error("Failed to save confirm before close preference:", error);
      }
    },
  },
  {
    id: "close-popup-after-open",
    label: "Close popup after opening tab",
    type: "checkbox",
    storageKey: CLOSE_POPUP_AFTER_OPEN_KEY,
    defaultValue: true,
    onChange: async (value) => {
      closePopupAfterOpen = value;
      try {
        await browser.storage.local.set({
          [CLOSE_POPUP_AFTER_OPEN_KEY]: value,
        });
      } catch (error) {
        console.error("Failed to save close popup after open preference:", error);
      }
    },
  },
  {
    id: "hide-pinned-by-default",
    label: "Hide pinned tabs by default",
    type: "checkbox",
    storageKey: HIDE_PINNED_BY_DEFAULT_KEY,
    defaultValue: false,
    onChange: async (value) => {
      hidePinnedByDefault = value;
      hidePinned = value;
      updatePinnedToggleState();
      renderTabs(getVisibleTabs());
      try {
        await browser.storage.local.set({
          [HIDE_PINNED_BY_DEFAULT_KEY]: value,
        });
      } catch (error) {
        console.error("Failed to save hide pinned by default preference:", error);
      }
    },
  },
  {
    id: "pin-tabs-at-top",
    label: "Pinned tabs always at top",
    type: "checkbox",
    storageKey: PIN_TABS_AT_TOP_KEY,
    defaultValue: false,
    onChange: async (value) => {
      pinTabsAtTop = value;
      renderTabs(getVisibleTabs());
      try {
        await browser.storage.local.set({
          [PIN_TABS_AT_TOP_KEY]: value,
        });
      } catch (error) {
        console.error("Failed to save pin tabs at top preference:", error);
      }
    },
  },
  {
    id: "show-favicons",
    label: "Show favicons",
    type: "checkbox",
    storageKey: SHOW_FAVICONS_KEY,
    defaultValue: false,
    onChange: async (value) => {
      showFavicons = value;
      renderTabs(getVisibleTabs());
      try {
        await browser.storage.local.set({
          [SHOW_FAVICONS_KEY]: value,
        });
      } catch (error) {
        console.error("Failed to save show favicons preference:", error);
      }
    },
  },
];

const optionsContainer = document.getElementById("options-container");
const optionsButton = document.getElementById("options-button");
const optionsPanel = document.getElementById("options-panel");
const optionsCloseButton = document.getElementById("options-close");

async function loadOptions() {
  try {
    const stored = await browser.storage.local.get(
      OPTIONS_CONFIG.map((opt) => opt.storageKey)
    );

    OPTIONS_CONFIG.forEach((option) => {
      const storedValue = stored[option.storageKey];
      if (storedValue !== undefined) {
        if (option.type === "checkbox") {
          if (option.id === "vertical-layout") {
            const mode = storedValue === ORIENTATION_VERTICAL;
            if (mode !== (fullViewOrientation === ORIENTATION_VERTICAL)) {
              applyFullViewOrientation(storedValue);
            }
          } else if (option.id === "launch-full-view") {
            launchFullViewByDefault = storedValue;
          } else if (option.id === "focus-search-first") {
            focusSearchFirst = storedValue !== undefined ? storedValue : option.defaultValue;
          } else if (option.id === "confirm-before-close") {
            confirmBeforeClose = storedValue !== undefined ? storedValue : option.defaultValue;
          } else if (option.id === "close-popup-after-open") {
            closePopupAfterOpen = storedValue !== undefined ? storedValue : option.defaultValue;
          } else if (option.id === "hide-pinned-by-default") {
            hidePinnedByDefault = storedValue !== undefined ? storedValue : option.defaultValue;
          } else if (option.id === "pin-tabs-at-top") {
            pinTabsAtTop = storedValue !== undefined ? storedValue : option.defaultValue;
          } else if (option.id === "show-favicons") {
            showFavicons = storedValue !== undefined ? storedValue : option.defaultValue;
          }
        } else if (option.type === "select" && option.id === "launch-hotkey") {
        const hotkey = storedValue || option.defaultValue;
        launchHotkey = hotkey;
        updateLaunchHotkeyDisplay();
          browser.commands.update({
            name: "_execute_action",
            shortcut: hotkey,
          }).catch((error) => {
            console.error("Failed to restore launch hotkey:", error);
          });
        }
      }
    });

    // Render options with restored values
    if (optionsContainer) {
      optionsContainer.innerHTML = "";
      OPTIONS_CONFIG.forEach((option) => {
        const optionItem = document.createElement("div");
        optionItem.className = "option-item";
        optionItem.style.marginBottom = "16px";

        const label = document.createElement("label");
        label.className = "default-toggle";
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "8px";
        label.style.cursor = "pointer";

        if (option.type === "checkbox") {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = option.id;
          const storedValue = stored[option.storageKey];
          checkbox.checked = option.getValue
            ? option.getValue()
            : storedValue !== undefined
            ? storedValue
            : option.defaultValue;

          checkbox.addEventListener("change", () => {
            option.onChange(checkbox.checked);
          });

          const span = document.createElement("span");
          span.textContent = option.label;

          label.appendChild(checkbox);
          label.appendChild(span);
        } else if (option.type === "select") {
          const span = document.createElement("span");
          span.textContent = option.label;
          span.style.marginRight = "8px";

          const select = document.createElement("select");
          select.id = option.id;
          select.style.marginLeft = "auto";
          select.style.padding = "4px 8px";
          select.style.borderRadius = "4px";
          select.style.border = "1px solid var(--border)";

          option.options.forEach((opt) => {
            const optionEl = document.createElement("option");
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            select.appendChild(optionEl);
          });

          const storedValue = stored[option.storageKey];
          select.value = storedValue !== undefined ? storedValue : option.defaultValue;

          select.addEventListener("change", () => {
            option.onChange(select.value);
          });

          label.appendChild(span);
          label.appendChild(select);
        }

        optionItem.appendChild(label);
        optionsContainer.appendChild(optionItem);
      });
    }
  } catch (error) {
    console.error("Failed to load options:", error);
  }
}

// Options panel setup
if (optionsButton && optionsPanel && optionsCloseButton) {
  setupPanel(optionsButton, optionsPanel, optionsCloseButton);
  // Load options when panel opens
  optionsButton.addEventListener("click", () => {
    if (optionsPanel.classList.contains("hidden")) {
      // Panel is about to open, load options
      requestAnimationFrame(() => {
        loadOptions();
      });
    }
  });
}

async function openFullView() {
  try {
    const fullViewUrl = browser.runtime.getURL(FULL_VIEW_FILE);
    const existingTabs = await browser.tabs.query({ url: [fullViewUrl] });
    if (existingTabs.length > 0) {
      const targetTab = existingTabs[0];
      await browser.tabs.update(targetTab.id, { active: true });
      if (typeof targetTab.windowId === "number") {
        await browser.windows.update(targetTab.windowId, { focused: true });
      }
      if (isPopupView) {
        window.close();
      }
      return;
    }
    const createdTab = await browser.tabs.create({ url: fullViewUrl });
    if (isPopupView) {
      window.close();
    } else if (typeof createdTab?.windowId === "number") {
      await browser.windows.update(createdTab.windowId, { focused: true });
    }
  } catch (error) {
    console.error("Failed to open full view:", error);
  }
}

async function closeFullViewTab() {
  try {
    const tab = await browser.tabs.getCurrent();
    if (tab?.id) {
      await browser.tabs.remove(tab.id);
    } else {
      window.close();
    }
  } catch (error) {
    console.error("Failed to close full view:", error);
  }
}

if (expandButton) {
  expandButton.addEventListener("click", () => {
    openFullView().catch((error) => {
      console.error("Unexpected error opening full view:", error);
    });
  });
}

async function init() {
  await restoreSortMode();
  updateSortButtonState();
  updatePinnedToggleState();
  if (isPopupView && launchFullViewByDefault) {
    await openFullView();
    return;
  }
  updateSearchClearVisibility();
  await loadTabs();
  if (isFullView) {
    // Defer to avoid racing browser tab activation and our initial render
    setTimeout(() => {
      ensurePreferredFocus();
    }, 0);
  }
}

init().catch((error) => {
  console.error("Unexpected error initializing popup:", error);
});

function handleGlobalKeydown(event) {
  const isModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  const activeElement = document.activeElement;
  const tagName = activeElement?.tagName?.toLowerCase() ?? "";
  const isEditableTarget =
    activeElement?.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select";

  if (event.key === "?") {
    if (!isEditableTarget && hotkeysButton) {
      event.preventDefault();
      hotkeysButton.click();
    }
    return;
  }

  if (!isModifier && (event.key === "o" || event.key === "O")) {
    if (!isEditableTarget && optionsButton) {
      event.preventDefault();
      optionsButton.click();
    }
    return;
  }

  if (!isModifier && (event.key === "p" || event.key === "P")) {
    if (!isEditableTarget && togglePinnedButton) {
      event.preventDefault();
      togglePinnedButton.click();
    }
    return;
  }

  if (!isModifier && (event.key === "f" || event.key === "F")) {
    if (!isEditableTarget && isPopupView) {
      event.preventDefault();
      openFullView().catch((error) => {
        console.error("Unexpected error opening full view with hotkey:", error);
      });
    }
    return;
  }

  if (!isModifier && (event.key === "q" || event.key === "Q")) {
    if (!isEditableTarget) {
      event.preventDefault();
      if (isFullView) {
        closeFullViewTab().catch((error) => {
          console.error("Unexpected error closing full view with hotkey:", error);
        });
      } else if (isPopupView) {
        try {
          window.close();
        } catch (error) {
          console.error("Unexpected error closing popup with hotkey:", error);
        }
      }
    }
    return;
  }

  if (!isModifier && (event.key === "s" || event.key === "S")) {
    if (!isEditableTarget && searchInput) {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    if (!closeButton.disabled) {
      event.preventDefault();
      closeButton.click();
    }
    return;
  }

  if (isEditableTarget) {
    return;
  }

  if (!isModifier) {
    if (event.key === "a" || event.key === "A") {
      if (toggleVisibleSelection()) {
        event.preventDefault();
      }
      return;
    }
    if ((event.key === "l" || event.key === "L") && isFullView) {
      event.preventDefault();
      const nextOrientation =
        fullViewOrientation === ORIENTATION_VERTICAL ? ORIENTATION_HORIZONTAL : ORIENTATION_VERTICAL;
      setFullViewOrientation(nextOrientation, { persist: true }).catch((error) => {
        console.error("Failed to toggle full view orientation with hotkey:", error);
      });
      return;
    }
    if (event.key === "Enter") {
      const activeItem = getActiveTabItem();
      if (activeItem) {
        event.preventDefault();
        const tabId = Number(activeItem.dataset.tabId);
        const windowId = Number(activeItem.dataset.windowId);
        focusTab(tabId, Number.isNaN(windowId) ? undefined : windowId).catch((error) => {
          console.error("Unexpected error focusing tab with Enter:", error);
        });
      }
      return;
    }
    if (event.key === "1") {
      event.preventDefault();
      setSortMode("window");
      return;
    }
    if (event.key === "2") {
      event.preventDefault();
      setSortMode("recent");
      return;
    }
    if (event.key === "3") {
      event.preventDefault();
      setSortMode("oldest");
      return;
    }
    if (event.key === "x" || event.key === "X") {
      const activeItem = getActiveTabItem();
      if (activeItem) {
        event.preventDefault();
        const tabId = Number(activeItem.dataset.tabId);
        closeSingleTabImmediate(tabId).catch((error) => {
          console.error("Unexpected error closing tab with hotkey:", error);
        });
      }
      return;
    }
  }

  const activeItem = getActiveTabItem();
  if (!activeItem) {
    if (
      (event.key === "j" || event.key === "J" || event.key === "k" || event.key === "K") &&
      !(event.altKey || event.ctrlKey || event.metaKey)
    ) {
      if (focusFirstTabItem()) {
        event.preventDefault();
      }
      return;
    }
    if (event.key === "Home" && !isModifier) {
      if (focusFirstTabItem()) {
        event.preventDefault();
      }
      return;
    }
    if (event.key === "End" && !isModifier) {
      if (focusLastTabItem()) {
        event.preventDefault();
      }
      return;
    }
    // CTRL-J to go to top (like HOME)
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (event.key === "j" || event.key === "J")) {
      if (focusFirstTabItem()) {
        event.preventDefault();
      }
      return;
    }
    // CTRL-K to go to bottom (like END)
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (event.key === "k" || event.key === "K")) {
      if (focusLastTabItem()) {
        event.preventDefault();
      }
      return;
    }
    return;
  }

  const checkbox = activeItem.querySelector(".tab-toggle");
  if (!checkbox) {
    return;
  }

  if ((event.code === "Space" || event.key === " ") && !isModifier) {
    event.preventDefault();
    checkbox.click();
    requestAnimationFrame(() => {
      if (document.activeElement !== activeItem) {
        activeItem.focus();
      }
    });
    return;
  }

  if (
    (event.key === "j" || event.key === "J") &&
    !(event.altKey || event.ctrlKey || event.metaKey)
  ) {
    focusRelativeItem(activeItem, 1);
    event.preventDefault();
    return;
  }

  if (
    (event.key === "k" || event.key === "K") &&
    !(event.altKey || event.ctrlKey || event.metaKey)
  ) {
    focusRelativeItem(activeItem, -1);
    event.preventDefault();
    return;
  }

  if (event.key === "Home" && !isModifier) {
    if (focusFirstTabItem()) {
      event.preventDefault();
    }
    return;
  }

  if (event.key === "End" && !isModifier) {
    if (focusLastTabItem()) {
      event.preventDefault();
    }
    return;
  }

  // CTRL-J to go to top (like HOME)
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (event.key === "j" || event.key === "J")) {
    if (focusFirstTabItem()) {
      event.preventDefault();
    }
    return;
  }

  // CTRL-K to go to bottom (like END)
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (event.key === "k" || event.key === "K")) {
    if (focusLastTabItem()) {
      event.preventDefault();
    }
    return;
  }
}

function focusRelativeItem(currentItem, offset) {
  const items = Array.from(tabContainer.querySelectorAll(".tab-item"));
  const currentIndex = items.indexOf(currentItem);
  if (currentIndex === -1) {
    return;
  }
  const targetIndex = currentIndex + offset;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return;
  }
  const targetItem = items[targetIndex];
  targetItem?.focus();
}

document.addEventListener("keydown", handleGlobalKeydown);

// Re-assert focus when the full view tab gains focus or becomes visible again
window.addEventListener("focus", () => {
  ensurePreferredFocus();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    ensurePreferredFocus();
  }
});

