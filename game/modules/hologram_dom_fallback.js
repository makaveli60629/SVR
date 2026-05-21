// PHASE-84-HOLOGRAM-DOM-FALLBACK
// Game-side only. This is a guaranteed visible fallback for the watch HOLO button.
// It does not alter lobby geometry. It only creates a lightweight overlay UI.

const PHASE = "PHASE-84-HOLOGRAM-DOM-FALLBACK";

function css(){
  if (document.getElementById("svr-holo-fallback-style")) return;
  const s = document.createElement("style");
  s.id = "svr-holo-fallback-style";
  s.textContent = `
    #svrHoloFallback{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;pointer-events:none;background:radial-gradient(circle at 50% 34%,rgba(208,92,255,.16),rgba(0,0,0,.08) 32%,rgba(0,0,0,.58));font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff}
    #svrHoloFallback.svr-open{display:flex}.svr-holo-panel{width:min(960px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 28px));overflow:auto;pointer-events:auto;border:1px solid rgba(208,92,255,.78);border-radius:28px;background:linear-gradient(135deg,rgba(5,8,16,.94),rgba(42,10,76,.94));box-shadow:0 0 90px rgba(208,92,255,.28),inset 0 0 54px rgba(127,245,199,.06);padding:22px}.svr-holo-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.svr-holo-k{font-size:12px;font-weight:900;letter-spacing:.18em;color:#7ff5c7}.svr-holo-title{font-size:clamp(28px,4.6vw,54px);line-height:.98;font-weight:1000;margin:4px 0}.svr-holo-sub{color:rgba(246,243,255,.76);font-size:15px}.svr-holo-close{border:1px solid rgba(246,226,127,.72);background:rgba(246,226,127,.10);color:#f6e27f;border-radius:999px;padding:10px 15px;font-weight:1000;cursor:pointer}.svr-holo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.svr-holo-card{min-height:92px;border:1px solid rgba(180,140,255,.45);border-radius:18px;background:linear-gradient(135deg,rgba(127,245,199,.08),rgba(180,140,255,.12));color:#fff;text-align:left;padding:14px;cursor:pointer;box-shadow:inset 0 0 26px rgba(255,255,255,.03)}.svr-holo-card:hover,.svr-holo-card:focus{outline:2px solid rgba(246,226,127,.84);background:linear-gradient(135deg,rgba(208,92,255,.38),rgba(127,245,199,.15))}.svr-holo-card strong{display:block;font-size:20px;letter-spacing:.04em}.svr-holo-card span{display:block;color:#7ff5c7;font-size:12px;font-weight:900;margin-top:7px;text-transform:uppercase}.svr-holo-status{margin-top:14px;color:#f6e27f;font-weight:900;font-size:13px}.svr-holo-note{margin-top:10px;color:rgba(246,243,255,.66);font-size:12px}@media(max-width:720px){.svr-holo-grid{grid-template-columns:1fr 1fr}.svr-holo-panel{padding:16px}.svr-holo-card{min-height:82px}}@media(max-width:460px){.svr-holo-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function card(label, sub, action){
  return `<button class="svr-holo-card" data-action="${action}"><strong>${label}</strong><span>${sub}</span></button>`;
}

export function createHologramDomFallback({ getState = ()=>({}), actions = {} } = {}){
  css();
  const root = document.createElement("div");
  root.id = "svrHoloFallback";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <section class="svr-holo-panel" role="dialog" aria-label="SVR hologram menu">
      <div class="svr-holo-top">
        <div>
          <div class="svr-holo-k">SVR WATCH HOLOGRAM</div>
          <div class="svr-holo-title">HOLOGRAM MENU</div>
          <div class="svr-holo-sub">Guaranteed visible fallback panel. Use this if the 3D card mesh is hard to see in Quest.</div>
        </div>
        <button class="svr-holo-close" data-action="close">CLOSE</button>
      </div>
      <div class="svr-holo-grid">
        ${card("Lobby", "Return route", "goLobby")}
        ${card("Seat", "Open south seat", "goSeat")}
        ${card("Scorpion", "Private poker", "goScorpion")}
        ${card("Reiki Room", "Private scene", "goReikiRoom")}
        ${card("PGA Drive", "Private range", "goPgaDrive")}
        ${card("Chip / Putt", "Private short game", "goChipPutt")}
        ${card("Store", "VR store portal", "goStoreRoom")}
        ${card("Lounge", "Private social", "goSmokerLounge")}
        ${card("Space Station", "Private space scene", "goSpaceStation")}
        ${card("Teleport", "Toggle ON/OFF", "toggleTeleport")}
        ${card("Check / Call", "Poker action", "pokerCall")}
        ${card("Fold", "Poker action", "pokerFold")}
        ${card("Raise", "Poker action", "pokerRaise")}
        ${card("All-In", "Poker action", "pokerAllIn")}
        ${card("Next Hand", "Poker action", "pokerNext")}
      </div>
      <div class="svr-holo-status" id="svrHoloFallbackStatus">Ready.</div>
      <div class="svr-holo-note">Hand tracking: look at fist + clench toggles teleport. Quest controller: hold A/grip/trigger to aim, release to teleport.</div>
    </section>
  `;
  document.body.appendChild(root);

  const status = root.querySelector("#svrHoloFallbackStatus");
  const state = { phase: PHASE, visible: false, lastAction: "none", guaranteedVisible: true };
  window.SVR_PHASE84_HOLOGRAM_DOM_FALLBACK = state;

  function setVisible(next, reason = "manual"){
    state.visible = !!next;
    state.reason = reason;
    root.classList.toggle("svr-open", state.visible);
    root.setAttribute("aria-hidden", state.visible ? "false" : "true");
    window.SVR_PHASE84_HOLOGRAM_DOM_FALLBACK = state;
    return state.visible;
  }
  function toggle(reason = "toggle"){
    return setVisible(!state.visible, reason);
  }
  function showMessage(text){
    if (status) status.textContent = text;
  }

  root.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    state.lastAction = action;
    if (action === "close"){
      setVisible(false, "close-button");
      return;
    }
    const fn = actions[action];
    if (typeof fn === "function"){
      const result = fn();
      showMessage(`${btn.textContent.trim()} selected.`);
      if (/^go/i.test(action)) setVisible(false, `route-${action}`);
      return result;
    }
    showMessage(`Action unavailable: ${action}`);
  });

  window.addEventListener("keydown", (e)=>{
    if (e.code === "Escape" && state.visible) setVisible(false, "escape-key");
  });

  return { setVisible, toggle, getState:()=>({ ...state, game:getState?.() || {} }) };
}
