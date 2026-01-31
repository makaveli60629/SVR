// /js/scarlett1/modules/jumbotron.js
// Placeholder jumbotron system (safe: no external video dependencies).
AFRAME.registerComponent("scarlett-jumbotron", {
  schema: { label: { default: "JUMBOTRON" } },
  init() {
    const p = document.createElement("a-plane");
    p.setAttribute("width","6");
    p.setAttribute("height","3.4");
    p.setAttribute("material","color:#000; emissive:#2bd6ff; emissiveIntensity:0.35; opacity:0.95; transparent:true");
    this.el.appendChild(p);

    const t = document.createElement("a-text");
    t.setAttribute("value", this.data.label);
    t.setAttribute("align","center");
    t.setAttribute("color","#9ff");
    t.setAttribute("width","10");
    t.setAttribute("position","0 0 0.02");
    this.el.appendChild(t);
  }
});
