# CLAUDE.md

Chrome extension (Manifest V3) that opens the current page or a link on archive.today.
Plain JavaScript ES modules, no dependencies, no build step. The repo root is the
unpacked extension: Chrome loads it directly via "Load unpacked".

## Purpose and security model

This extension exists because the official archive.today extension is not trusted.
Security and minimal permissions are the main feature, so treat these as invariants:

- Permissions are exactly `activeTab`, `contextMenus`, `storage`, `declarativeNetRequest`.
  No `host_permissions`, no `content_scripts`, no `tabs`, no `scripting`, no
  `web_accessible_resources`. Adding any of these needs an explicit request from the user.
- No network code in extension JS: no `fetch`, `XMLHttpRequest`, `WebSocket`,
  `sendBeacon`, `EventSource`, `importScripts`, `eval`, `new Function`. The only way an
  address leaves the browser is `chrome.tabs.create` with an archive URL, after a user action.
- The CSP in `manifest.json` (`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; ...`)
  must not be loosened. Consequences: no inline `<script>`, no `<style>`, no `style="..."`
  or `on*=` attributes, no external resources (CDNs, web fonts). All JS and CSS live in
  their own files.
- `prepareUrl()` in `lib.js` must keep rejecting non-http(s) schemes, archive domains,
  and private/internal hosts, and must keep stripping credentials and the fragment.
- The mirror setting is validated against `MIRRORS`; never build a URL from an
  unvalidated stored value.

## Files

| File | Role |
|---|---|
| `manifest.json` | Permissions, CSP, static DNR ruleset `schutz`, command `open-newest` (Alt+Shift+A) |
| `lib.js` | Shared module: `MIRRORS`, `DEFAULTS`, `RULESET_ID`, `ERROR_TEXT`, `isArchiveHost`, `isPrivateHost`, `prepareUrl`, `buildArchiveUrl`, `getSettings`, `openInArchive` |
| `background.js` | Service worker (`type: module`): context menu, keyboard command, badge options |
| `popup.html` / `popup.js` | Toolbar popup with three actions and protection status |
| `options.html` / `options.js` | Settings page (opens in a tab), auto-saves to `chrome.storage.sync` |
| `style.css` | Shared styles for popup and options, light/dark via `prefers-color-scheme` |
| `rules/schutz.json` | Static `declarativeNetRequest` block rule |
| `icons/` | PNG icons 16/32/48/128 (original archive-box motif, not archive.today branding) |

## Key behavior

- Archive URL formats (`buildArchiveUrl`):
  - `newest` → `https://<mirror>/newest/<url>`
  - `list` → `https://<mirror>/<url>`
  - `submit` → `https://<mirror>/?run=1&url=<encodeURIComponent(url)>`
- Tracking-parameter removal works on the raw query string so the encoding of the
  remaining parameters stays byte-identical. Keep the list in `TRACKING_EXACT` /
  `TRACKING_PREFIXES` conservative; a missed tracker is better than a broken URL.
- Settings in `chrome.storage.sync`: `mirror`, `cleanUrl`, `foreground`, `badge`.
  The protection toggle is not stored there; it is the enabled state of the static
  ruleset (`chrome.declarativeNetRequest.updateEnabledRulesets`).
- Protection rule: blocks every non-`main_frame` request whose initiator is an archive
  domain and whose target is not an archive domain or a CAPTCHA provider (google.com,
  gstatic.com, recaptcha.net, hcaptcha.com). Background: in January 2026 archive.today's
  CAPTCHA page ran JavaScript that made visitors' browsers flood a third-party blog.
  The archive domain list in the rule must stay in sync with `MIRRORS` in `lib.js`.
- Badge shows the per-tab count of blocked requests
  (`declarativeNetRequest.setExtensionActionOptions`).
- Service-worker listeners are registered synchronously at top level (MV3 requirement).
  Context menus are created in `runtime.onInstalled`.
- `minimum_chrome_version` is 110; use APIs available there (e.g. callback form of
  `contextMenus.removeAll`).

## Conventions

- User-facing strings (popup, options, context menu, `ERROR_TEXT`) are German.
  Code identifiers are English; code comments are German.
- No frameworks, no bundler, no npm dependencies.
- Keep the code small enough to audit by reading; prefer clarity over abstraction.

## Testing

There is no automated test suite in the repo. To verify changes:

1. `node --check` on each JS file (ES modules with top-level await in `popup.js` / `options.js`).
2. Load unpacked at `chrome://extensions`, check for errors on the extension card and in
   the service-worker console.
3. Exercise popup buttons, both context-menu entries for page and link, and Alt+Shift+A,
   including on `chrome://` and `localhost` pages (buttons must be disabled / nothing opens).
4. Open an archive.today page and confirm the badge counts blocked requests and the
   CAPTCHA still works.

When changing `rules/schutz.json`, use only documented `declarativeNetRequest` condition
keys; an invalid static rule prevents the ruleset from loading.
