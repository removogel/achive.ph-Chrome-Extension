# Archiv-Link for archive.today

A small Chrome extension (Manifest V3) that opens the current page or a link on
archive.today – a trustworthy replacement for the official extension.
About 600 lines including HTML and CSS, no dependencies, no build step: you can review
all of it yourself in a few minutes.

The user interface is in German.

## Installation

1. Download the repository – either via **Code → Download ZIP** on GitHub and unzip it,
   or with `git clone https://github.com/removogel/achive.ph-Chrome-Extension.git`.
   Keep the folder in a permanent location; Chrome loads the extension directly from there.
2. Open `chrome://extensions` in Chrome and switch on **Developer mode** (top right).
3. Click **Load unpacked** and select the folder that contains `manifest.json`.
4. Optional: pin the icon via the puzzle-piece menu.

Updates: download the new version or run `git pull`, then click the reload icon on the
extension's entry in `chrome://extensions`.

When loading, Chrome notes that the extension can "block content on any page". This comes
from the protection rule (see below); the rule only applies to requests that originate
from archive.today pages.

## Usage

| How | What it does |
|---|---|
| Click the icon | Popup with *Neueste Kopie öffnen* (open newest copy), *Alle Kopien anzeigen* (list all copies), *Jetzt archivieren* (archive now) |
| Right-click a page / link | The same actions for the page or the link target |
| `Alt+Shift+A` (`Option+Shift+A` on macOS) | Open the newest copy of the current page directly (change it at `chrome://extensions/shortcuts`) |

URLs used (`<url>` = cleaned page address):

- Newest copy: `https://archive.ph/newest/<url>`
- All copies: `https://archive.ph/<url>`
- Archive now: `https://archive.ph/?run=1&url=<url, encoded>` (same as the official bookmarklet)

The archive domain (archive.ph, archive.today, archive.is, archive.li, archive.md,
archive.vn, archive.fo) can be changed in the settings.

## Security and privacy

**What the extension is allowed to do**

| Permission | Used for |
|---|---|
| `activeTab` | Read the current tab's address – only after your click/shortcut, only for that tab |
| `contextMenus` | Right-click menu entries |
| `storage` | Your settings |
| `declarativeNetRequest` | The protection rule |

No host permissions, no content scripts, no access to page content, history, cookies or
other tabs. The Content Security Policy (`default-src 'none'`) prevents the popup, the
settings page and the service worker from opening connections themselves or loading
third-party code. The extension hands over the address only by opening a new tab.

Internal addresses (localhost, 10.x, 192.168.x, 172.16–31.x, `.local`, `fritz.box`,
single-label hostnames, private IPv6) are never passed on, and neither are credentials
embedded in URLs (`user:pass@`). Tracking parameters (utm_…, fbclid, gclid …) are removed
by default; all other parameters are kept byte for byte.

**The protection rule (`rules/schutz.json`)**

The DDoS attack that started in January 2026 did not run through an extension but through
JavaScript in archive.today's own CAPTCHA page: every visitor sent requests to the blog
gyrovague.com in the background. This affects anyone who opens archive.today in a
browser – with this extension, too.

The rule therefore blocks every request an archive.* page makes to other domains (fetch,
images, scripts, frames, WebSockets …). The only exceptions are the archive domains
themselves and the CAPTCHA providers (google.com, gstatic.com, recaptcha.net,
hcaptcha.com). Side effect: trackers on archive.today pages are blocked as well.
Navigation (clicking a link inside a copy) is still allowed.

The number on the icon shows how many requests were blocked in the current tab. The rule
is always active, including when you open archive.today without using the extension. It
can be switched off in the settings in case the CAPTCHA stops working.

Limits: the rule cannot stop requests to the allowed CAPTCHA domains, nor full-page
redirects. It does not replace a content blocker such as uBlock Origin, but complements it
well.

## Files

```
manifest.json      Permissions, CSP, ruleset, keyboard shortcut
lib.js             URL checks, cleanup, archive URLs, opening tabs
background.js      Context menu, keyboard shortcut, badge
popup.html/.js     Popup
options.html/.js   Settings
style.css          Styling (light/dark)
rules/schutz.json  Protection rule
icons/             Icons
```
