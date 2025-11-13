Created by Fejikso
github.

# Tabula Rasa

Tabula Rasa is a lightweight Firefox WebExtension that helps you prune your tab list. It shows every tab open in the current window, lets you check the ones you no longer need, and provides a single button to close them.

## Getting Started

1. Install the Mozilla `web-ext` CLI if you do not already have it:
   ```bash
   npm install --global web-ext
   ```
2. Run the extension in a temporary Firefox profile with live reloading:
   ```bash
   web-ext run
   ```
   The command automatically loads the extension from this directory. Keep the terminal open while developing.

## Manual Testing

If you prefer loading the extension manually:

1. Navigate to `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…**.
3. Select the `manifest.json` file in this project.
4. Click the Tabula Rasa toolbar icon and verify:
   - All current window tabs appear with their titles.
   - Checking boxes enables the **Close selected tabs** button and updates the count.
   - Clicking the button closes the chosen tabs and removes them from the list.

## Packaging for AMO

To produce a signed-ready ZIP archive:

```bash
web-ext build --overwrite-dest
```

The bundle is generated in the `web-ext-artifacts/` directory. You can upload that ZIP to the Firefox Add-ons (AMO) dashboard for signing or distribution.

## Permissions

The extension requests the `tabs` permission so it can enumerate and close the user-selected tabs in the current window. No tab content is read or stored.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

