AFRAME.registerComponent("scarlett-hands-always", {
  init() {
    const left = document.getElementById("leftHand");
    const right = document.getElementById("rightHand");

    const force = (el) => {
      if (!el) return;
      el.setAttribute("visible", "true");
      setInterval(() => {
        if (!el.object3D) return;
        el.object3D.visible = true;
        el.object3D.traverse((n) => (n.visible = true));
      }, 600);
    };

    force(left);
    force(right);

    if (window.hudLog) hudLog("Hands always visible ✅");
  }
});
