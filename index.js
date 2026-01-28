// /index.js — FULL ROOT BOOTLOADER (Spine owns rendering)
import { Spine } from "./js/scarlett1/spine.js";

console.log("[root] boot");

const spine = new Spine({
  mountId: "app",
  debug: true,
});

spine.start();

window.addEventListener("resize", () => spine.onResize());

document.addEventListener("scarlett-enter-vr", () => spine.enterVR());
