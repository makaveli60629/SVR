// /js/scarlett1/devhud.js
// SCARLETT1 • DEV HUD (PERMANENT)
// Restores your missing buttons: Hide HUD, Reset Spawn, Hawk View, Toggle NPC/RAIL/STAIRS, Hard Reload.

export function mountDevHUD({ Diagnostics, spine }) {
  // Floating "Show HUD" when hidden
  const mini = document.createElement("button");
  mini.id = "scar-mini";
  mini.textContent = "Show HUD";
  mini.style.cssText = `
    position:fixed; right:12px; top:12px; z-index:1000000;
    padding:10px 12px; border-radius:14px;
    background:rgba(20,30,60,0.82); color:#cfe3ff;
    border:1px solid rgba(80,120,255,0.40);
    font:13px system-ui,-apple-system,sans-serif;
    display:none;
  `;
  document.body.appendChild(mini);

  const root = document.createElement("div");
  root.id = "scar-devhud";
  root.style.cssText = `
    position:fixed; right:12px; bottom:14px; z-index:1000000;
    display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end;
    pointer-events:auto;
  `;

  const btn = (label) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = `
      padding:10px 14px; border-radius:14px;
      background:rgba(20,30,60,0.82); color:#cfe3ff;
      border:1px solid rgba(80,120,255,0.40);
      font:13px system-ui,-apple-system,sans-serif;
      backdrop-filter: blur(8px);
    `;
    return b;
  };

  const enterVR = btn("Enter VR");
  enterVR.onclick = () => document.dispatchEvent(new Event("scarlett-enter-vr"));

  const reset = btn("Reset Spawn");
  reset.onclick = () => {
    spine.snapToEagle(true);
    Diagnostics.log("[cam] reset spawn");
  };

  const hawk = btn("Hawk View");
  hawk.onclick = () => {
    spine.snapToEagle(false);
    Diagnostics.log("[cam] hawk view snap");
  };

  const hideHud = btn("Hide HUD");
  hideHud.onclick = () => {
    // Hide diag + devhud + on-screen sticks, but leave mini button.
    const v = true;
    Diagnostics.setHidden(v);
    root.style.display = "none";
    const pads = document.querySelectorAll(".scar-pad");
    pads.forEach(p => p.style.display = "none");
    mini.style.display = "block";
    Diagnostics.log("[ui] HUD hidden");
  };

  mini.onclick = () => {
    Diagnostics.setHidden(false);
    root.style.display = "flex";
    const pads = document.querySelectorAll(".scar-pad");
    pads.forEach(p => p.style.display = "block");
    mini.style.display = "none";
    Diagnostics.log("[ui] HUD shown");
  };

  const toggleRail = btn("Toggle Rail");
  toggleRail.onclick = () => spine.toggleRail();

  const toggleStairs = btn("Toggle Stairs");
  toggleStairs.onclick = () => spine.toggleStairs();

  const toggleNPC = btn("Toggle NPC");
  toggleNPC.onclick = () => spine.toggleNPC();

  const reload = btn("Hard Reload");
  reload.onclick = () => location.reload();

  root.appendChild(enterVR);
  root.appendChild(reset);
  root.appendChild(hawk);
  root.appendChild(toggleRail);
  root.appendChild(toggleStairs);
  root.appendChild(toggleNPC);
  root.appendChild(hideHud);
  root.appendChild(reload);

  document.body.appendChild(root);

  Diagnostics.log("[devhud] buttons mounted ✅");
}
