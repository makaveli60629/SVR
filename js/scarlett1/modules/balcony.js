AFRAME.registerComponent("scarlett-balcony", {
  init: function () {
    const el = this.el;

    const platform = document.createElement("a-box");
    platform.setAttribute("width","18");
    platform.setAttribute("height","0.4");
    platform.setAttribute("depth","10");
    platform.setAttribute("position","0 3.0 0");
    platform.setAttribute("material","color:#0b0f14; metalness:0.45; roughness:0.6");
    el.appendChild(platform);

    const glow = document.createElement("a-ring");
    glow.setAttribute("radius-inner","7.2");
    glow.setAttribute("radius-outer","7.6");
    glow.setAttribute("rotation","-90 0 0");
    glow.setAttribute("position","0 3.22 0");
    glow.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.18; transparent:true");
    el.appendChild(glow);

    makeRail(el, 0, 3.9,  4.8, 18, 0.22);
    makeRail(el, 0, 3.9, -4.8, 18, 0.22);
    makeRailSide(el, -8.8, 3.9, 0, 10, 0.22);
    makeRailSide(el,  8.8, 3.9, 0, 10, 0.22);

    const t = document.createElement("a-text");
    t.setAttribute("value","BALCONY");
    t.setAttribute("align","center");
    t.setAttribute("color","#9ff");
    t.setAttribute("width","10");
    t.setAttribute("position","0 5.3 -4.2");
    el.appendChild(t);

    makePortal(el, {x:0,y:4.2,z:3.8}, "BACK TO LOBBY", ()=> window.gotoLobby && window.gotoLobby());

    if (window.hudLog) hudLog("Balcony ✅");
  }
});

function makeRail(root, x,y,z,w,h){
  const r = document.createElement("a-box");
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("depth", "0.18");
  r.setAttribute("position", `${x} ${y} ${z}`);
  r.setAttribute("material","color:#0b0f14; emissive:#7b61ff; emissiveIntensity:0.18; opacity:0.95; transparent:true");
  root.appendChild(r);
}
function makeRailSide(root, x,y,z,d,h){
  const r = document.createElement("a-box");
  r.setAttribute("width", "0.18");
  r.setAttribute("height", h);
  r.setAttribute("depth", d);
  r.setAttribute("position", `${x} ${y} ${z}`);
  r.setAttribute("material","color:#0b0f14; emissive:#7b61ff; emissiveIntensity:0.18; opacity:0.95; transparent:true");
  root.appendChild(r);
}
function makePortal(root, pos, label, onClick){
  const g = document.createElement("a-entity");
  g.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
  g.setAttribute("rotation","0 180 0");
  g.classList.add("clickable");
  root.appendChild(g);

  const bg = document.createElement("a-plane");
  bg.setAttribute("width","2.4");
  bg.setAttribute("height","0.6");
  bg.setAttribute("material","color:#0b0f14; opacity:0.78; transparent:true");
  bg.classList.add("clickable");
  g.appendChild(bg);

  const ring = document.createElement("a-ring");
  ring.setAttribute("radius-inner","0.48");
  ring.setAttribute("radius-outer","0.54");
  ring.setAttribute("position","0 0 0.01");
  ring.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.6; transparent:true");
  g.appendChild(ring);

  const t = document.createElement("a-text");
  t.setAttribute("value", label);
  t.setAttribute("align","center");
  t.setAttribute("color","#9ff");
  t.setAttribute("width","7");
  t.setAttribute("position","0 0 0.02");
  g.appendChild(t);

  g.addEventListener("click", ()=>{ try{ onClick && onClick(); }catch(e){} });
}