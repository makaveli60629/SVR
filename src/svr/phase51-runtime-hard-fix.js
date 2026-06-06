(function () {
  const PHASE = "SVR Phase 51";

  const duplicateWords = [
    "duplicate",
    "overlay",
    "second",
    "copy",
    "clone",
    "extra",
    "floor2",
    "floor_2",
    "floor-2",
    "tabletop2",
    "tabletop_2",
    "tabletop-2"
  ];

  function labelOf(obj) {
    if (!obj) return "";

    const userData = obj.userData || {};
    return [
      obj.id,
      obj.name,
      obj.type,
      obj.tag,
      userData.id,
      userData.name,
      userData.type,
      userData.asset,
      userData.assetId,
      userData.className
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function categoryOf(label) {
    if (
      label.includes("tabletop") ||
      label.includes("table top") ||
      label.includes("table_top") ||
      label.includes("table-top") ||
      (label.includes("table") && label.includes("top"))
    ) {
      return "tabletop";
    }

    if (label.includes("floor")) {
      return "floor";
    }

    return null;
  }

  function isObviousDuplicate(label) {
    return duplicateWords.some((word) => label.includes(word));
  }

  function scoreObject(obj) {
    const label = labelOf(obj);
    let score = 0;

    if (label.includes("original")) score += 100;
    if (label.includes("main")) score += 40;
    if (label.includes("base")) score += 25;
    if (label.includes("lobby")) score += 20;
    if (label.includes("default")) score += 10;

    if (isObviousDuplicate(label)) score -= 100;
    if (label.includes("svr")) score -= 20;
    if (label.includes("generated")) score -= 30;
    if (label.includes("new")) score -= 15;

    if (obj.visible === false) score -= 10;

    return score;
  }

  function roundTo(value, step) {
    const n = Number(value || 0);
    return Math.round(n / step) * step;
  }

  function vectorSignature(vec, step) {
    if (!vec) return "unknown";

    return [
      roundTo(vec.x, step),
      roundTo(vec.y, step),
      roundTo(vec.z, step)
    ].join(",");
  }

  function getPosition(obj) {
    if (!obj) return null;

    if (obj.getWorldPosition && window.THREE && window.THREE.Vector3) {
      const v = new window.THREE.Vector3();
      obj.getWorldPosition(v);
      return v;
    }

    return obj.position || obj.location || obj.pos || null;
  }

  function getScale(obj) {
    if (!obj) return null;
    return obj.scale || obj.size || obj.dimensions || null;
  }

  function disableObject(obj, reason) {
    if (!obj) return;

    obj.visible = false;
    obj.enabled = false;
    obj.active = false;

    obj.userData = obj.userData || {};
    obj.userData.disabledBy = PHASE;
    obj.userData.disableReason = reason;

    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => {
          if (m) {
            m.visible = false;
            m.opacity = 0;
            m.transparent = true;
          }
        });
      } else {
        obj.material.visible = false;
        obj.material.opacity = 0;
        obj.material.transparent = true;
      }
    }

    if (obj.geometry) {
      obj.frustumCulled = true;
    }
  }

  function collectSceneObjects(scene) {
    const objects = [];

    if (!scene) return objects;

    if (typeof scene.traverse === "function") {
      scene.traverse((obj) => objects.push(obj));
      return objects;
    }

    if (Array.isArray(scene)) {
      return scene;
    }

    if (Array.isArray(scene.objects)) {
      return scene.objects;
    }

    if (Array.isArray(scene.children)) {
      const stack = [...scene.children];

      while (stack.length) {
        const obj = stack.shift();
        objects.push(obj);

        if (obj && Array.isArray(obj.children)) {
          stack.push(...obj.children);
        }
      }
    }

    return objects;
  }

  function applySVRPhase51HardFix(scene) {
    const objects = collectSceneObjects(scene);

    const candidates = objects
      .map((object) => {
        const label = labelOf(object);
        const category = categoryOf(label);

        if (!category) return null;

        return {
          object,
          label,
          category,
          score: scoreObject(object),
          positionSig: vectorSignature(getPosition(object), 0.5),
          scaleSig: vectorSignature(getScale(object), 0.5)
        };
      })
      .filter(Boolean);

    const groups = new Map();

    for (const item of candidates) {
      if (isObviousDuplicate(item.label)) {
        disableObject(
          item.object,
          "Obvious duplicate/overlay floor or tabletop. Original protected."
        );
      }

      const key = `${item.category}|pos:${item.positionSig}|scale:${item.scaleSig}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(item);
    }

    let disabledCount = 0;

    for (const group of groups.values()) {
      if (group.length <= 1) continue;

      const keeper = group
        .slice()
        .sort((a, b) => b.score - a.score)[0];

      for (const item of group) {
        if (item === keeper) continue;

        disableObject(
          item.object,
          `Overlapping duplicate ${item.category} hidden by Phase 51. Kept: ${keeper.label}`
        );

        disabledCount++;
      }
    }

    console.log(`[SVR Phase 51] scanned ${objects.length} objects, duplicate floor/tabletop hidden: ${disabledCount}`);

    return {
      scanned: objects.length,
      candidates: candidates.length,
      disabled: disabledCount
    };
  }

  function findLikelyScenes() {
    const scenes = [];

    const possible = [
      window.scene,
      window.gameScene,
      window.worldScene,
      window.currentScene,
      window.mainScene,
      window.app && window.app.scene,
      window.game && window.game.scene,
      window.game && window.game.world,
      window.world,
      window.SVRWorld
    ];

    for (const item of possible) {
      if (item && !scenes.includes(item)) {
        scenes.push(item);
      }
    }

    return scenes;
  }

  function patchDomOverlays() {
    const nodes = Array.from(
      document.querySelectorAll("[data-object], [data-name], [name], [id], .floor, .tabletop")
    );

    const buckets = new Map();

    for (const node of nodes) {
      const label = [
        node.id,
        node.getAttribute("name"),
        node.getAttribute("data-object"),
        node.getAttribute("data-name"),
        node.className
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const category = categoryOf(label);
      if (!category) continue;

      if (isObviousDuplicate(label)) {
        node.style.display = "none";
        node.setAttribute("data-disabled-by", PHASE);
        continue;
      }

      const rect = node.getBoundingClientRect();
      const sig = `${category}|${Math.round(rect.x)}|${Math.round(rect.y)}|${Math.round(rect.width)}|${Math.round(rect.height)}`;

      if (!buckets.has(sig)) {
        buckets.set(sig, []);
      }

      buckets.get(sig).push({ node, label });
    }

    for (const group of buckets.values()) {
      if (group.length <= 1) continue;

      const keeper =
        group.find((x) => x.label.includes("original")) ||
        group.find((x) => x.label.includes("main")) ||
        group[0];

      for (const item of group) {
        if (item === keeper) continue;

        item.node.style.display = "none";
        item.node.setAttribute("data-disabled-by", PHASE);
        item.node.setAttribute(
          "data-disable-reason",
          "Duplicate floor/tabletop DOM overlay hidden."
        );
      }
    }
  }

  function autoRun() {
    const scenes = findLikelyScenes();

    for (const scene of scenes) {
      applySVRPhase51HardFix(scene);
    }

    patchDomOverlays();
  }

  window.SVRPhase51 = {
    applySVRPhase51HardFix,
    autoRun
  };

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    autoRun();

    if (tries >= 20) {
      clearInterval(timer);
    }
  }, 500);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoRun);
  } else {
    autoRun();
  }
})();
