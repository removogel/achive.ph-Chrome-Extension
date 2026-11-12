import {
  getSettings, prepareUrl, openInArchive, findArchivedCopy, ERROR_TEXT, RULESET_ID
} from './lib.js';

const $ = (id) => document.getElementById(id);
const buttons = { newest: $('btn-newest'), list: $('btn-list'), submit: $('btn-submit') };

function shorten(raw) {
  try {
    const u = new URL(raw);
    const s = u.hostname.replace(/^www\./, '') + u.pathname + u.search;
    return s.length > 80 ? s.slice(0, 77) + '…' : s;
  } catch {
    return raw;
  }
}

// Zeigt die angegebenen Knöpfe; der Hauptknopf rückt per CSS nach oben.
function showActions(modes, primary) {
  $('checking').hidden = true;
  for (const [mode, btn] of Object.entries(buttons)) {
    btn.hidden = !modes.includes(mode);
    btn.classList.toggle('primary', mode === primary);
  }
  $('actions').hidden = false;
}

function showError(code) {
  $('error').textContent = ERROR_TEXT[code] || ERROR_TEXT.invalid;
  $('error').hidden = false;
  showActions(['newest', 'list', 'submit'], 'newest');
  for (const btn of Object.values(buttons)) btn.disabled = true;
}

async function showProtectionStatus() {
  const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
  const on = enabled.includes(RULESET_ID);
  $('status').classList.toggle('on', on);
  $('status-text').textContent = on ? 'Schutzregel aktiv' : 'Schutzregel aus';
}

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const settings = await getSettings();
$('mirror').textContent = settings.mirror;
showProtectionStatus().catch(console.error);

$('options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
});

for (const [mode, btn] of Object.entries(buttons)) {
  btn.addEventListener('click', async () => {
    const result = await openInArchive(mode, tab.url, tab);
    if (result.error) showError(result.error);
    else window.close();
  });
}

const prepared = prepareUrl(tab?.url, settings);
if (prepared.error) {
  $('target').textContent = tab?.url ? shorten(tab.url) : '';
  showError(prepared.error);
} else {
  $('target').textContent = shorten(prepared.url);
  $('target').title = prepared.url;

  if (!settings.autoOpen) {
    showActions(['newest', 'list', 'submit'], 'newest');
  } else {
    $('checking').hidden = false;
    const found = await findArchivedCopy(prepared.url, settings.mirror);
    if (found === 'none') {
      $('notice').hidden = false;
      showActions(['submit', 'list'], 'submit');
    } else {
      // Kopie gefunden – oder Prüfung nicht möglich (z. B. CAPTCHA):
      // dann löst archive.today das im neuen Tab selbst auf.
      await openInArchive('newest', tab.url, tab);
      window.close();
    }
  }
}
