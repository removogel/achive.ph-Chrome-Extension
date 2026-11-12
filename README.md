# Archiv-Link for archive.today

A small Chrome extension (Manifest V3) that opens the current page or a link on
archive.today – a trustworthy replacement for the official extension.
About 650 lines including HTML and CSS, no dependencies, no build step: you can review
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

Chrome lists two permissions when loading: the extension can "block content on any page"
(the protection rule, which only applies to requests made by archive.today pages) and
"read and change your data on archive.ph, archive.today, …" (needed to ask archive.today
whether a copy exists). Both are explained below.

## Usage

| How | What it does |
|---|---|
| Click the icon | If archive.today already has a copy, the newest one opens right away. Otherwise a menu appears with *Jetzt archivieren* (archive now) and *Alle Kopien anzeigen* (list all copies). |
| Right-click the icon | *Alle Kopien dieser Seite anzeigen* (list all copies) and *Diese Seite jetzt archivieren* (archive now) – e.g. to make a fresh copy when an older one exists |
| Right-click a page / link | Open the newest copy, or archive now, for the page or the link target |
| `Alt+Shift+A` (`Option+Shift+A` on macOS) | Same as clicking the icon (change it at `chrome://extensions/shortcuts`) |

The direct jump can be switched off in the settings. The popup then always shows all three
actions, and the extension makes no network requests of its own.

URLs used (`<url>` = cleaned page address):

- Copy check: `https://archive.ph/timemap/<url>` (Memento TimeMap: 200 = copies exist, 404 = none)
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
| Host access to the seven archive domains (https only) | The copy check |

No content scripts, no access to page content, history, cookies or other tabs.

**The copy check.** When you click the icon, the extension sends one request to
archive.today's TimeMap for the page you are on – the same address archive.today would get
anyway when you open the copy. It only looks at the HTTP status and content type; the
response is never read, displayed or executed, so no archive.today JavaScript runs. If the
answer is unclear (CAPTCHA, timeout, offline), the extension simply opens the newest-copy
URL and lets archive.today sort it out in the tab. The Content Security Policy
(`default-src 'none'`, `connect-src` limited to the archive domains) prevents connections to
anywhere else and blocks loading third-party code.

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
lib.js             URL checks, cleanup, archive URLs, copy check, opening tabs
background.js      Context menus, badge
popup.html/.js     Popup: copy check, direct jump, menu
options.html/.js   Settings
style.css          Styling (light/dark)
rules/schutz.json  Protection rule
icons/             Icons
```
