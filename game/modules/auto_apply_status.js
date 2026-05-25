(function(){
  const BUILD = "PHASE-222-POST-DEPLOY-CHECKLIST-LOCK";
  const state = {
    build: BUILD,
    phase: 218,
    publicPageTouched: false,
    packetPattern: "SVR_PHASE###_NEXT_PACKET.zip",
    command: 'powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-PHASE218.ps1"',
    lastOpenedAt: null
  };
  function panel(){
    let p=document.getElementById("svr-auto-apply-status");
    if(p) return p;
    p=document.createElement("div");
    p.id="svr-auto-apply-status";
    p.style.cssText="position:fixed;right:14px;top:76px;z-index:99992;width:min(520px,calc(100vw - 28px));max-height:70vh;overflow:auto;background:rgba(2,4,10,.93);color:#eaf7ff;border:1px solid rgba(128,210,255,.45);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.55);padding:14px;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;display:none";
    p.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b>SVR Auto Apply Status</b><button id="svrAutoApplyClose" style="border:1px solid #7cf;background:#06131d;color:#eaf7ff;border-radius:999px;padding:4px 10px;cursor:pointer">Close</button></div><hr style="border:0;border-top:1px solid rgba(128,210,255,.25)"><div><b>Build:</b> ${BUILD}</div><div><b>Public page:</b> locked / untouched</div><div><b>Run:</b></div><pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-PHASE218.ps1"</pre><div><b>After push:</b> GitHub → Actions → Auto Deploy → Run workflow → main</div><div><b>Test:</b> /game/?v=phase222-autoapplystatus</div>`;
    document.body.appendChild(p);
    p.querySelector("#svrAutoApplyClose").onclick=()=>p.style.display="none";
    return p;
  }
  function toggle(){
    const p=panel();
    const show=p.style.display==="none";
    p.style.display=show?"block":"none";
    state.lastOpenedAt=new Date().toISOString();
    window.dispatchEvent(new CustomEvent("svr_auto_apply_status_update",{detail:{...state,visible:show}}));
  }
  window.SVR_AUTO_APPLY_STATUS={state,open:()=>{const p=panel();p.style.display="block";return state;},close:()=>{const p=panel();p.style.display="none";return state;},toggle,snapshot:()=>({...state})};
  window.addEventListener("keydown",(ev)=>{if((ev.key||"").toLowerCase()==="i"&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey) toggle();},true);
  window.dispatchEvent(new CustomEvent("svr_auto_apply_status_ready",{detail:state}));
})();
