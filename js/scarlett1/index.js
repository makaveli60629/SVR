// /js/scarlett1/index.js — SCARLETT1 ENTRY (PERMANENT)
import { Spine } from "./spine.js";

export const Scarlett1 = {
  spine: null,
  start() {
    if (this.spine) return;
    this.spine = new Spine({ mountId: "app", debug: true });
    this.spine.start();
    window.addEventListener("resize", () => this.spine.onResize());
  }
};
