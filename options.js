import { MIRRORS, getSettings, RULESET_ID } from './lib.js';

const $ = (id) => document.getElementById(id);
let timer;

function flash() {
  $('saved').textContent = 'Gespeichert';
  clearTimeout(timer);
  timer = setTimeout(() => { $('saved').textContent = ''; }, 1500);
}

async function save(values) {
  await chrome.storage.sync.set(values);
  flash();
}

const settings = await getSettings();

const select = $('mirror');
for (const m of MIRRORS) select.add(new Option(m, m, false, m === settings.mirror));
select.addEventListener('change', () => save({ mirror: select.value }));

for (const key of ['autoOpen', 'cleanUrl', 'foreground', 'badge']) {
  const box = $(key);
  box.checked = settings[key];
  box.addEventListener('change', () => save({ [key]: box.checked }));
}

const protection = $('protection');
protection.checked = (await chrome.declarativeNetRequest.getEnabledRulesets()).includes(RULESET_ID);
protection.addEventListener('change', async () => {
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    protection.checked
      ? { enableRulesetIds: [RULESET_ID] }
      : { disableRulesetIds: [RULESET_ID] }
  );
  flash();
});
