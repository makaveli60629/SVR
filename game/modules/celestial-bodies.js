/**
 * ============================================================================
 * ScarlettVR Poker / SVR Poker
 * Version 1.6.6 - Celestial Sky Module + Neon Light Lock
 * File: modules/celestial-bodies.js
 * ============================================================================
 * Purpose:
 * - Single authoritative Moon/Mars controller.
 * - High-sky placement so planets are visible over buildings from lobby.
 * - Cyberpunk purple/magenta directional lighting.
 * - Hides older/lower Moon/Mars duplicates.
 * - Does not touch Reiki room or private scene.
 * ============================================================================
 */
(function(){
  const BUILD = "VERSION-1.6.6-CELESTIAL-BODIES-NEON-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const DEFAULTS = {
    moonScale: "340 340 340",
    marsScale: "300 300 300",
    moonPosition: "-280 4500 -3200",
    marsPosition: "260 4500 -3700",
    purpleNeonHex: "#9B30FF",
    marsNeonHex: "#FF007F",
    moonTexture: "assets/textures/moon.jpg",
    marsTexture: "assets/textures/mars.jpg"
  };

  function stampBuild(){
    let badge = document.getElementById("svr166BuildBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "svr166BuildBadge";
      badge.style.cssText = "position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(0,255,213,.55);border-radius:10px;background:rgba(0,0,0,.70);color:#eaffff;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none";
      document.body.appendChild(badge);
    }
    badge.textContent = "BUILD: " + BUILD;

    document.querySelectorAll("body *").forEach(el => {
      if (!el || !el.childNodes || el.childNodes.length !== 1) return;
      const txt = String(el.textContent || "");
      if (txt.includes("BUILD:") || txt.includes("UPDATE-3.0-PHASE-120") || txt.includes("VERSION-1.6.")) {
        el.textContent = "BUILD: " + BUILD;
        el.setAttribute("data-svr166-build-label-fixed","true");
      }
    });
  }

  function getAScene(){
    return document.querySelector("a-scene");
  }

  function getThreeScene(){
    const af = getAScene();
    if (af && af.object3D && af.object3D.add && af.object3D.traverse) return af.object3D;
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].add && window[k].traverse) return window[k];
      if (window[k] && window[k].object3D && window[k].object3D.add) return window[k].object3D;
    }
    if (window.world && window.world.scene && window.world.scene.add) return window.world.scene;
    if (window.SVR_WORLD && window.SVR_WORLD.scene && window.SVR_WORLD.scene.add) return window.SVR_WORLD.scene;
    return null;
  }

  function hideOldPlanets(scene){
    if (!scene || !scene.traverse) return;
    scene.traverse(o => {
      const ud = o.userData || {};
      if (ud.SVR_CELESTIAL_166_LOCK || ud.SVR_CELESTIAL_166_HALO) return;

      const mat = o.material || {};
      const txt = String((o.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      const isOldPlanet = txt.includes("moon") || txt.includes("mars") || ud.SVR_REAL_PLANET === "moon" || ud.SVR_REAL_PLANET === "mars";

      if (isOldPlanet && !ud.SVR_DO_NOT_REMOVE) {
        o.visible = false;
        o.userData = o.userData || {};
        o.userData.SVR_166_HIDDEN_OLD_PLANET_DUPLICATE = true;
      }
    });
  }

  function capBuildings(scene){
    if (!scene || !scene.traverse) return;
    const c = {
      minX: -1200,
      maxX: 1050,
      minZ: -4400,
      maxZ: -650,
      maxY: 180,
      maxScaleY: 0.70
    };

    scene.traverse(o => {
      if (!o || !o.position) return;
      const ud = o.userData || {};
      if (ud.SVR_CELESTIAL_166_LOCK || ud.SVR_CELESTIAL_166_HALO || ud.SVR_PERMANENT_SKY_OBJECT) return;

      const t = String((o.name || "") + " " + JSON.stringify(ud)).toLowerCase();
      const building = t.includes("building") || t.includes("tower") || t.includes("skyline") || t.includes("banner") || t.includes("megatron") || t.includes("sponsor");
      if (!building) return;

      const p = o.position;
      const inCorridor = p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ;
      if (!inCorridor) return;

      o.userData = o.userData || {};
      o.userData.SVR_166_CAPPED_FOR_CELESTIAL_SKY = true;
      o.userData.SVR_VIEWABLE_FROM_LOBBY = true;

      if (p.y > c.maxY) p.y = c.maxY;
      if (o.scale && typeof o.scale.y === "number" && o.scale.y > c.maxScaleY) o.scale.y = c.maxScaleY;
    });
  }

  function registerComponent(){
    if (!window.AFRAME || AFRAME.components["celestial-sky"]) return false;

    AFRAME.registerComponent("celestial-sky", {
      schema: {
        moonScale: { type:"string", default:DEFAULTS.moonScale },
        marsScale: { type:"string", default:DEFAULTS.marsScale },
        moonPosition: { type:"string", default:DEFAULTS.moonPosition },
        marsPosition: { type:"string", default:DEFAULTS.marsPosition },
        purpleNeonHex: { type:"string", default:DEFAULTS.purpleNeonHex },
        marsNeonHex: { type:"string", default:DEFAULTS.marsNeonHex }
      },

      init: function(){
        this.el.setAttribute("data-svr-celestial-build", BUILD);
        this.buildCelestial();
        this.tickLock = this.tickLock.bind(this);
        this.tickLock();
        console.log("[SVR]", BUILD, "Celestial Sky Module initialized.");
      },

      buildCelestial: function(){
        const el = this.el;
        const data = this.data;

        // Clean any older celestial version first.
        ["svr-celestial-moon","svr-celestial-mars"].forEach(id => {
          const old = document.getElementById(id);
          if (old && old.parentNode) old.parentNode.removeChild(old);
        });

        // Moon group.
        this.moonGroup = document.createElement("a-entity");
        this.moonGroup.setAttribute("id", "svr-celestial-moon");
        this.moonGroup.setAttribute("position", data.moonPosition);
        this.moonGroup.setAttribute("data-svr-celestial", "moon");

        const moonMesh = document.createElement("a-sphere");
        moonMesh.setAttribute("radius", "1");
        moonMesh.setAttribute("scale", data.moonScale);
        moonMesh.setAttribute("src", DEFAULTS.moonTexture);
        moonMesh.setAttribute("material", "shader: standard; roughness: 0.85; metalness: 0.12; emissive: #5b3c7a; emissiveIntensity: 0.12");
        moonMesh.setAttribute("animation", "property: rotation; to: 0 360 0; loop: true; dur: 280000; easing: linear");
        moonMesh.classList.remove("raycastable");
        this.moonGroup.appendChild(moonMesh);

        this.moonLight = document.createElement("a-entity");
        this.moonLight.setAttribute("light", `type: directional; color: ${data.purpleNeonHex}; intensity: 1.8; castShadow: false`);
        this.moonLight.setAttribute("position", "50 100 -50");
        this.moonGroup.appendChild(this.moonLight);

        // Mars group.
        this.marsGroup = document.createElement("a-entity");
        this.marsGroup.setAttribute("id", "svr-celestial-mars");
        this.marsGroup.setAttribute("position", data.marsPosition);
        this.marsGroup.setAttribute("data-svr-celestial", "mars");

        const marsMesh = document.createElement("a-sphere");
        marsMesh.setAttribute("radius", "1");
        marsMesh.setAttribute("scale", data.marsScale);
        marsMesh.setAttribute("src", DEFAULTS.marsTexture);
        marsMesh.setAttribute("material", "shader: standard; roughness: 0.70; metalness: 0.10; emissive: #522020; emissiveIntensity: 0.10");
        marsMesh.setAttribute("animation", "property: rotation; to: 0 -360 0; loop: true; dur: 340000; easing: linear");
        marsMesh.classList.remove("raycastable");
        this.marsGroup.appendChild(marsMesh);

        this.marsLight = document.createElement("a-entity");
        this.marsLight.setAttribute("light", `type: directional; color: ${data.marsNeonHex}; intensity: 1.4; castShadow: false`);
        this.marsLight.setAttribute("position", "-50 80 -50");
        this.marsGroup.appendChild(this.marsLight);

        el.appendChild(this.moonGroup);
        el.appendChild(this.marsGroup);

        // Mark object3D after A-Frame creates it.
        setTimeout(() => {
          [this.moonGroup, this.marsGroup].forEach(group => {
            if (!group || !group.object3D) return;
            group.object3D.traverse(o => {
              o.frustumCulled = false;
              o.renderOrder = 1000;
              o.userData = o.userData || {};
              o.userData.SVR_CELESTIAL_166_LOCK = true;
              o.userData.SVR_PERMANENT_SKY_OBJECT = true;
            });
          });
        }, 500);
      },

      tickLock: function(){
        requestAnimationFrame(this.tickLock);

        if (this.moonGroup) {
          this.moonGroup.setAttribute("position", this.data.moonPosition);
          this.moonGroup.setAttribute("visible", "true");
        }

        if (this.marsGroup) {
          this.marsGroup.setAttribute("position", this.data.marsPosition);
          this.marsGroup.setAttribute("visible", "true");
        }

        const scene = getThreeScene();
        if (scene) {
          hideOldPlanets(scene);
          capBuildings(scene);
        }
      },

      remove: function(){
        // Allow safe cleanup during hot reload, but do not remove in normal runtime.
        console.warn("[SVR]", BUILD, "celestial-sky remove requested; module is locked for runtime.");
      }
    });

    return true;
  }

  function install(){
    stampBuild();

    if (!registerComponent() && (!window.AFRAME || !AFRAME.components["celestial-sky"])) {
      setTimeout(install, 300);
      return;
    }

    const scene = getAScene();
    if (!scene) {
      setTimeout(install, 300);
      return;
    }

    if (!scene.hasAttribute("celestial-sky")) {
      scene.setAttribute("celestial-sky", {
        purpleNeonHex: DEFAULTS.purpleNeonHex,
        marsNeonHex: DEFAULTS.marsNeonHex,
        moonScale: DEFAULTS.moonScale,
        marsScale: DEFAULTS.marsScale,
        moonPosition: DEFAULTS.moonPosition,
        marsPosition: DEFAULTS.marsPosition
      });
    } else {
      // Force values even if a stale attribute exists.
      scene.setAttribute("celestial-sky", "moonScale", DEFAULTS.moonScale);
      scene.setAttribute("celestial-sky", "marsScale", DEFAULTS.marsScale);
      scene.setAttribute("celestial-sky", "moonPosition", DEFAULTS.moonPosition);
      scene.setAttribute("celestial-sky", "marsPosition", DEFAULTS.marsPosition);
      scene.setAttribute("celestial-sky", "purpleNeonHex", DEFAULTS.purpleNeonHex);
      scene.setAttribute("celestial-sky", "marsNeonHex", DEFAULTS.marsNeonHex);
    }

    const threeScene = getThreeScene();
    if (threeScene) {
      hideOldPlanets(threeScene);
      capBuildings(threeScene);
    }

    console.log("[SVR]", BUILD, "installed as only active celestial sky layer.");
  }

  document.addEventListener("DOMContentLoaded", install);
  window.addEventListener("load", () => setTimeout(install, 700));
  setInterval(install, 2500);

  window.SVR_166_CELESTIAL_SKY = {
    build: BUILD,
    defaults: DEFAULTS,
    install
  };
})();
