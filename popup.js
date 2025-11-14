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
const pathName = window.location.pathname || "";
const FULL_VIEW_FILE = "tabula-rasa-full-view.html";
const isPopupView = pathName.endsWith("/popup.html") || pathName.endsWith("popup.html");
const isFullView = pathName.endsWith(`/${FULL_VIEW_FILE}`) || pathName.endsWith(FULL_VIEW_FILE);

const selectedTabIds = new Set();
let tabCache = [];
let sortMode = "window";
const SORT_MODE_KEY = "tabulaRasa.sortMode";
const LAUNCH_FULL_VIEW_KEY = "tabulaRasa.launchFullView";
let hidePinned = true;
let searchQuery = "";
let launchFullViewByDefault = false;
let activeTabIdFocusTarget = null;
let shouldFocusActiveTab = false;

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

function focusFirstTabItem() {
  const firstItem = tabContainer.querySelector(".tab-item");
  if (firstItem) {
    firstItem.focus();
    return true;
  }
  return false;
}

async function restoreSortMode() {
  try {
    const stored = await browser.storage.local.get([SORT_MODE_KEY, LAUNCH_FULL_VIEW_KEY]);
    const savedMode = stored?.[SORT_MODE_KEY];
    if (isValidSortMode(savedMode)) {
      sortMode = savedMode;
    }
    if (typeof stored?.[LAUNCH_FULL_VIEW_KEY] === "boolean") {
      launchFullViewByDefault = stored[LAUNCH_FULL_VIEW_KEY];
    }
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
      ? `Close ${selectedTabIds.size} selected tab${selectedTabIds.size > 1 ? "s" : ""}`
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
  togglePinnedButton.classList.toggle("active", hidePinned);
  togglePinnedButton.setAttribute("aria-pressed", String(hidePinned));
  togglePinnedButton.textContent = hidePinned ? "Hide pinned" : "Show pinned";
}

function updateDefaultLaunchCheckbox() {
  if (!defaultFullViewCheckbox) {
    return;
  }
  defaultFullViewCheckbox.checked = launchFullViewByDefault;
}

function updateSearchClearVisibility() {
  if (!searchClearButton) {
    return;
  }
  const hasQuery = (searchInput?.value?.length ?? 0) > 0;
  searchClearButton.disabled = !hasQuery;
  searchClearButton.setAttribute("aria-disabled", String(!hasQuery));
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

function handleCheckboxChange(tabId, checkbox) {
  if (checkbox.checked) {
    selectedTabIds.add(tabId);
  } else {
    selectedTabIds.delete(tabId);
  }
  updateCloseButtonState();
  updateSelectVisibleButton();
}

function removeClosedTabs(closedIds) {
  const closedSet = new Set(closedIds);
  tabCache = tabCache.filter((tab) => !closedSet.has(tab.id));
  closedIds.forEach((tabId) => {
    selectedTabIds.delete(tabId);
  });
  updateCloseButtonState();
  renderTabs(getVisibleTabs());
}

function renderTabs(tabs) {
  const activeTabId =
    document.activeElement?.closest(".tab-item")?.dataset.tabId ?? null;
  let itemToRefocus = null;
  let firstItem = null;
  let activeItemElement = null;
  const searchHasFocus = document.activeElement === searchInput;

  tabContainer.innerHTML = "";
  tabs.forEach((tab) => {
    const clone = tabTemplate.content.cloneNode(true);
    const item = clone.querySelector(".tab-item");
    const checkbox = clone.querySelector(".tab-toggle");
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

    const displayTitle = tab.title?.trim() || tab.url || "Untitled tab";
    titleButton.textContent = displayTitle;
    titleButton.title = displayTitle;
    checkbox.checked = selectedTabIds.has(tab.id);

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

  let targetItem = itemToRefocus ?? firstItem;
  let focusSearchAfter = false;
  if (shouldFocusActiveTab && activeItemElement) {
    targetItem = activeItemElement;
    focusSearchAfter = true;
  }

  if (targetItem) {
    requestAnimationFrame(() => {
      if (focusSearchAfter) {
        targetItem.scrollIntoView({ block: "center", inline: "nearest" });
      }
      targetItem.focus();
      if (focusSearchAfter) {
        requestAnimationFrame(() => {
          searchInput?.focus({ preventScroll: true });
        });
      }
    });
    shouldFocusActiveTab = false;
    return;
  }

  if (tabContainer.childElementCount === 0) {
    requestAnimationFrame(() => {
      if (document.hasFocus()) {
        if (!focusFirstTabItem()) {
          togglePinnedButton?.focus();
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
    }));
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
    if (show) {
      panel.focus();
    }
  };
  button.addEventListener("click", () => togglePanel(true));
  closeButton.addEventListener("click", () => togglePanel(false));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      togglePanel(false);
    }
  });
}

setupPanel(hotkeysButton, hotkeysPanel, hotkeysCloseButton);
setupPanel(tipButton, tipPanel, tipCloseButton);

function updateSortButtonState() {
  if (!sortWindowButton || !sortRecentButton || !sortOldestButton) {
    return;
  }
  sortWindowButton.classList.toggle("active", sortMode === "window");
  sortRecentButton.classList.toggle("active", sortMode === "recent");
  sortOldestButton.classList.toggle("active", sortMode === "oldest");
}

function getSortedTabs() {
  const tabs = [...tabCache];
  if (sortMode === "recent") {
    return tabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  }
  if (sortMode === "oldest") {
    return tabs.sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));
  }
  return tabs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

function getVisibleTabs() {
  const sorted = getSortedTabs();
  const filteredByPin = hidePinned ? sorted.filter((tab) => !tab.pinned) : sorted;
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return filteredByPin;
  }
  return filteredByPin.filter((tab) => {
    const title = tab.title?.toLowerCase() ?? "";
    const url = tab.url?.toLowerCase() ?? "";
    return title.includes(query) || url.includes(query);
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
    const visibleTabs = getVisibleTabs();
    if (visibleTabs.length === 0) {
      return;
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
    renderTabs(getVisibleTabs());
  });
}

if (defaultFullViewCheckbox) {
  defaultFullViewCheckbox.addEventListener("change", async () => {
    launchFullViewByDefault = defaultFullViewCheckbox.checked;
    try {
      await browser.storage.local.set({
        [LAUNCH_FULL_VIEW_KEY]: launchFullViewByDefault,
      });
    } catch (error) {
      console.error("Failed to save default launch preference:", error);
    }
  });
  updateDefaultLaunchCheckbox();
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
  updateDefaultLaunchCheckbox();
  if (isPopupView && launchFullViewByDefault) {
    await openFullView();
    return;
  }
  updateSearchClearVisibility();
  await loadTabs();
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
    if (!isEditableTarget && isFullView) {
      event.preventDefault();
      closeFullViewTab().catch((error) => {
        console.error("Unexpected error closing full view with hotkey:", error);
      });
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

  if (!isModifier && !isEditableTarget) {
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

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    if (!closeButton.disabled) {
      event.preventDefault();
      closeButton.click();
    }
    return;
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

