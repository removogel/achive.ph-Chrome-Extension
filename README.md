# Archiv-Link für archive.today

Kleine Chrome-Erweiterung (Manifest V3), die die aktuelle Seite oder einen Link bei
archive.today öffnet – als vertrauenswürdiger Ersatz für die offizielle Erweiterung.
Rund 600 Zeilen inklusive HTML und CSS, keine Abhängigkeiten, kein Build-Schritt: alles
lässt sich in ein paar Minuten selbst prüfen.

## Installation

1. Repository herunterladen – entweder auf GitHub über **Code → Download ZIP** und entpacken,
   oder per `git clone https://github.com/removogel/achive.ph-chrome-extension.git`.
   Den Ordner an einem festen Ort ablegen; Chrome lädt die Erweiterung direkt von dort.
2. In Chrome `chrome://extensions` öffnen und oben rechts den **Entwicklermodus** einschalten.
3. **Entpackte Erweiterung laden** und den Ordner wählen, in dem `manifest.json` liegt.
4. Optional: Symbol über das Puzzle-Menü anheften.

Updates: neue Version herunterladen bzw. `git pull`, dann auf `chrome://extensions` beim
Eintrag auf das Neu-laden-Symbol klicken.

Beim Laden zeigt Chrome den Hinweis, dass die Erweiterung „Inhalte auf beliebigen Seiten
blockieren“ darf. Das kommt von der Schutzregel (siehe unten); die Regel greift nur bei
Anfragen, die von archive.today-Seiten ausgehen.

## Bedienung

| Weg | Funktion |
|---|---|
| Klick aufs Symbol | Popup mit „Neueste Kopie öffnen“, „Alle Kopien anzeigen“, „Jetzt archivieren“ |
| Rechtsklick auf Seite / Link | dieselben Aktionen für die Seite bzw. das Linkziel |
| `Alt+Shift+A` | neueste Kopie der aktuellen Seite direkt öffnen (änderbar unter `chrome://extensions/shortcuts`) |

Verwendete Adressen (`<url>` = bereinigte Seitenadresse):

- Neueste Kopie: `https://archive.ph/newest/<url>`
- Alle Kopien: `https://archive.ph/<url>`
- Archivieren: `https://archive.ph/?run=1&url=<url, kodiert>` (wie das offizielle Bookmarklet)

## Sicherheit und Datenschutz

**Was die Erweiterung darf**

| Berechtigung | Wofür |
|---|---|
| `activeTab` | Adresse des aktuellen Tabs lesen – nur nach deinem Klick/Kürzel, nur für diesen Tab |
| `contextMenus` | Einträge im Rechtsklick-Menü |
| `storage` | deine Einstellungen |
| `declarativeNetRequest` | die Schutzregel |

Keine Host-Berechtigungen, keine Content-Scripts, kein Zugriff auf Seiteninhalte, Verlauf,
Cookies oder andere Tabs. Die Content Security Policy (`default-src 'none'`) verhindert,
dass Popup, Einstellungsseite oder Service Worker selbst Verbindungen aufbauen oder
fremden Code nachladen. Die Erweiterung übergibt die Adresse nur, indem sie einen neuen
Tab öffnet.

Interne Adressen (localhost, 10.x, 192.168.x, 172.16–31.x, `.local`, `fritz.box`, einteilige
Hostnamen, private IPv6) werden nie weitergegeben, ebenso wenig Zugangsdaten in URLs
(`user:pass@`). Tracking-Parameter (utm_…, fbclid, gclid …) werden standardmäßig entfernt,
die übrigen Parameter bleiben Byte für Byte erhalten.

**Die Schutzregel (`rules/schutz.json`)**

Der DDoS-Angriff ab Januar 2026 lief nicht über eine Erweiterung, sondern über JavaScript
in der CAPTCHA-Seite von archive.today selbst: Jeder Besucher schickte im Hintergrund
Anfragen an das Blog gyrovague.com. Das betrifft jeden, der archive.today im Browser öffnet –
auch mit dieser Erweiterung.

Deshalb blockiert die Regel alle Anfragen, die eine archive.*-Seite an fremde Domains
stellt (fetch, Bilder, Scripts, Frames, WebSockets …). Ausgenommen sind nur die
archive-Domains selbst und die CAPTCHA-Anbieter (google.com, gstatic.com, recaptcha.net,
hcaptcha.com). Nebeneffekt: Tracker auf archive.today-Seiten werden ebenfalls blockiert.
Seitenwechsel (Klick auf einen Link in einer Kopie) bleiben erlaubt.

Die Zahl am Symbol zeigt, wie viele Anfragen im aktuellen Tab blockiert wurden. Die Regel
gilt immer, also auch wenn du archive.today ohne die Erweiterung aufrufst. Abschaltbar in
den Einstellungen, falls das CAPTCHA einmal nicht mehr funktioniert.

Grenzen: Die Regel kann keine Anfragen an die freigegebenen CAPTCHA-Domains verhindern und
keine Weiterleitungen der ganzen Seite. Sie ersetzt keinen Inhaltsblocker wie uBlock Origin,
ergänzt ihn aber gut.

## Dateien

```
manifest.json      Berechtigungen, CSP, Regelsatz, Tastenkürzel
lib.js             URL-Prüfung, Bereinigung, Archiv-Adressen, Tab öffnen
background.js      Kontextmenü, Tastenkürzel, Badge
popup.html/.js     Popup
options.html/.js   Einstellungen
style.css          Gestaltung (hell/dunkel)
rules/schutz.json  Schutzregel
icons/             Symbole
```
