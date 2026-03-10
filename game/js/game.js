(function () {
  function initMatrix() {
    const canvas = document.getElementById("matrix");
    const ctx = canvas.getContext("2d");
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    addEventListener("resize", resize);

    const glyphs = "SVRPOKER0123456789#$%&";
    const size = 16;
    let cols = Math.floor(innerWidth / size);
    let drops = Array(cols).fill(1);

    addEventListener("resize", () => {
      cols = Math.floor(innerWidth / size);
      drops = Array(cols).fill(1);
    });

    function draw() {
      ctx.fillStyle = "rgba(0,0,0,.13)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = size + "px monospace";
      for (let i = 0; i < drops.length; i++) {
        const ch = glyphs[(Math.random() * glyphs.length) | 0];
        ctx.fillStyle = Math.random() > 0.88 ? "#d6b9ff" : "#8a3dff";
        ctx.fillText(ch, i * size, drops[i] * size);
        if (drops[i] * size > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  function initUI() {
    const rig = document.getElementById("rig");
    const sitTarget = document.getElementById("sitTarget");
    const watchScreen = document.getElementById("watchScreen");
    const watchText = document.getElementById("watchText");
    const watchAnchor = document.getElementById("watchAnchor");

    let sitting = false;
    let menuOpen = false;

    function toggleMenu() {
      menuOpen = !menuOpen;
      if (watchScreen) watchScreen.setAttribute("visible", menuOpen);
      if (watchText) watchText.setAttribute("visible", menuOpen);
    }

    function toggleSit() {
      sitting = !sitting;
      if (rig) rig.setAttribute("position", sitting ? "0 1.15 1.05" : "0 1.6 3");
    }

    addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "m") toggleMenu();
      if (k === "e") toggleSit();
    });

    if (sitTarget) sitTarget.addEventListener("click", toggleSit);
    if (watchAnchor) watchAnchor.addEventListener("click", toggleMenu);
    initMatrix();
  }

  addEventListener("DOMContentLoaded", initUI);
})();
