// SVR Poker — Game Matrix Secret Phrase Layer
// Adds a low-cost purple binary rain overlay with embedded secret letters.
// Secret phrases are revealed as single letters inside the rain, not as plain text.

export function createGameMatrixSecret(options = {}) {
  const {
    phrases = ["I LOVE SHY", "I LOVE SCARLETT"],
    opacity = 0.16,
    zIndex = 1,
    fps = 24,
    fontSize = 16,
    secretRate = 0.035,
    id = "svr-game-matrix-secret"
  } = options;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return { update() {}, destroy() {} };
  }

  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = String(zIndex);
  canvas.style.opacity = String(opacity);
  canvas.style.mixBlendMode = "screen";
  canvas.style.background = "transparent";

  // Keep the game controls clickable. HUD/nav already use higher z-index values.
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let columns = 0;
  let drops = [];
  let secretLetters = phrases.join("   •   ").toUpperCase().split("");
  let secretIndex = 0;
  let lastFrame = 0;
  let raf = 0;
  let active = true;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, Math.floor(window.innerWidth * dpr));
    height = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    columns = Math.ceil(window.innerWidth / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * window.innerHeight / fontSize);
  }

  function nextSecretLetter() {
    if (!secretLetters.length) return "1";
    const letter = secretLetters[secretIndex % secretLetters.length];
    secretIndex += 1;
    return letter === " " ? (Math.random() > 0.5 ? "0" : "1") : letter;
  }

  function draw(now) {
    if (!active) return;
    const minDelta = 1000 / fps;
    if (now - lastFrame < minDelta) {
      raf = window.requestAnimationFrame(draw);
      return;
    }
    lastFrame = now;

    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i < drops.length; i++) {
      const isSecret = Math.random() < secretRate;
      const char = isSecret ? nextSecretLetter() : (Math.random() > 0.5 ? "1" : "0");
      const x = i * fontSize + fontSize * 0.5;
      const y = drops[i] * fontSize;

      if (isSecret) {
        ctx.fillStyle = "rgba(255, 122, 248, 0.95)";
        ctx.shadowColor = "rgba(188, 92, 255, 0.85)";
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = "rgba(155, 88, 255, 0.74)";
        ctx.shadowColor = "rgba(103, 210, 255, 0.35)";
        ctx.shadowBlur = 6;
      }

      ctx.fillText(char, x, y);
      ctx.shadowBlur = 0;

      if (y > cssH && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 1;
    }

    raf = window.requestAnimationFrame(draw);
  }

  function destroy() {
    active = false;
    if (raf) window.cancelAnimationFrame(raf);
    canvas.remove();
    window.removeEventListener("resize", resize);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  raf = window.requestAnimationFrame(draw);

  window.SVR_GAME_MATRIX_SECRET = {
    phrases: [...phrases],
    enabled: true,
    canvasId: id,
    destroy
  };

  return { update() {}, destroy };
}
