export function applySvrOriginalLobbyCleanup({ scene, log = ()=>{}, setStatus = ()=>{} } = {}){
  const SECOND_FLOOR_KEYWORDS = [
    "secondfloor",
    "second floor",
    "upperfloor",
    "upper floor",
    "floor2",
    "level2",
    "level 2",
    "mezzanine",
    "mezz",
    "balcony",
    "upstairs",
    "stair",
    "stairs",
    "catwalk",
    "skybridge",
    "bridgefloor",
    "upperdeck",
    "upper deck"
  ];

  const PROTECT = [
    "scene",
    "camera",
    "player",
    "rig",
    "hand",
    "controller",
    "watch",
    "teleport",
    "floor",
    "ground",
    "lobby",
    "table",
    "chair",
    "seat",
    "card",
    "chip",
    "moon",
    "mars",
    "skyline",
    "portal",
    "sign",
    "wall"
  ];

  let hidden = 0;
  let scanned = 0;

  function labelOf(obj){
    const parts = [];
    let p = obj;

    while (p) {
      if (p.name) parts.push(p.name);

      if (p.userData) {
        for (const [k,v] of Object.entries(p.userData)) {
          parts.push(String(k));
          if (typeof v === "string") parts.push(v);
        }
      }

      p = p.parent;
    }

    return parts.join(" ").toLowerCase();
  }

  function protectedObject(obj){
    const label = labelOf(obj);
    return PROTECT.some(k => label.includes(k));
  }

  function run(){
    if (!scene) return;

    scene.traverse((obj)=>{
      scanned++;
      const label = labelOf(obj);

      if (protectedObject(obj)) return;

      const match = SECOND_FLOOR_KEYWORDS.some(k => label.includes(k));
      if (match) {
        obj.visible = false;
        obj.userData.svrRemovedReason = "second-floor-cleanup";
        hidden++;
      }
    });

    try {
      document.querySelectorAll("audio, video").forEach((el)=>{
        el.pause();
        el.muted = true;
        el.volume = 0;
      });
    } catch(_e) {}

    try { log("[SVR original lobby cleanup] scanned:", scanned, "hidden:", hidden); } catch(_e) {}
    try { setStatus(`Original lobby clean: music off, second floor hidden (${hidden})`, { force: true }); } catch(_e) {}
  }

  setTimeout(run, 800);
  setTimeout(run, 2500);
  setTimeout(run, 5500);

  return { run };
}
