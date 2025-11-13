const tabContainer = document.getElementById("tab-container");
const emptyState = document.getElementById("empty-state");
const closeButton = document.getElementById("close-selected");
const tabTemplate = document.getElementById("tab-item-template");
const aboutButton = document.getElementById("about-button");
const aboutPanel = document.getElementById("about-panel");
const aboutCloseButton = document.getElementById("about-close");
const sortWindowButton = document.getElementById("sort-window");
const sortRecentButton = document.getElementById("sort-recent");
const sortOldestButton = document.getElementById("sort-oldest");
const expandButton = document.getElementById("expand-button");
const togglePinnedButton = document.getElementById("toggle-pinned");

const selectedTabIds = new Set();
let tabCache = [];
let sortMode = "window";
const SORT_MODE_KEY = "tabulaRasa.sortMode";
let hidePinned = true;

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
    const stored = await browser.storage.local.get(SORT_MODE_KEY);
    const savedMode = stored?.[SORT_MODE_KEY];
    if (isValidSortMode(savedMode)) {
      sortMode = savedMode;
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
}

function updatePinnedToggleState() {
  if (!togglePinnedButton) {
    return;
  }
  togglePinnedButton.classList.toggle("active", hidePinned);
  togglePinnedButton.setAttribute("aria-pressed", String(hidePinned));
  togglePinnedButton.textContent = hidePinned ? "Hide pinned" : "Show pinned";
}

function handleCheckboxChange(tabId, checkbox) {
  if (checkbox.checked) {
    selectedTabIds.add(tabId);
  } else {
    selectedTabIds.delete(tabId);
  }
  updateCloseButtonState();
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

  tabContainer.innerHTML = "";
  tabs.forEach((tab) => {
    const clone = tabTemplate.content.cloneNode(true);
    const item = clone.querySelector(".tab-item");
    const checkbox = clone.querySelector(".tab-toggle");
    const titleButton = clone.querySelector(".tab-title");

    item.dataset.tabId = tab.id;
    item.tabIndex = 0;

    const displayTitle = tab.title?.trim() || tab.url || "Untitled tab";
    titleButton.textContent = displayTitle;
    titleButton.title = displayTitle;
    checkbox.checked = selectedTabIds.has(tab.id);

    checkbox.addEventListener("change", () => handleCheckboxChange(tab.id, checkbox));
    titleButton.addEventListener("click", () => focusTab(tab.id, tab.windowId));

    tabContainer.appendChild(clone);

    if (!firstItem) {
      firstItem = item;
    }

    if (activeTabId && String(tab.id) === activeTabId) {
      itemToRefocus = item;
    }
  });

  toggleEmptyState();

  const targetItem = itemToRefocus ?? firstItem;
  if (targetItem) {
    requestAnimationFrame(() => {
      targetItem?.focus();
    });
  } else if (tabContainer.childElementCount === 0) {
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

function toggleAboutPanel(show) {
  if (!aboutPanel) {
    return;
  }

  aboutPanel.classList.toggle("hidden", !show);
  if (show) {
    aboutPanel.focus();
  }
}

if (aboutButton && aboutCloseButton) {
  aboutButton.addEventListener("click", () => toggleAboutPanel(true));
  aboutCloseButton.addEventListener("click", () => toggleAboutPanel(false));

  aboutPanel?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleAboutPanel(false);
    }
  });
}

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
  if (!hidePinned) {
    return sorted;
  }
  return sorted.filter((tab) => !tab.pinned);
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

if (expandButton) {
  expandButton.addEventListener("click", async () => {
    try {
      const fullViewUrl = browser.runtime.getURL("full.html");
      await browser.tabs.create({ url: fullViewUrl });
      window.close();
    } catch (error) {
      console.error("Failed to open full view:", error);
    }
  });
}

async function init() {
  await restoreSortMode();
  updateSortButtonState();
  await loadTabs();
}

init().catch((error) => {
  console.error("Unexpected error initializing popup:", error);
});

function handleGlobalKeydown(event) {
  const isModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    if (!closeButton.disabled) {
      event.preventDefault();
      closeButton.click();
    }
    return;
  }

  const activeElement = document.activeElement;
  if (!activeElement) {
    return;
  }
  const activeItem = activeElement.closest(".tab-item");
  if (!activeItem) {
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

