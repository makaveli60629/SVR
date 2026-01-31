AFRAME.registerComponent("scarlett-pit", {
  init: function () {
    const el = this.el;

    makeRoom(el, { name:"POKER TABLES ROOM", center:{x:0,y:0,z:0}, size:{w:26,h:8,d:22}, accent:"#00e5ff" });

    const tableBundle = document.createElement("a-entity");
    tableBundle.setAttribute("id", "mainTableBundle");
    tableBundle.setAttribute("position", "0 0 0");
    tableBundle.setAttribute("scarlett-table", "");
    el.appendChild(tableBundle);

    // Jumbotron behind table
    const jumbo = document.createElement("a-entity");
    jumbo.setAttribute("id", "scarlettJumboRoot");
    jumbo.setAttribute("position", "-3.5 0 -2.2");
    jumbo.setAttribute("scarlett-jumbotron", "playlist:https://raw.githubusercontent.com/jromero88/iptv/master/channels/us.m3u; preferName:CBS");
    el.appendChild(jumbo);

    const bots = document.createElement("a-entity");
    bots.setAttribute("id", "botsRoot");
    bots.setAttribute("scarlett-bots", "");
    el.appendChild(bots);

    const marker = document.createElement("a-ring");
    marker.setAttribute("id", "playerSeatMarker");
    marker.setAttribute("radius-inner", "0.22");
    marker.setAttribute("radius-outer", "0.36");
    marker.setAttribute("rotation", "-90 0 0");
    marker.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.0; opacity:0.65; transparent:true");
    marker.classList.add("seatSpot");
    el.appendChild(marker);

    setTimeout(() => {
      const seat = document.getElementById("seat_front");
      if (!seat) return;
      const p = seat.object3D.position;
      marker.setAttribute("position", `${p.x} 0.03 ${p.z}`);
      if (window.hudLog) hudLog("Your seat reserved ✅ (front seat)");
    }, 350);

    // Air buttons in front of your seat
    setTimeout(() => {
      const seat = document.getElementById("seat_front");
      if (!seat) return;

      const root = document.createElement("a-entity");
      root.setAttribute("id", "airButtonsRoot");
      el.appendChild(root);

      const p = seat.object3D.position;
      root.setAttribute("position", `${p.x} 1.35 ${p.z - 1.05}`);
      root.setAttribute("rotation", "0 180 0");

      const nextBtn = document.createElement("a-plane");
      nextBtn.classList.add("clickable");
      nextBtn.setAttribute("width", "0.55");
      nextBtn.setAttribute("height", "0.24");
      nextBtn.setAttribute("position", "0.38 0 0");
      nextBtn.setAttribute("material", "opacity:0.0; transparent:true");
      nextBtn.addEventListener("click", () => {
        if (window.nextTVChannel) window.nextTVChannel();
        if (window.addChatMessage) window.addChatMessage("SYSTEM", "Next Channel ▶");
      });
      root.appendChild(nextBtn);

      const prevBtn = document.createElement("a-plane");
      prevBtn.classList.add("clickable");
      prevBtn.setAttribute("width", "0.55");
      prevBtn.setAttribute("height", "0.24");
      prevBtn.setAttribute("position", "-0.38 0 0");
      prevBtn.setAttribute("material", "opacity:0.0; transparent:true");
      prevBtn.addEventListener("click", () => {
        if (window.prevTVChannel) window.prevTVChannel();
        if (window.addChatMessage) window.addChatMessage("SYSTEM", "Prev Channel ◀");
      });
      root.appendChild(prevBtn);

      const guide = document.createElement("a-plane");
      guide.setAttribute("width", "1.35");
      guide.setAttribute("height", "0.38");
      guide.setAttribute("position", "0 0 0.01");
      guide.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.12; transparent:true");
      root.appendChild(guide);

      if (window.hudLog) hudLog("Air buttons ✅ (Prev/Next TV)");
    }, 800);

    // Ninja display pedestals (fallback shapes if no GLBs)
    const display = document.createElement("a-entity");
    display.setAttribute("id", "ninjaDisplayRoot");
    el.appendChild(display);
    makeNinjaPedestal(display, { x: -9.5, z: 2.2, r: 35 }, ["./assets/combat_ninja.glb","./assets/ninja.glb"], "Combat Ninja");
    makeNinjaPedestal(display, { x: -9.5, z: -2.2, r: 35 }, ["./assets/ninja.glb"], "Ninja");

    makePortal(el, {x:0,y:1.4,z:9.2}, "BACK TO LOBBY", ()=> window.gotoLobby && window.gotoLobby());

    if (window.hudLog) hudLog("Tables room ✅");
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

  const glow = document.createElement("a-ring");
  glow.setAttribute("radius-inner", (Math.min(size.w,size.d)/2)-0.9);
  glow.setAttribute("radius-outer", (Math.min(size.w,size.d)/2)-0.6);
  glow.setAttribute("rotation","-90 0 0");
  glow.setAttribute("position", `${center.x} 0.03 ${center.z}`);
  glow.setAttribute("material", `color:${accent}; emissive:${accent}; emissiveIntensity:0.9; opacity:0.14; transparent:true`);
  root.appendChild(glow);

  const title = document.createElement("a-text");
  title.setAttribute("value", name || "ROOM");
  title.setAttribute("align","center");
  title.setAttribute("color","#9ff");
  title.setAttribute("width","12");
  title.setAttribute("position", `${center.x} ${size.h-0.8} ${center.z - (size.d/2) + 0.35}`);
  root.appendChild(title);
}

function makePortal(root, pos, label, onClick){
  const g = document.createElement("a-entity");
  g.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
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

function makeNinjaPedestal(root, pose, urls, label) {
  const group = document.createElement("a-entity");
  group.setAttribute("position", `${pose.x} 0 ${pose.z}`);
  group.setAttribute("rotation", `0 ${pose.r} 0`);
  root.appendChild(group);

  const ped = document.createElement("a-cylinder");
  ped.setAttribute("radius", "1.05");
  ped.setAttribute("height", "0.24");
  ped.setAttribute("position", "0 0.12 0");
  ped.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
  group.appendChild(ped);

  const glow = document.createElement("a-ring");
  glow.setAttribute("radius-inner", "0.70");
  glow.setAttribute("radius-outer", "1.00");
  glow.setAttribute("rotation", "-90 0 0");
  glow.setAttribute("position", "0 0.13 0");
  glow.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.5; opacity:0.55; transparent:true");
  group.appendChild(glow);

  const t = document.createElement("a-text");
  t.setAttribute("value", label);
  t.setAttribute("align", "center");
  t.setAttribute("color", "#9ff");
  t.setAttribute("width", "5");
  t.setAttribute("position", "0 2.2 0");
  group.appendChild(t);

  const holder = document.createElement("a-entity");
  holder.setAttribute("position", "0 0.24 0");
  holder.setAttribute("rotation", "0 180 0");
  group.appendChild(holder);

  const model = document.createElement("a-entity");
  model.setAttribute("gltf-model", (urls && urls[0]) ? urls[0] : "./assets/ninja.glb");
  model.setAttribute("scale","1.2 1.2 1.2");
  model.addEventListener("model-error", ()=>{
    const statue = document.createElement("a-cone");
    statue.setAttribute("radius-bottom", "0.40");
    statue.setAttribute("radius-top", "0.08");
    statue.setAttribute("height", "1.8");
    statue.setAttribute("position", "0 0.9 0");
    statue.setAttribute("material", "color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.35; roughness:0.8");
    holder.appendChild(statue);
    if (window.hudLog) hudLog(`${label}: GLB missing → placeholder`);
  });
  holder.appendChild(model);
}