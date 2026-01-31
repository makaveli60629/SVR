// /js/scarlett1/modules/ui_watch.js
AFRAME.registerComponent("scarlett-watch", {
  init() {
    const scene = this.el.sceneEl;

    const attach = () => {
      const left = document.getElementById("leftHandHT") || document.getElementById("leftHand");
      if (!left) return;
      // Attach to left hand (wrist-ish)
      left.appendChild(this.el);
      this.el.setAttribute("position", "0.06 0.02 -0.06");
      this.el.setAttribute("rotation", "20 0 0");
      this.el.setAttribute("scale", "0.35 0.35 0.35");
    };

    // build panel
    const panel = document.createElement("a-plane");
    panel.setAttribute("width", "0.32");
    panel.setAttribute("height", "0.22");
    panel.setAttribute("material", "color:#0b0f14; opacity:0.85; transparent:true");
    panel.setAttribute("position", "0 0 0");
    this.el.appendChild(panel);

    const title = document.createElement("a-text");
    title.setAttribute("value", "SCARLETT");
    title.setAttribute("color", "#9ff");
    title.setAttribute("align", "center");
    title.setAttribute("width", "0.9");
    title.setAttribute("position", "0 0.08 0.01");
    this.el.appendChild(title);

    const btns = [
      { id:"btnLobby",   label:"LOBBY",   y: 0.02, room:"room_lobby" },
      { id:"btnPoker",   label:"TABLES",  y:-0.03, room:"room_poker" },
      { id:"btnStore",   label:"STORE",   y:-0.08, room:"room_store" },
      { id:"btnBalcony", label:"BALCONY", y:-0.13, room:"room_balcony" },
    ];

    btns.forEach(b => {
      const r = document.createElement("a-plane");
      r.setAttribute("id", b.id);
      r.classList.add("clickable");
      r.setAttribute("width", "0.28");
      r.setAttribute("height", "0.04");
      r.setAttribute("position", `0 ${b.y} 0.01`);
      r.setAttribute("material", "color:#111827; emissive:#2bd6ff; emissiveIntensity:0.15; opacity:0.95; transparent:true");
      this.el.appendChild(r);

      const t = document.createElement("a-text");
      t.setAttribute("value", b.label);
      t.setAttribute("color", "#e8faff");
      t.setAttribute("align", "center");
      t.setAttribute("width", "0.8");
      t.setAttribute("position", `0 ${b.y} 0.02`);
      this.el.appendChild(t);

      r.addEventListener("click", () => {
        if (window.SCARLETT && window.SCARLETT.setRoom) window.SCARLETT.setRoom(b.room);
      });
    });

    // Attach after scene ready
    scene.addEventListener("loaded", () => setTimeout(attach, 300));
    scene.addEventListener("enter-vr", () => setTimeout(attach, 300));
  }
});
