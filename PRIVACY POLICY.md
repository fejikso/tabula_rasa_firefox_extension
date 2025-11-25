# Tabula Rasa (Chrome) Privacy Policy

Last updated: November 25, 2025

## Overview

Tabula Rasa is a keyboard-first tab manager. It runs entirely within your browser and never sends any personal data to external servers. This policy explains what data the extension touches and how it is handled.

## Data Access

Tabula Rasa requests the following Chrome permissions:

- `tabs`: Needed to read the title, URL, pin status, and window focus for tabs in your current window so the UI can display them, activate them, or close the ones you choose.
- `history`: Required only when you type the `history:` search prefix. The extension uses Chrome’s history API to list matching entries and to open or delete them at your explicit request.
- `storage`: Used to store your local preferences (sort mode, layout, hide pinned tabs, confirmations, etc.) so the extension remembers your settings per profile.

The extension does not collect browsing data beyond what is needed to populate the UI. All processing happens locally inside Chrome. No analytics, tracking scripts, or network requests to third-party services are performed.

## Data Sharing

Tabula Rasa does **not** share data with the developer or any third party. The extension has no server backend and no telemetry. All information stays within your browser profile.

## Data Retention

Only preference values are stored using `chrome.storage.local`. You can reset them by uninstalling the extension or by clearing the extension’s storage via Chrome’s extension settings. Tabula Rasa does not retain any additional data.

## Children’s Privacy

The extension is intended for general productivity use and does not knowingly target or collect information from children.

## Changes

If the privacy policy changes, the “Last updated” date above will be revised. Substantive changes will be noted in the project README and release notes.

## Contact

For questions or concerns about privacy, please open an issue on the project repository or contact the developer via the Tip/Feedback link in the extension.
