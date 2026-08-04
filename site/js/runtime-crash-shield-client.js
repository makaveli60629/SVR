const OUT = document.getElementById('out');
const BUILD = 'PHASE-208-RUNTIME-CRASH-SHIELD-LOCK';
async function load(){
  try {
    const res = await fetch('/api/game/runtime-crash-shield?limit=30', { cache:'no-store' });
    OUT.textContent = res.ok ? JSON.stringify(await res.json(), null, 2) : `Runtime crash shield API pending for ${BUILD}`;
  } catch (e) { OUT.textContent = `Runtime crash shield API not connected yet for ${BUILD}`; }
}
load();
