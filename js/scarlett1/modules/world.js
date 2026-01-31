AFRAME.registerComponent("scarlett-world", {
  init: function () {
    const el = this.el;

    const floor = document.createElement("a-circle");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("radius", "70");
    floor.setAttribute("material", "color:#05060a; roughness:1");
    floor.setAttribute("position", "0 0 0");
    el.appendChild(floor);

    const sky = document.createElement("a-sphere");
    sky.setAttribute("radius", "120");
    sky.setAttribute("segments-height", "18");
    sky.setAttribute("segments-width", "28");
    sky.setAttribute("material", "color:#020205; side:back; opacity:1");
    el.appendChild(sky);

    for (let i=0;i<18;i++){
      const a = (i/18) * Math.PI * 2;
      const x = Math.cos(a)*28;
      const z = Math.sin(a)*28;
      const col = document.createElement("a-cylinder");
      col.setAttribute("radius", "0.22");
      col.setAttribute("height", "8");
      col.setAttribute("position", `${x.toFixed(2)} 4 ${z.toFixed(2)}`);
      col.setAttribute("material", "color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.25; roughness:0.8");
      el.appendChild(col);
    }

    const ring = document.createElement("a-torus");
    ring.setAttribute("radius", "6.5");
    ring.setAttribute("radius-tubular", "0.08");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("position", "0 0.05 0");
    ring.setAttribute("material", "color:#0f1116; emissive:#7b61ff; emissiveIntensity:0.9; opacity:0.55; transparent:true");
    el.appendChild(ring);

    if (window.hudLog) hudLog("World built ✅");
  }
});