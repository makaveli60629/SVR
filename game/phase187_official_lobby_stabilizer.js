const LABEL = "UPDATE-3.0-PHASE-187-OFFICIAL-LOBBY-STABILIZER-LOCK";
window.SVR_OFFICIAL_LOBBY_ONLY = true;

const BAD = ["PHASE123","PHASE164","PHASE168","PHASE171","PHASE173","PHASE175","PHASE176_LOBBY_ARENA","PHASE176_JUMBOTRON","CENTER_SPECTATOR_RING","CENTER_FEATURED_TABLE_STAGE","skyline","tower","city","adbuilding","bannerbuilding"];
const KEEP = ["PHASE185","PHASE187","PHASE186","PHASE181","PHASE180","PHASE178","PHASE177","PGA","REIKI","WELLNESS","SPONSOR","STORE","SCORPION","LEGEND","Watch","Wrist","Teleport","Hand","Controller","Moon","Mars"];
function hasAny(name,list){ const n=String(name||"").toLowerCase(); return list.some(x=>n.includes(String(x).toLowerCase())); }
function scan(){
  const scene = window.__SVR_SCENE__;
  let hidden = 0;
  if(scene){
    scene.traverse(obj=>{
      const name = String(obj?.name || "");
      if(name && hasAny(name,BAD) && !hasAny(name,KEEP) && obj.visible !== false){ obj.visible = false; hidden++; }
    });
  }
  window.SVR_PHASE187_STABILIZER = { label: LABEL, active: true, hiddenThisScan: hidden, checkedAt: new Date().toISOString() };
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  const status = document.getElementById("status");
  if(status && /phase|update|ready|loading/i.test(status.textContent || "")) status.textContent = `Ready. ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}
scan();
setTimeout(scan,50);
setTimeout(scan,150);
setTimeout(scan,300);
setTimeout(scan,700);
setInterval(scan,500);
console.log("[Phase187] official lobby stabilizer active");
