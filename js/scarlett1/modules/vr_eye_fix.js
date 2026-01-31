// /js/scarlett1/modules/vr_eye_fix.js
// Removes right-eye-only reticles/lasers/cursors + camera-attached UI planes.

AFRAME.registerComponent("scarlett-vr-eye-fix", {
  init() {
    const scene = this.el.sceneEl;

    scene.addEventListener("enter-vr", () => {
      setTimeout(() => this.applyFix("enter-vr+200ms"), 200);
      setTimeout(() => this.applyFix("enter-vr+800ms"), 800);
      setTimeout(() => this.applyFix("enter-vr+1500ms"), 1500);
      if (window.hudLog) hudLog("VR Eye Fix armed ✅");
    });

    // Also apply once on load for browser testing
    setTimeout(() => this.applyFix("boot+700ms"), 700);
  },

  applyFix(tag) {
    const cam = document.getElementById("camera");
    const right = document.getElementById("rightHand");
    const left  = document.getElementById("leftHand");

    // Kill camera cursor & raycaster visuals
    if (cam && cam.hasAttribute("cursor")) cam.removeAttribute("cursor");
    if (cam && cam.hasAttribute("raycaster")) cam.removeAttribute("raycaster");

    // Remove any camera-attached planes/text/rings (in-your-face panels)
    if (cam) {
      [...cam.children].forEach(ch => {
        const tn = (ch.tagName || "").toLowerCase();
        const id = (ch.getAttribute && ch.getAttribute("id")) || "";
        const cls = (ch.getAttribute && ch.getAttribute("class")) || "";
        const looksUI = /hud|boot|panel|overlay|sign|message|prompt|notice/i.test(id + " " + cls);

        if (tn.includes("a-plane") || tn.includes("a-text") || tn.includes("a-ring") || looksUI) {
          ch.parentNode && ch.parentNode.removeChild(ch);
          if (window.hudLog) hudLog(`Removed camera UI ✅ id=${id || "?"}`);
        }
      });
      cam.setAttribute("position", "0 0 0");
    }

    // Disable visible laser lines on hands but keep controls alive
    [right, left].forEach(hand => {
      if (!hand) return;

      // If any raycaster exists, force showLine false
      if (hand.hasAttribute("raycaster")) {
        const rc = hand.getAttribute("raycaster");
        hand.setAttribute("raycaster", `${rc}; showLine:false; far:30`);
      }

      // Remove visible ring/plane/text children that can appear in one eye
      [...hand.children].forEach(ch => {
        const tn = (ch.tagName || "").toLowerCase();
        if (tn.includes("a-ring") || tn.includes("a-plane") || tn.includes("a-text")) {
          ch.parentNode && ch.parentNode.removeChild(ch);
        }
      });
    });

    // Nuke common offender IDs if they exist anywhere
    ["enterPokerPitPrompt", "bootPanel", "uiPanel", "promptPanel", "floatingPrompt", "reticle", "cursor"].forEach(id => {
      const e = document.getElementById(id);
      if (e && e.parentNode) e.parentNode.removeChild(e);
    });

    if (window.hudLog) hudLog(`VR Eye Fix applied ✅ (${tag})`);
  }
});
