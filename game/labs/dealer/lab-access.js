const EXPECTED_HASH = 'ee20b3b390a6c8e31ce0dff0ed68dfc01d67edb9ad53fcf51bba66ea7f9d4292';
const SESSION_KEY = 'svrDealerLabUnlockedV1';

const gate = document.getElementById('gate');
const keyInput = document.getElementById('labKey');
const unlockBtn = document.getElementById('unlockBtn');
const error = document.getElementById('gateError');

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function launch() {
  gate.style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  document.getElementById('xrHint').style.display = 'block';
  await import('./dealer-lab.js');
}

async function unlock() {
  error.textContent = '';
  const value = keyInput.value.trim();
  if (!value) {
    error.textContent = 'Enter the dealer-lab key.';
    return;
  }
  unlockBtn.disabled = true;
  try {
    const digest = await sha256Hex(value);
    if (digest !== EXPECTED_HASH) {
      error.textContent = 'Access key not accepted.';
      keyInput.select();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');
    await launch();
  } finally {
    unlockBtn.disabled = false;
  }
}

unlockBtn.addEventListener('click', unlock);
keyInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') unlock();
});

if (sessionStorage.getItem(SESSION_KEY) === '1') {
  launch();
} else {
  requestAnimationFrame(() => keyInput.focus());
}
