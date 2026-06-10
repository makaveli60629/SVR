(function(){
  const BUILD = "VERSION-1.7.2-REIKI-SIGN-GLASS-REMOVE-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const TARGET_WORDS = [
    "meet the founder","shyona","royston","trueitive","truitive",
    "holistic wellness","reiki meditation","bodywork","private session",
    "booking presentation","video hologram","store slides","polished demo"
  ];

  function getScene(){
    const af = document.querySelector("a-scene");
    if (af && af.object3D && af.object3D.traverse) return af.object3D;
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].traverse) return window[k];
      if (window[k] && window[k].object3D && window[k].object3D.traverse) return window[k].object3D;
    }
    if (window.world && window.world.scene && window.world.scene.traverse) return window.world.scene;
    if (window.SVR_WORLD && window.SVR_WORLD.scene && window.SVR_WORLD.scene.traverse) return window.SVR_WORLD.scene;
    return null;
  }

  function markHidden(o, reason){
    if (!o) return;
    o.visible = false;
    o.userData = o.userData || {};
    o.userData.SVR_1_7_2_REMOVED = true;
    o.userData.SVR_1_7_2_REMOVE_REASON = reason;
    try {
      if (o.traverse) {
        o.traverse(child => {
          child.visible = false;
          child.userData = child.userData || {};
          child.userData.SVR_1_7_2_REMOVED = true;
          child.userData.SVR_1_7_2_REMOVE_REASON = reason;
        });
      }
    } catch(e){}
  }

  function isReikiZone(o){
    if (!o || !o.position) return false;
    const p = o.position;
    const nearStorefront = (p.z > -24 && p.z < 2 && p.x > -12 && p.x < 12);
    const text = String((o.name || "") + " " + JSON.stringify(o.userData || {})).toLowerCase();
    return nearStorefront || text.includes("reiki") || text.includes("riki") || text.includes("rici") || text.includes("trueitive") || text.includes("truitive");
  }

  function hasFounderText(o){
    const raw = String(
      (o.name || "") + " " +
      (o.text || "") + " " +
      ((o.userData && JSON.stringify(o.userData)) || "") + " " +
      ((o.el && (o.el.getAttribute("value") || o.el.getAttribute("text") || o.el.textContent)) || "")
    ).toLowerCase();

    if (TARGET_WORDS.some(w => raw.includes(w))) return true;

    if (o.el) {
      try {
        const val = String(o.el.getAttribute("value") || "").toLowerCase();
        const txt = String(o.el.getAttribute("text") || "").toLowerCase();
        if (TARGET_WORDS.some(w => val.includes(w) || txt.includes(w))) return true;
      } catch(e){}
    }
    return false;
  }

  function isGlass(o){
    const raw = String((o.name || "") + " " + JSON.stringify(o.userData || "")).toLowerCase();
    return raw.includes("glass") ||
           raw.includes("front_arch") ||
           raw.includes("side_trim") ||
           raw.includes("wall_attached") ||
           raw.includes("black_wall_glass") ||
           raw.includes("svr_reiki_glass") ||
           raw.includes("svr_reiki_black_wall") ||
           raw.includes("phase_1_6_7") ||
           raw.includes("phase_1_6_8");
  }

  function removeDomText(){
    document.querySelectorAll("[value], [text], a-text, .a-text, .text").forEach(el => {
      const raw = String((el.getAttribute("value") || "") + " " + (el.getAttribute("text") || "") + " " + (el.textContent || "")).toLowerCase();
      if (TARGET_WORDS.some(w => raw.includes(w))) {
        el.setAttribute("visible","false");
        if (el.style) el.style.display = "none";
        el.dataset.svr172Removed = "founder-sign";
      }
    });
  }

  function stamp(){
    let b = document.getElementById("svr172BuildBadge");
    if (!b) {
      b = document.createElement("div");
      b.id = "svr172BuildBadge";
      b.style.cssText = "position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(0,255,213,.55);border-radius:10px;background:rgba(0,0,0,.72);color:#eaffff;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none";
      document.body.appendChild(b);
    }
    b.textContent = "BUILD: " + BUILD;
  }

  function apply(){
    stamp();
    removeDomText();

    const scene = getScene();
    if (!scene) return;

    let removedSigns = 0;
    let removedGlass = 0;

    scene.traverse(o => {
      if (!o) return;

      if (hasFounderText(o) && isReikiZone(o)) {
        markHidden(o, "founder / Trueitive sign removed by 1.7.2");
        removedSigns++;
        return;
      }

      if (isGlass(o) && isReikiZone(o)) {
        markHidden(o, "Reiki storefront glass removed by 1.7.2");
        removedGlass++;
        return;
      }

      const raw = String((o.name || "") + " " + JSON.stringify(o.userData || {})).toLowerCase();
      if ((raw.includes("founder") || raw.includes("shyona") || raw.includes("trueitive") || raw.includes("truitive")) && isReikiZone(o)) {
        markHidden(o, "founder / unapproved branding removed by 1.7.2");
        removedSigns++;
      }
    });

    window.SVR_172_REIKI_CLEANUP_STATUS = {
      build: BUILD,
      removedSigns,
      removedGlass,
      note: "Founder sign and Reiki storefront glass are forced hidden every second."
    };

    console.log("[SVR]", BUILD, "active", window.SVR_172_REIKI_CLEANUP_STATUS);
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 700));
  setInterval(apply, 1000);

  window.SVR_172_REIKI_SIGN_GLASS_REMOVE_LOCK = { build: BUILD, apply };
})();
