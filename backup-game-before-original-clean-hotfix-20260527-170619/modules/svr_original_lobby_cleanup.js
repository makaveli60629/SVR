export function applySvrLobbyCleanup({ scene, world, log = ()=>{}, setStatus = ()=>{} } = {}){
  const KEYWORDS = [
    "secondfloor", "second floor", "upperfloor", "upper floor",
    "floor2", "level2", "level 2", "mezzanine", "mezz",
    "balcony", "upstairs", "stair", "stairs", "catwalk",
    "skybridge", "bridgefloor", "upperdeck", "upper deck"
  ];

  let removed = 0;
  let scanned = 0;

  function textOf(obj){
    const parts = [];
    let p = obj;
    while (p) {
      if (p.name) parts.push(p.name);
      if (p.userData) {
        for (const [k,v] of Object.entries(p.userData)) {
          if (typeof v === "string") parts.push(k, v);
          else parts.push(k);
        }
      }
      p = p.parent;
    }
    return parts.join(" ").toLowerCase();
  }

  function isProtected(obj){
    const s = textOf(obj);
    return (
      s.includes("moon") ||
      s.includes("mars") ||
      s.includes("table") ||
      s.includes("watch") ||
      s.includes("hand") ||
      s.includes("camera") ||
      s.includes("player") ||
      s.includes("skyline") ||
      s.includes("portal") ||
      s.includes("floor_marker") ||
      s.includes("teleport")
    );
  }

  function hide(obj, reason){
    if (!obj || isProtected(obj)) return;
    obj.visible = false;
    obj.userData.svrRemovedByCleanup = reason;
    removed++;
  }

  function looksLikeUnnamedUpperPlatform(obj){
    if (!obj.isMesh || !obj.geometry) return false;
    if (isProtected(obj)) return false;

    obj.updateWorldMatrix(true, false);

    const box = new THREE.Box3().setFromObject(obj);
    if (!box || !isFinite(box.min.x) || !isFinite(box.max.x)) return false;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const isHighEnough = center.y > 1.75 && center.y < 6.5;
    const isFlat = size.y < 0.45;
    const isWide = size.x > 2.8 || size.z > 2.8;

    return isHighEnough && isFlat && isWide;
  }

  function run(){
    if (!scene) return;

    scene.traverse((obj)=>{
      scanned++;
      const s = textOf(obj);

      if (KEYWORDS.some(k => s.includes(k))) {
        hide(obj, "keyword-second-floor");
        return;
      }

      if (looksLikeUnnamedUpperPlatform(obj)) {
        hide(obj, "unnamed-upper-platform");
      }
    });

    try {
      document.querySelectorAll("audio, video").forEach((el)=>{
        el.pause();
        el.muted = true;
        el.volume = 0;
      });
    } catch(_e) {}

    log("[SVR cleanup] scanned:", scanned, "hidden:", removed);
    setStatus(`Lobby cleanup: music off, second floor removed (${removed})`, { force: true });
  }

  setTimeout(run, 600);
  setTimeout(run, 1800);
  setTimeout(run, 4200);

  return { run };
}
