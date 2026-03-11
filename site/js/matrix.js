(function () {
  const canvas = document.createElement("canvas");
  canvas.className = "matrix-bg";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  const glyphs = "SVRPOKER1018+";
  const fontSize = 18;
  let drops = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const columns = Math.max(1, Math.floor(canvas.width / fontSize));
    drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));
  }

  function draw() {
    ctx.fillStyle = "rgba(5, 5, 7, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      ctx.fillStyle = i % 3 === 0 ? "#5dd8ff" : "#c86cff";
      ctx.fillText(text, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = Math.floor(Math.random() * -20);
      }

      drops[i]++;
    }
  }

  resize();
  window.addEventListener("resize", resize);
  setInterval(draw, 42);
})();
