// Service Worker: Kontextmenüs und Badge-Einstellung.
// Keine Netzwerkzugriffe, keine Content-Scripts. Das Tastenkürzel ist
// _execute_action im Manifest und öffnet das Popup wie ein Klick aufs Symbol.

import { openInArchive, getSettings } from './lib.js';

const WEB = ['http://*/*', 'https://*/*'];

const MENU = [
  { id: 'page-newest', title: 'Neueste Archivkopie dieser Seite öffnen', contexts: ['page'], documentUrlPatterns: WEB },
  { id: 'page-submit', title: 'Diese Seite jetzt archivieren', contexts: ['page'], documentUrlPatterns: WEB },
  { id: 'link-newest', title: 'Neueste Archivkopie des Links öffnen', contexts: ['link'], targetUrlPatterns: WEB },
  { id: 'link-submit', title: 'Link jetzt archivieren', contexts: ['link'], targetUrlPatterns: WEB },
  // Rechtsklick aufs Symbol: Aktionen, die der Direktsprung überspringt
  { id: 'action-list', title: 'Alle Kopien dieser Seite anzeigen', contexts: ['action'] },
  { id: 'action-submit', title: 'Diese Seite jetzt archivieren', contexts: ['action'] }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    for (const item of MENU) chrome.contextMenus.create(item);
  });
  applyBadgeSetting();
});

chrome.runtime.onStartup.addListener(applyBadgeSetting);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const [source, mode] = String(info.menuItemId).split('-');
  const url = source === 'link' ? info.linkUrl : (info.pageUrl || tab?.url);
  // Bei nicht archivierbaren Seiten (chrome://, localhost …) passiert bewusst nichts.
  openInArchive(mode, url, tab).catch(console.error);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && 'badge' in changes) applyBadgeSetting();
});

async function applyBadgeSetting() {
  const { badge } = await getSettings();
  await chrome.action.setBadgeBackgroundColor({ color: '#b42318' });
  // Zeigt pro Tab, wie viele Fremd-Anfragen die Schutzregel blockiert hat.
  await chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: badge
  });
}
