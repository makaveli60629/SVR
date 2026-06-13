const PHASE = "UPDATE-3.0-PHASE-173-SINGLE-OCTAGON-WALL-LOCOMOTION-AUDIT-LOCK";

function getPlatform(){
  const ua = navigator.userAgent || "";
  if(/Quest|Oculus/i.test(ua)) return "Quest WebXR";
  if(/Android/i.test(ua)) return "Android Browser";
  return "Desktop Browser";
}
function audit(){
  const state = {
    phase: PHASE,
    platform: getPlatform(),
    gameReady: !!window.__SVR_GAME_READY__,
    androidSmart: !!window.__SVR_ANDROID_SMART_LOCK__,
    singleWall: !!window.SVR_PHASE173_SINGLE_WALL,
    cleanSky: !!window.SVR_PHASE171_CLEAN_LOBBY_SKY,
    sponsorSchedule: !!window.SVR_PHASE172C_SPONSOR_SCHEDULE,
    rules: [
      "Quest hands: fist arms purple teleport, pinch executes",
      "Controller fallback: trigger or grip release executes teleport",
      "Forward/back must follow head or camera direction",
      "Android sticks only on Android browser",
      "Desktop keyboard preview remains available"
    ],
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE173_LOCOMOTION_AUDIT = state;
  return state;
}
function showPanel(){
  const s = audit();
  let el = document.getElementById("svrPhase173LocomotionAudit");
  if(!el){
    el = document.createElement("div");
    el.id = "svrPhase173LocomotionAudit";
    el.style.cssText = "position:fixed;left:10px;top:132px;z-index:10000;width:min(380px,calc(100vw - 20px));max-height:52vh;overflow:auto;background:rgba(0,0,0,.72);color:#eaffff;border:1px solid rgba(127,255,242,.45);border-radius:16px;padding:10px 12px;font:12px/1.35 monospace;box-shadow:0 12px 38px rgba(0,0,0,.45)";
    document.body.appendChild(el);
  }
  el.innerHTML = "<strong style='color:#7ffcff'>PHASE 173 LOCOMOTION AUDIT</strong><pre style='white-space:pre-wrap;margin:8px 0 0'>" + JSON.stringify(s,null,2) + "</pre><button id='svr173Hide' style='margin-top:8px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:#111827;color:#fff;padding:6px 10px'>hide</button>";
  el.querySelector("#svr173Hide").onclick = ()=>{ el.style.display = "none"; };
  el.style.display = "block";
}
export function installPhase173LocomotionAudit(){
  audit();
  const q = new URLSearchParams(location.search);
  if(q.has("audit") || q.has("phase173")) showPanel();
  window.addEventListener("keydown", e=>{ if(e.code === "F10") showPanel(); });
  setInterval(audit, 2500);
  console.log("[Phase173] locomotion audit active");
}
