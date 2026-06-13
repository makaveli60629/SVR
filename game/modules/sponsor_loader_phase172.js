import * as THREE from "three";

function makeCanvasTexture(width, height, painter){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height, canvas);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  tex.generateMipmaps = true;
  return tex;
}
function safeText(value, fallback = ""){
  return String(value || fallback).replace(/[<>]/g, "");
}
function parseDateOnly(value){
  if(!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function minutesFromHHMM(value){
  const m = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if(!m) return null;
  const hh = Math.max(0, Math.min(23, Number(m[1])));
  const mm = Math.max(0, Math.min(59, Number(m[2])));
  return hh * 60 + mm;
}
function dayName(date){
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][date.getDay()];
}
export function evaluateSponsorSchedule(profile, now = new Date()){
  const status = String(profile?.approvalStatus || "").toLowerCase();
  if(!profile?.approved || ["denied","paused","expired"].includes(status)) return { active:false, reason:`not active: ${status || "not approved"}` };
  const schedule = profile?.schedule || {};
  const start = parseDateOnly(schedule.startDate);
  const end = parseDateOnly(schedule.endDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if(start && today < start) return { active:false, reason:`starts ${schedule.startDate}` };
  if(end && today > end) return { active:false, reason:`ended ${schedule.endDate}` };
  const days = Array.isArray(schedule.days) ? schedule.days.map(d=>String(d).toLowerCase()) : [];
  if(days.length && !days.includes(dayName(now).toLowerCase())) return { active:false, reason:`off schedule today (${dayName(now)})` };
  const hours = Array.isArray(schedule.hours) ? schedule.hours : [];
  if(hours.length >= 2){
    const open = minutesFromHHMM(hours[0]);
    const close = minutesFromHHMM(hours[1]);
    const current = now.getHours() * 60 + now.getMinutes();
    if(open !== null && close !== null){
      const inWindow = open <= close ? current >= open && current <= close : current >= open || current <= close;
      if(!inWindow) return { active:false, reason:`outside hours ${hours[0]}-${hours[1]}` };
    }
  }
  return { active:true, reason:"approved and in schedule" };
}
function drawSponsorPanel(profile, scheduleState){
  const accent = profile?.display?.accentColor || "#5fffd8";
  return makeCanvasTexture(1600, 980, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#021010"); g.addColorStop(.55,"#09101d"); g.addColorStop(1,"#140721");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent; ctx.lineWidth = 14; ctx.strokeRect(34,34,w-68,h-68);
    ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(78,74,w-156,112);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = accent; ctx.font = "900 42px system-ui,Arial"; ctx.fillText(scheduleState?.active ? "ACTIVE APPROVED SPONSOR" : "APPROVED SPONSOR • WAITING SCHEDULE", w/2, 130);
    ctx.fillStyle = "#ffffff"; ctx.font = "900 86px system-ui,Arial"; ctx.fillText(safeText(profile?.sponsorName,"Sponsor Name"), w/2, 282);
    ctx.fillStyle = accent; ctx.font = "800 44px system-ui,Arial"; ctx.fillText(safeText(profile?.placementName,"Hub Placement"), w/2, 360);
    ctx.fillStyle = "#dffcff"; ctx.font = "700 34px system-ui,Arial";
    const desc = safeText(profile?.description,"Approved sponsor description appears here.");
    const words = desc.split(/\s+/); let line = ""; let yy = 470;
    words.forEach(word=>{ const test = line ? `${line} ${word}` : word; if(ctx.measureText(test).width > 1320 && line){ ctx.fillText(line,w/2,yy); line = word; yy += 46; } else line = test; });
    if(line) ctx.fillText(line,w/2,yy);
    const schedule = profile?.schedule || {};
    ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(150,690,1300,132);
    ctx.fillStyle = accent; ctx.font = "900 34px system-ui,Arial"; ctx.fillText("SCHEDULE STATUS", w/2, 730);
    ctx.fillStyle = scheduleState?.active ? "#8dffb4" : "#ffdf8a"; ctx.font = "800 30px system-ui,Arial";
    ctx.fillText(safeText(scheduleState?.reason,"schedule pending"), w/2, 772);
    ctx.fillStyle = "#ffffff"; ctx.font = "700 25px system-ui,Arial";
    ctx.fillText(`${safeText(schedule.days?.join(" / "),"Days pending")} • ${safeText(schedule.hours?.join(" - "),"Hours pending")}`, w/2, 812);
    ctx.fillStyle = "#ffdf8a"; ctx.font = "800 30px system-ui,Arial"; ctx.fillText(safeText(profile?.website,"website pending"), w/2, 890);
  });
}
function drawLogo(profile){
  const accent = profile?.display?.accentColor || "#5fffd8";
  return makeCanvasTexture(512,512,(ctx,w,h)=>{
    const g = ctx.createRadialGradient(w*.5,h*.42,20,w*.5,h*.5,w*.58);
    g.addColorStop(0,"#ffffff"); g.addColorStop(.36,accent); g.addColorStop(1,"#080914");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 12; ctx.strokeRect(26,26,w-52,h-52);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#05070d"; ctx.font = "900 96px system-ui,Arial";
    ctx.fillText(safeText(profile?.logoText,"SVR").slice(0,8).toUpperCase(), w/2, h/2);
  });
}
async function fetchProfile(url){
  const response = await fetch(url, { cache:"no-store" });
  if(!response.ok) throw new Error(`Sponsor profile failed: ${response.status}`);
  return await response.json();
}
function positionForHub(hub){
  const key = String(hub || "wellness").toLowerCase();
  if(key.includes("pga")) return { angle:-Math.PI*.25, radius:9.65 };
  if(key.includes("store")) return { angle:Math.PI*.50, radius:9.65 };
  if(key.includes("sponsor")) return { angle:0, radius:9.65 };
  if(key.includes("legend")) return { angle:-Math.PI*.75, radius:9.65 };
  return { angle:Math.PI*.25, radius:9.65 };
}
function placeOnCircle(obj, radius, angle){
  obj.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);
  obj.lookAt(0, obj.position.y, 0);
}
export async function installPhase172SponsorModule({ scene, log = console.log, enabled = true, profileUrl = "./data/sponsors/example-reiki-sponsor.json", forceSchedule = false } = {}){
  if(!enabled || !scene) return null;
  let profile;
  try{ profile = await fetchProfile(profileUrl); }
  catch(err){ log("[Phase172 Sponsor] profile load skipped", err?.message || err); return null; }
  const scheduleState = evaluateSponsorSchedule(profile);
  const allowDisplay = forceSchedule || scheduleState.active;
  window.SVR_PHASE172C_SPONSOR_SCHEDULE = { sponsorId:profile?.sponsorId || null, sponsorName:profile?.sponsorName || null, active:scheduleState.active, reason:scheduleState.reason, forced:forceSchedule, profileUrl };
  if(!profile?.approved){ log("[Phase172 Sponsor] profile not approved", profile?.sponsorId || "unknown"); return null; }
  if(!allowDisplay){ log(`[Phase172 Sponsor] approved but not displayed: ${scheduleState.reason}`); return null; }
  const root = new THREE.Group();
  root.name = `PHASE172C_SCHEDULED_SPONSOR_MODULE_${safeText(profile.sponsorId,"approved")}`;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.8,2.32), new THREE.MeshBasicMaterial({ map:drawSponsorPanel(profile, scheduleState), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.position.set(0,2.25,-0.35); panel.renderOrder = 70; root.add(panel);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(.58,48), new THREE.MeshBasicMaterial({ map:drawLogo(profile), transparent:false, side:THREE.DoubleSide }));
  logo.position.set(0,1.02,.48); root.add(logo);
  const accent = new THREE.Color(profile?.display?.accentColor || "#5fffd8");
  const portal = new THREE.Mesh(new THREE.TorusGeometry(.84,.035,12,112), new THREE.MeshBasicMaterial({ color:accent, transparent:true, opacity:.72, blending:THREE.AdditiveBlending, depthWrite:false }));
  portal.position.set(0,1.02,.50); root.add(portal);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(2.12,48), new THREE.MeshBasicMaterial({ color:accent, transparent:true, opacity:.10, side:THREE.DoubleSide, depthWrite:false }));
  pad.rotation.x = -Math.PI/2; pad.position.y=.026; root.add(pad);
  const { angle, radius } = positionForHub(profile.hub);
  placeOnCircle(root, radius, angle);
  scene.add(root);
  root.userData.profile = profile;
  root.userData.scheduleState = scheduleState;
  root.userData.tick = (t)=>{ portal.rotation.z = t*.75; logo.rotation.z = Math.sin(t*.7)*.03; };
  window.SVR_PHASE172_SPONSOR_MODULE = { locked:true, loaded:true, sponsorId:profile.sponsorId, sponsorName:profile.sponsorName, hub:profile.hub, approved:profile.approved, scheduleActive:scheduleState.active, scheduleReason:scheduleState.reason, profileUrl };
  log(`[Phase172 Sponsor] Loaded scheduled sponsor ${profile.sponsorName} into ${profile.hub} hub. ${scheduleState.reason}`);
  return root;
}
