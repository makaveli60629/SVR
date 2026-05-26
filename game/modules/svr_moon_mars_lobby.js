(function () {
  "use strict";

  const COMPONENT = "svr-lobby-moon-mars";

  function boot(callback) {
    const start = function () {
      const wait = function () {
        if (window.AFRAME) {
          callback();
        } else {
          window.setTimeout(wait, 80);
        }
      };
      wait();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }

  boot(function () {
    if (!AFRAME.components[COMPONENT]) {
      AFRAME.registerComponent(COMPONENT, {
        init: function () {
          this.ensurePlanet({
            id: "svr-lobby-moon",
            label: "MOON",
            position: "-120 95 -210",
            radius: "18",
            color: "#d7d4c2",
            emissive: "#4d4b3d",
            rotationSpeed: "420000"
          });

          this.ensurePlanet({
            id: "svr-lobby-mars",
            label: "MARS",
            position: "125 88 -230",
            radius: "15",
            color: "#b75635",
            emissive: "#5c2115",
            rotationSpeed: "520000"
          });

          console.info("[SVR Phase 248] Lobby Moon and Mars placed high above skyline.");
        },

        ensurePlanet: function (config) {
          if (document.getElementById(config.id)) return;

          const planet = document.createElement("a-sphere");
          planet.setAttribute("id", config.id);
          planet.setAttribute("class", "svr-lobby-celestial");
          planet.setAttribute("position", config.position);
          planet.setAttribute("radius", config.radius);
          planet.setAttribute("segments-width", "48");
          planet.setAttribute("segments-height", "24");
          planet.setAttribute(
            "material",
            "shader: standard; color: " +
              config.color +
              "; emissive: " +
              config.emissive +
              "; roughness: 1; metalness: 0"
          );
          planet.setAttribute(
            "animation__spin",
            "property: rotation; to: 0 360 0; loop: true; dur: " + config.rotationSpeed + "; easing: linear"
          );

          const label = document.createElement("a-text");
          label.setAttribute("value", config.label);
          label.setAttribute("align", "center");
          label.setAttribute("width", "36");
          label.setAttribute("color", "#ffffff");
          label.setAttribute("position", "0 -" + (Number(config.radius) + 6) + " 0");
          label.setAttribute("look-at", "[camera]");
          planet.appendChild(label);

          this.el.appendChild(planet);
        }
      });
    }

    const attach = function () {
      const scene = document.querySelector("a-scene");

      if (!scene) {
        window.setTimeout(attach, 80);
        return;
      }

      if (!scene.hasAttribute(COMPONENT)) {
        scene.setAttribute(COMPONENT, "");
      }
    };

    attach();
  });
})();
