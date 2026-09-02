const EXPECTED_HASH = '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225';
const SESSION_KEY = 'svrDealerLabUnlockedV1';
const PERSIST_KEY = 'svrDealerLabRememberedV1';
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

const gate = document.getElementById('gate');
const keyInput = document.getElementById('labKey');
const unlockBtn = document.getElementById('unlockBtn');
const error = document.getElementById('gateError');

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function rememberAccess() {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify({
      version: 1,
      unlockedAt: Date.now(),
      expiresAt: Date.now() + REMEMBER_MS
    }));
  } catch {}
}

function hasRememberedAccess() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return false;
    const record = JSON.parse(raw);
    if (!record || record.version !== 1 || !Number.isFinite(Number(record.expiresAt))) return false;
    if (Date.now() >= Number(record.expiresAt)) {
      localStorage.removeItem(PERSIST_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function clearRememberedAccess() {
  try { localStorage.removeItem(PERSIST_KEY); } catch {}
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

async function launch() {
  gate.style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  document.getElementById('xrHint').style.display = 'block';
  await import('./dealer-lab-v427.js?v=phase444');
  await import('./table-surface-authority-phase437.js?v=phase444');
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
    rememberAccess();
    await launch();
  } finally {
    unlockBtn.disabled = false;
  }
}

unlockBtn.addEventListener('click', unlock);
keyInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') unlock();
});

const params = new URLSearchParams(location.search);
if (params.get('forgetLab') === '1') clearRememberedAccess();

if (sessionStorage.getItem(SESSION_KEY) === '1' || hasRememberedAccess()) {
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
  launch();
} else {
  requestAnimationFrame(() => keyInput.focus());
}

window.SVR_DEALER_LAB_ACCESS = Object.freeze({
  remembered: hasRememberedAccess(),
  rememberDays: 30,
  clear: clearRememberedAccess
});
