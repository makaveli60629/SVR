// /js/scarlett1/modules/lighting.js
AFRAME.registerComponent("scarlett-lighting", {
  init() {
    const scene = this.el.sceneEl;

    // Ambient (strong so it's never dark)
    const amb = document.createElement("a-light");
    amb.setAttribute("type", "ambient");
    amb.setAttribute("intensity", "1.6");
    amb.setAttribute("color", "#ffffff");
    scene.appendChild(amb);

    // Key directional
    const sun = document.createElement("a-light");
    sun.setAttribute("type", "directional");
    sun.setAttribute("intensity", "1.25");
    sun.setAttribute("color", "#ffffff");
    sun.setAttribute("position", "4 10 6");
    scene.appendChild(sun);

    // Fill directional
    const fill = document.createElement("a-light");
    fill.setAttribute("type", "directional");
    fill.setAttribute("intensity", "0.75");
    fill.setAttribute("color", "#d7f6ff");
    fill.setAttribute("position", "-6 6 -4");
    scene.appendChild(fill);

    // Neon ring lights around origin (lobby pillars will add more, but this ensures visibility)
    const R = 12;
    for (let i=0; i<10; i++) {
      const a = (i/10) * Math.PI*2;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;

      const p = document.createElement("a-light");
      p.setAttribute("type", "point");
      p.setAttribute("intensity", "0.9");
      p.setAttribute("distance", "28");
      p.setAttribute("decay", "1.5");
      p.setAttribute("color", i%2===0 ? "#2bd6ff" : "#7b61ff");
      p.setAttribute("position", `${x} 3.2 ${z}`);
      scene.appendChild(p);
    }

    if (window.hudLog) hudLog("Lighting loaded ✅ (bright)");
  }
});
