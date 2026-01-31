AFRAME.registerComponent("scarlett-jumbotron", {
  init: function () {
    const el = this.el;

    const frame = document.createElement("a-box");
    frame.setAttribute("width", "6.4");
    frame.setAttribute("height", "3.7");
    frame.setAttribute("depth", "0.25");
    frame.setAttribute("material", "color:#0b0f14; metalness:0.6; roughness:0.3");
    el.appendChild(frame);

    const screen = document.createElement("a-plane");
    screen.setAttribute("width", "5.7");
    screen.setAttribute("height", "3.1");
    screen.setAttribute("position", "0 0 0.13");
    screen.setAttribute("material", "color:#12273a; emissive:#2bd6ff; emissiveIntensity:0.25");
    el.appendChild(screen);

    // You can swap this later for a <video> texture once you're stable
    hudLog("Jumbotron built ✅");
  }
});
