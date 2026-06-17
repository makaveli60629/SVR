import * as THREE from "three";

const LABEL = "PHASE-304-SCORPION-SEAT-RESERVATION-LOCK";
const ROOT_NAME = "PHASE304_SCORPION_SEAT_RESERVATION_ROOT";
const OPEN_SEAT = { seatId:"SOUTH_PLAYER", seatIndex:0, label:"Open South Seat", x:12, y:0, z:-9.95 };
let installed = false;
let session = null;
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function textureFor(state){
  const c=document.createElement("canvas"); c.width=900; c.height=430;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#04050b"; ctx.fillRect(0,0,900,430);
  ctx.strokeStyle=state.action==="spectate" ? "#7ffcff" : "#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(24,24,852,382);
  ctx.fillStyle="rgba(127,252,255,.10)"; ctx.fillRect(54,56,792,76);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 48px system-ui,Arial"; ctx.fillText(state.action==="spectate" ? "SPECTATOR MODE" : "SEAT RESERVED",450,94);
  ctx.fillStyle="#ffd98a"; ctx.font="900 42px system-ui,Arial"; ctx.fillText(state.title || "SCORPION TABLE",450,174);
  ctx.fillStyle="#e8f4ff"; ctx.font="700 29px system-ui,Arial";
  ctx.fillText(`${state.seatLabel || OPEN_SEAT.label} • ${state.mode || "Practice"}`,450,238);
  ctx.fillText(`Buy-in locked: ${state.buyinChips || 0} chips`,450,292);
  ctx.fillStyle="#7ffcff"; ctx.font="900 24px system-ui,Arial";
  ctx.fillText("Route armed • table state saved",450,354);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function clearPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function showState(state){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearPanel();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-8.82); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.35,1.55),new THREE.MeshBasicMaterial({map:textureFor(state),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE304_SCORPION_SEAT_STATE_PANEL"; panel.position.set(0,2.45,0); panel.renderOrder=275; root.add(panel);
  const color=state.action==="spectate" ? 0x7ffcff : 0xffd98a;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.72,.98,96),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.name="PHASE304_RESERVED_SEAT_RING"; ring.rotation.x=-Math.PI/2; ring.position.set(0,.08,1.15); root.add(ring);
  const marker=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.42,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.82}));
  marker.name="PHASE304_RESERVED_SEAT_MARKER"; marker.position.set(0,.32,1.15); root.add(marker);
  return true;
}
function reserve(detail){
  if(!detail) return null;
  const action = detail.action === "spectate" ? "spectate" : "join";
  session={
    build:LABEL,
    active:true,
    action,
    tableKey:detail.tableKey || "unknown",
    title:detail.title || "Scorpion Table",
    mode:detail.mode || "Practice",
    buyin:detail.buyin || "free view",
    buyinChips:Number(detail.buyinChips || 0),
    seatId:action==="join" ? OPEN_SEAT.seatId : "SPECTATOR",
    seatIndex:action==="join" ? OPEN_SEAT.seatIndex : -1,
    seatLabel:action==="join" ? OPEN_SEAT.label : "Spectator Rail",
    routeTarget:detail.routeTarget || { x:OPEN_SEAT.x, y:OPEN_SEAT.y, z:OPEN_SEAT.z },
    chipsReserved:action==="join" ? Number(detail.buyinChips || 0) : 0,
    confirmedAt:new Date().toISOString(),
    siteTouched:false,
    publicRootTouched:false
  };
  window.SVR_PLAYER_SCORPION_TABLE_SESSION = session;
  window.SVR_PHASE304_LAST_SEAT_RESERVATION = session;
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-seat-reserved",{detail:session})); }catch{}
  showState(session);
  status(`${session.title} ${action==="join" ? "seat reserved" : "spectator rail armed"}`);
  return session;
}
function install(){
  if(installed) return true;
  installed = true;
  window.addEventListener("svr-scorpion-table-join", e=>reserve(e.detail));
  window.SVR_PHASE304_SCORPION_SEAT_RESERVATION_LOCK={
    build:LABEL,
    active:true,
    openSeat:OPEN_SEAT,
    listensFor:"svr-scorpion-table-join",
    emits:"svr-scorpion-seat-reserved",
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
setInterval(()=>{ install(); if(session) showState(session); },4000);
