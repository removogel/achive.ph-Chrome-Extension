// Gemeinsame Logik für Popup, Optionen und Service Worker.
// Diese Datei macht keine Netzwerkzugriffe. Sie baut nur URLs und öffnet Tabs.

// Alle Domains gehören zum selben Dienst (archive.today).
export const MIRRORS = Object.freeze([
  'archive.ph',
  'archive.today',
  'archive.is',
  'archive.li',
  'archive.md',
  'archive.vn',
  'archive.fo'
]);

export const DEFAULTS = Object.freeze({
  mirror: 'archive.ph',
  cleanUrl: true,   // Tracking-Parameter entfernen
  foreground: true, // Archiv-Tab im Vordergrund öffnen
  badge: true       // Zahl blockierter Fremd-Anfragen am Symbol zeigen
});

// ID des statischen Regelsatzes aus manifest.json
export const RULESET_ID = 'schutz';

export const ERROR_TEXT = Object.freeze({
  invalid: 'Für diesen Tab ist keine Webadresse verfügbar.',
  scheme: 'Nur normale Webseiten (http/https) lassen sich archivieren.',
  archive: 'Das ist bereits eine Seite von archive.today.',
  private: 'Interne Adressen (localhost, Heimnetz, Intranet) werden nicht an archive.today geschickt.'
});

// Reine Tracking-Parameter. Bewusst konservativ: lieber einen zu wenig entfernen
// als eine Seite kaputt zu machen.
const TRACKING_EXACT = new Set([
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid', 'msclkid',
  'yclid', 'twclid', 'ttclid', 'igshid', 'igsh', 'li_fat_id',
  'mc_cid', 'mc_eid', '_hsenc', '_hsmi', 'mkt_tok',
  'oly_anon_id', 'oly_enc_id', 'vero_id', 'wt_mc', 'wt_zmc',
  'at_medium', 'at_campaign', 'ref_src'
]);
const TRACKING_PREFIXES = ['utm_', 'mtm_', 'pk_'];

export function isArchiveHost(hostname) {
  const h = hostname.toLowerCase();
  return MIRRORS.some((m) => h === m || h.endsWith('.' + m));
}

export function isPrivateHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === 'localhost') return true;
  if (['.localhost', '.local', '.internal', '.lan', '.home.arpa', '.fritz.box']
    .some((suffix) => h === suffix.slice(1) || h.endsWith(suffix))) return true;

  // IPv6 (URL.hostname liefert sie in eckigen Klammern)
  if (h.startsWith('[')) return /^\[(::1\]|::\]|f[cd]|fe[89ab])/.test(h);

  // IPv4
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127);
  }

  // Einteilige Namen wie "intranet" oder "nas"
  return !h.includes('.');
}

// Prüft und bereinigt eine Adresse. Liefert { url } oder { error }.
export function prepareUrl(raw, { cleanUrl } = DEFAULTS) {
  if (!raw) return { error: 'invalid' };
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { error: 'invalid' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { error: 'scheme' };
  if (isArchiveHost(u.hostname)) return { error: 'archive' };
  if (isPrivateHost(u.hostname)) return { error: 'private' };

  // Zugangsdaten in der URL niemals weitergeben
  u.username = '';
  u.password = '';
  // Fragmente (#…) erreichen den Server nie und würden im Archivpfad stören
  u.hash = '';

  if (cleanUrl && u.search.length > 1) {
    // Paare als Rohtext filtern, damit die Kodierung der übrigen Parameter
    // exakt erhalten bleibt (URLSearchParams würde z. B. %20 zu + machen).
    const pairs = u.search.slice(1).split('&');
    const kept = pairs.filter((pair) => !isTrackingKey(pair.split('=')[0]));
    if (kept.length !== pairs.length) u.search = kept.length ? '?' + kept.join('&') : '';
  }
  return { url: u.href };
}

function isTrackingKey(rawKey) {
  let k;
  try {
    k = decodeURIComponent(rawKey.replace(/\+/g, ' '));
  } catch {
    k = rawKey;
  }
  k = k.toLowerCase();
  return TRACKING_EXACT.has(k) || TRACKING_PREFIXES.some((p) => k.startsWith(p));
}

export function buildArchiveUrl(mode, pageUrl, mirror) {
  const host = MIRRORS.includes(mirror) ? mirror : DEFAULTS.mirror;
  switch (mode) {
    case 'newest': // springt direkt zur neuesten Kopie
      return `https://${host}/newest/${pageUrl}`;
    case 'list':   // Liste aller Kopien dieser Adresse
      return `https://${host}/${pageUrl}`;
    case 'submit': // neue Kopie anlegen (wie das offizielle Bookmarklet)
      return `https://${host}/?run=1&url=${encodeURIComponent(pageUrl)}`;
    default:
      throw new Error('Unbekannter Modus: ' + mode);
  }
}

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return {
    mirror: MIRRORS.includes(stored.mirror) ? stored.mirror : DEFAULTS.mirror,
    cleanUrl: stored.cleanUrl !== false,
    foreground: stored.foreground !== false,
    badge: stored.badge !== false
  };
}

// Öffnet die Archivseite in einem neuen Tab neben dem aktuellen.
export async function openInArchive(mode, rawUrl, tab) {
  const settings = await getSettings();
  const prepared = prepareUrl(rawUrl, settings);
  if (prepared.error) return prepared;

  const url = buildArchiveUrl(mode, prepared.url, settings.mirror);
  const props = { url, active: settings.foreground };
  if (tab && Number.isInteger(tab.id) && tab.id >= 0) {
    props.openerTabId = tab.id;
    props.windowId = tab.windowId;
    if (Number.isInteger(tab.index)) props.index = tab.index + 1;
  }
  await chrome.tabs.create(props);
  return { url };
}
