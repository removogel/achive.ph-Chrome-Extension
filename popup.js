import { getSettings, prepareUrl, openInArchive, ERROR_TEXT, RULESET_ID } from './lib.js';

const $ = (id) => document.getElementById(id);
const buttons = [...document.querySelectorAll('.actions button')];

function shorten(raw) {
  try {
    const u = new URL(raw);
    const s = u.hostname.replace(/^www\./, '') + u.pathname + u.search;
    return s.length > 80 ? s.slice(0, 77) + '…' : s;
  } catch {
    return raw;
  }
}

function showError(code) {
  $('error').textContent = ERROR_TEXT[code] || ERROR_TEXT.invalid;
  $('error').hidden = false;
  for (const b of buttons) b.disabled = true;
}

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const settings = await getSettings();
$('mirror').textContent = settings.mirror;

const prepared = prepareUrl(tab?.url, settings);
if (prepared.error) {
  $('target').textContent = tab?.url ? shorten(tab.url) : '';
  showError(prepared.error);
} else {
  $('target').textContent = shorten(prepared.url);
  $('target').title = prepared.url;
}

for (const btn of buttons) {
  btn.addEventListener('click', async () => {
    const result = await openInArchive(btn.dataset.mode, tab.url, tab);
    if (result.error) showError(result.error);
    else window.close();
  });
}

const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
const protectionOn = enabled.includes(RULESET_ID);
$('status').classList.toggle('on', protectionOn);
$('status-text').textContent = protectionOn ? 'Schutzregel aktiv' : 'Schutzregel aus';

$('options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
});
