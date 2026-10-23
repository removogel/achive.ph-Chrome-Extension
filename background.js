// Service Worker: Kontextmenü, Tastenkürzel, Badge-Einstellung.
// Kein fetch(), keine Content-Scripts, keine Host-Berechtigungen.

import { openInArchive, getSettings } from './lib.js';

const WEB = ['http://*/*', 'https://*/*'];

const MENU = [
  { id: 'page-newest', title: 'Neueste Archivkopie dieser Seite öffnen', contexts: ['page'], documentUrlPatterns: WEB },
  { id: 'page-submit', title: 'Diese Seite jetzt archivieren', contexts: ['page'], documentUrlPatterns: WEB },
  { id: 'link-newest', title: 'Neueste Archivkopie des Links öffnen', contexts: ['link'], targetUrlPatterns: WEB },
  { id: 'link-submit', title: 'Link jetzt archivieren', contexts: ['link'], targetUrlPatterns: WEB }
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
  openInArchive(mode, url, tab).catch(console.error);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'open-newest') return;
  if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // Bei nicht archivierbaren Seiten (chrome://, localhost …) passiert bewusst nichts.
  if (tab?.url) openInArchive('newest', tab.url, tab).catch(console.error);
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
