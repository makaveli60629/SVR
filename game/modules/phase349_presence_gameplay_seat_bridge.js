const BUILD = 'PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK';
let installed = false;
let lastSeated = false;
let pending = false;
let claims = 0;
let releases = 0;
let conflicts = 0;
let lastError = null;

function seated() {
  return Boolean(window.SVR_PHASE347_STATE?.seated || window.SVR_PHASE343_STATE?.seated || window.SVR_PHASE348_STATE?.seated);
}
async function sync() {
  if (pending || typeof window.SVR_PHASE349_CLAIM_SEAT !== 'function') return;
  const current = seated();
  if (current === lastSeated) return;
  pending = true;
  try {
    if (current) {
      const accepted = await window.SVR_PHASE349_CLAIM_SEAT(0);
      if (accepted) { claims += 1; lastSeated = true; }
      else {
        conflicts += 1;
        lastError = 'SEAT_0_OCCUPIED';
        window.dispatchEvent(new CustomEvent('svr:presence-seat-conflict', { detail: { seatId: 0, build: BUILD } }));
      }
    } else {
      await window.SVR_PHASE349_RELEASE_SEAT?.();
      releases += 1;
      lastSeated = false;
    }
  } catch (error) { lastError = String(error?.message || error); }
  finally { pending = false; }
}
function qa() {
  const result = {
    build: BUILD,
    active: installed,
    seated: seated(),
    leaseSeated: lastSeated,
    pending,
    claims,
    releases,
    conflicts,
    lastError,
    transport: window.SVR_PHASE349_TRANSPORT?.() || null,
    checkedAt: new Date().toISOString()
  };
  result.pass = installed && typeof window.SVR_PHASE349_CLAIM_SEAT === 'function' && (!result.seated || result.leaseSeated || conflicts > 0);
  window.SVR_PHASE349_SEAT_BRIDGE_QA_STATE = result;
  return result;
}
function install() {
  if (installed) return;
  installed = true;
  const timer = setInterval(() => {
    if (typeof window.SVR_PHASE349_CLAIM_SEAT === 'function') {
      clearInterval(timer);
      lastSeated = false;
      sync();
      setInterval(sync, 650);
    }
  }, 200);
  setTimeout(() => clearInterval(timer), 15000);
  window.addEventListener('svr:phase349-ready', sync);
  window.addEventListener('svr:phase348-ready', sync);
  window.SVR_PHASE349_SEAT_BRIDGE_QA = qa;
}
install();
