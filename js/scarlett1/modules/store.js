AFRAME.registerComponent("scarlett-store", {
  init: function () {
    const el = this.el;

    makeRoom(el, { name:"STORE", center:{x:0,y:0,z:0}, size:{w:22,h:7,d:18}, accent:"#7b61ff" });

    for(let i=0;i<5;i++){
      const shelf = document.createElement("a-box");
      shelf.setAttribute("width","3.2");
      shelf.setAttribute("height","0.18");
      shelf.setAttribute("depth","0.9");
      shelf.setAttribute("position", `${-6.6 + i*3.3} 1.2 -5.8`);
      shelf.setAttribute("material","color:#0b0f14; metalness:0.45; roughness:0.5");
      el.appendChild(shelf);

      const glow = document.createElement("a-box");
      glow.setAttribute("width","3.25");
      glow.setAttribute("height","0.05");
      glow.setAttribute("depth","0.95");
      glow.setAttribute("position", `${-6.6 + i*3.3} 1.32 -5.8`);
      glow.setAttribute("material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:0.9; opacity:0.25; transparent:true");
      el.appendChild(glow);
    }

    const panel = document.createElement("a-plane");
    panel.setAttribute("width","3.8");
    panel.setAttribute("height","2.0");
    panel.setAttribute("position","0 2.2 6.8");
    panel.setAttribute("rotation","0 180 0");
    panel.setAttribute("material","color:#0b0f14; opacity:0.78; transparent:true");
    el.appendChild(panel);

    const title = document.createElement("a-text");
    title.setAttribute("value","WALLET (DEMO)\nCredits: 10,000\nInventory: 0");
    title.setAttribute("align","center");
    title.setAttribute("color","#b19cd9");
    title.setAttribute("width","6");
    title.setAttribute("position","0 2.2 6.72");
    title.setAttribute("rotation","0 180 0");
    el.appendChild(title);

    makeBuy(el, {x:-2.0,y:1.2,z:1.0}, "BUY CHIP STACK\n500", () => chat("STORE","Bought Chip Stack (demo)"));
    makeBuy(el, {x: 2.0,y:1.2,z:1.0}, "BUY CARD BACK\n250", () => chat("STORE","Bought Card Back (demo)"));

    makePortal(el, {x:0,y:1.4,z:8.2}, "BACK TO LOBBY", ()=> window.gotoLobby && window.gotoLobby());

    if (window.hudLog) hudLog("Store ✅");
  }
});

function chat(u,m){ if(window.addChatMessage) window.addChatMessage(u,m); if(window.hudLog) hudLog("[STORE] "+m); }

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
  ring.setAttribute("material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.6; transparent:true");
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

function makeBuy(root, pos, label, onClick){
  const g = document.createElement("a-entity");
  g.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
  g.classList.add("clickable");
  root.appendChild(g);

  const bg = document.createElement("a-plane");
  bg.setAttribute("width","2.2");
  bg.setAttribute("height","0.9");
  bg.setAttribute("material","color:#0b0f14; opacity:0.72; transparent:true");
  bg.classList.add("clickable");
  g.appendChild(bg);

  const t = document.createElement("a-text");
  t.setAttribute("value", label);
  t.setAttribute("align","center");
  t.setAttribute("color","#b19cd9");
  t.setAttribute("width","6");
  t.setAttribute("position","0 0 0.02");
  g.appendChild(t);

  const glow = document.createElement("a-ring");
  glow.setAttribute("radius-inner","0.52");
  glow.setAttribute("radius-outer","0.62");
  glow.setAttribute("position","0 -0.34 0.01");
  glow.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.1; opacity:0.25; transparent:true");
  g.appendChild(glow);

  g.addEventListener("click", ()=>{ try{ onClick && onClick(); }catch(e){} });
}