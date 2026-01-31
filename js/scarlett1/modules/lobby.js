AFRAME.registerComponent("scarlett-lobby", {
  init: function () {
    const el = this.el;

    makeRoom(el, { name:"LOBBY", center:{x:0,y:0,z:0}, size:{w:18,h:6,d:18}, accent:"#2bd6ff" });

    makePortal(el, {x:-5.2,y:1.4,z:-6.2}, "POKER TABLES", ()=> window.gotoTables && window.gotoTables());
    makePortal(el, {x:0.0,y:1.4,z:-6.2},  "STORE",        ()=> window.gotoStore && window.gotoStore());
    makePortal(el, {x:5.2,y:1.4,z:-6.2},  "BALCONY",      ()=> window.gotoBalcony && window.gotoBalcony());

    const beacon = document.createElement("a-cylinder");
    beacon.setAttribute("radius", "0.10");
    beacon.setAttribute("height", "2.2");
    beacon.setAttribute("position", "0 1.1 4.0");
    beacon.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.2");
    el.appendChild(beacon);

    if (window.hudLog) hudLog("Lobby ✅ portals ready");
  }
});

function makeRoom(root, cfg){
  const {center,size,accent,name} = cfg;
  const shell = document.createElement("a-box");
  shell.setAttribute("width",  size.w);
  shell.setAttribute("height", size.h);
  shell.setAttribute("depth",  size.d);
  shell.setAttribute("position", `${center.x} ${center.y + size.h/2} ${center.z}`);
  shell.setAttribute("material", "color:#06070b; side:back; roughness:0.95; metalness:0.05");
  root.appendChild(shell);

  const decal = document.createElement("a-ring");
  decal.setAttribute("radius-inner","3.4");
  decal.setAttribute("radius-outer","3.8");
  decal.setAttribute("rotation","-90 0 0");
  decal.setAttribute("position", `${center.x} 0.03 ${center.z}`);
  decal.setAttribute("material", `color:${accent}; emissive:${accent}; emissiveIntensity:0.9; opacity:0.22; transparent:true`);
  root.appendChild(decal);

  const title = document.createElement("a-text");
  title.setAttribute("value", name || "ROOM");
  title.setAttribute("align","center");
  title.setAttribute("color","#9ff");
  title.setAttribute("width","10");
  title.setAttribute("position", `${center.x} ${size.h-0.7} ${center.z - (size.d/2) + 0.25}`);
  root.appendChild(title);
}

function makePortal(root, pos, label, onClick){
  const g = document.createElement("a-entity");
  g.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
  g.classList.add("clickable");
  root.appendChild(g);

  const bg = document.createElement("a-plane");
  bg.setAttribute("width","2.2");
  bg.setAttribute("height","0.55");
  bg.setAttribute("material","color:#0b0f14; opacity:0.78; transparent:true");
  bg.classList.add("clickable");
  g.appendChild(bg);

  const ring = document.createElement("a-ring");
  ring.setAttribute("radius-inner","0.46");
  ring.setAttribute("radius-outer","0.52");
  ring.setAttribute("position","0 0 0.01");
  ring.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.6; transparent:true");
  g.appendChild(ring);

  const t = document.createElement("a-text");
  t.setAttribute("value", label);
  t.setAttribute("align","center");
  t.setAttribute("color","#9ff");
  t.setAttribute("width","6");
  t.setAttribute("position","0 0 0.02");
  g.appendChild(t);

  g.addEventListener("click", ()=>{ try{ onClick && onClick(); }catch(e){} });
}