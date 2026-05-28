(function () {
  "use strict";

  const COMPONENT = "svr-quest-locomotion-teleport";

  function boot(callback) {
    const start = function () {
      const wait = function () {
        if (window.AFRAME && (window.AFRAME.THREE || window.THREE)) {
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
    const THREE_REF = window.AFRAME.THREE || window.THREE;

    if (!AFRAME.components[COMPONENT]) {
      AFRAME.registerComponent(COMPONENT, {
        schema: {
          speed: { type: "number", default: 2.4 },
          snapDegrees: { type: "number", default: 45 },
          teleportMax: { type: "number", default: 40 }
        },

        init: function () {
          this.THREE = THREE_REF;
          this.rig = null;
          this.cameraEl = null;
          this.moveAxis = 0;
          this.snapLocked = false;
          this.teleporting = false;
          this.activeSource = null;
          this.validTarget = false;

          this.origin = new this.THREE.Vector3();
          this.direction = new this.THREE.Vector3();
          this.hit = new this.THREE.Vector3();
          this.lastTarget = new this.THREE.Vector3();
          this.quat = new this.THREE.Quaternion();
          this.floorPlane = new this.THREE.Plane(new this.THREE.Vector3(0, 1, 0), 0);
          this.raycaster = new this.THREE.Raycaster();

          this.createTeleportVisuals();

          window.setTimeout(() => this.setup(), 0);
          window.addEventListener("blur", () => this.cancelTeleport());
        },

        setup: function () {
          const scene = this.el;

          if (!scene.hasAttribute("webxr")) {
            scene.setAttribute("webxr", "optionalFeatures: hand-tracking, local-floor, bounded-floor");
          }

          this.cameraEl =
            (scene.camera && scene.camera.el) ||
            scene.querySelector("[camera]") ||
            scene.querySelector("#camera") ||
            scene.querySelector("#playerCamera");

          if (!this.cameraEl) {
            this.cameraEl = document.createElement("a-entity");
            this.cameraEl.setAttribute("id", "svr-player-camera");
            this.cameraEl.setAttribute("camera", "");
            this.cameraEl.setAttribute("look-controls", "");
            this.cameraEl.setAttribute("position", "0 1.6 0");
            scene.appendChild(this.cameraEl);
          }

          this.rig = this.findOrCreateRig(scene, this.cameraEl);

          this.ensureController("right", true);
          this.ensureController("left", false);
          this.ensureHand("right");
          this.ensureHand("left");

          console.info("[SVR Phase 248] Quest locomotion, snap turn, controller teleport, and hand teleport armed.");
        },

        findOrCreateRig: function (scene, cameraEl) {
          const ids = ["player-rig", "playerRig", "cameraRig", "camera-rig", "rig", "vr-rig", "svr-player-rig"];

          for (const id of ids) {
            const found = scene.querySelector("#" + id);
            if (found) return found;
          }

          if (cameraEl.parentElement && cameraEl.parentElement !== scene) {
            return cameraEl.parentElement;
          }

          const rig = document.createElement("a-entity");
          rig.setAttribute("id", "svr-player-rig");
          rig.setAttribute("position", "0 0 0");
          scene.appendChild(rig);

          if (cameraEl.parentElement === scene) {
            const camPos = cameraEl.getAttribute("position") || { x: 0, y: 1.6, z: 0 };
            rig.setAttribute("position", {
              x: Number(camPos.x || 0),
              y: 0,
              z: Number(camPos.z || 0)
            });
            cameraEl.setAttribute("position", {
              x: 0,
              y: Number(camPos.y || 1.6),
              z: 0
            });
            rig.appendChild(cameraEl);
          }

          return rig;
        },

        ensureController: function (hand, useMove) {
          let el = document.querySelector("#svr-" + hand + "-controller");

          if (!el) {
            el = document.createElement("a-entity");
            el.setAttribute("id", "svr-" + hand + "-controller");
            this.rig.appendChild(el);
          }

          if (!el.hasAttribute("oculus-touch-controls")) {
            el.setAttribute("oculus-touch-controls", "hand: " + hand + "; model: false");
          }

          if (!el.hasAttribute("laser-controls")) {
            el.setAttribute("laser-controls", "hand: " + hand);
          }

          el.setAttribute("visible", "false");

          this.bindTeleportEvents(el);

          if (useMove) {
            el.addEventListener("thumbstickmoved", (event) => this.handleAxis(event.detail || {}));
            el.addEventListener("axismove", (event) => this.handleAxis(event.detail || {}));
          }

          return el;
        },

        ensureHand: function (hand) {
          let el = document.querySelector("#svr-" + hand + "-hand");

          if (!el) {
            el = document.createElement("a-entity");
            el.setAttribute("id", "svr-" + hand + "-hand");
            this.rig.appendChild(el);
          }

          if (!el.hasAttribute("hand-tracking-controls")) {
            el.setAttribute("hand-tracking-controls", "hand: " + hand + "; modelColor: #e8b991");
          }

          this.bindTeleportEvents(el);
          return el;
        },

        bindTeleportEvents: function (el) {
          const startEvents = [
            "triggerdown",
            "gripdown",
            "abuttondown",
            "pinchstarted",
            "fiststarted",
            "selectstart"
          ];

          const endEvents = [
            "triggerup",
            "gripup",
            "abuttonup",
            "pinchended",
            "fistended",
            "selectend"
          ];

          startEvents.forEach((name) => {
            el.addEventListener(name, () => this.startTeleport(el));
          });

          endEvents.forEach((name) => {
            el.addEventListener(name, () => this.completeTeleport());
          });
        },

        handleAxis: function (detail) {
          const axis = Array.isArray(detail.axis) ? detail.axis : [];
          const x = Number.isFinite(detail.x) ? detail.x : Number(axis[0] || 0);
          const y = Number.isFinite(detail.y) ? detail.y : Number(axis[1] || 0);

          if (Math.abs(x) > 0.75 && !this.snapLocked) {
            this.snapLocked = true;
            this.snapTurn(x);
          }

          if (Math.abs(x) < 0.25) {
            this.snapLocked = false;
          }

          this.moveAxis = Math.abs(y) > 0.12 ? -y : 0;
        },

        snapTurn: function (x) {
          if (!this.rig) return;

          const rot = this.rig.getAttribute("rotation") || { x: 0, y: 0, z: 0 };
          const direction = x > 0 ? -1 : 1;
          rot.y = Number(rot.y || 0) + direction * this.data.snapDegrees;
          this.rig.setAttribute("rotation", rot);
        },

        tick: function (time, delta) {
          if (!this.rig || !this.cameraEl) return;

          if (this.teleporting) {
            this.updateTeleportTarget();
          }

          this.applyLocomotion(delta);
        },

        applyLocomotion: function (delta) {
          if (Math.abs(this.moveAxis) < 0.05 || this.teleporting) return;

          const dt = Math.min(delta / 1000, 0.05);
          this.cameraEl.object3D.getWorldQuaternion(this.quat);

          const forward = new this.THREE.Vector3(0, 0, -1).applyQuaternion(this.quat);
          forward.y = 0;

          if (forward.lengthSq() < 0.0001) return;

          forward.normalize();

          const amount = this.moveAxis * this.data.speed * dt;
          this.rig.object3D.position.addScaledVector(forward, amount);
        },

        createTeleportVisuals: function () {
          this.targetEl = document.createElement("a-ring");
          this.targetEl.setAttribute("id", "svr-teleport-target-ring");
          this.targetEl.setAttribute("radius-inner", "0.34");
          this.targetEl.setAttribute("radius-outer", "0.48");
          this.targetEl.setAttribute("rotation", "-90 0 0");
          this.targetEl.setAttribute("material", "color: #41f3ff; emissive: #18cfff; transparent: true; opacity: 0.9");
          this.targetEl.setAttribute("visible", "false");
          this.el.appendChild(this.targetEl);

          const geometry = new this.THREE.BufferGeometry().setFromPoints([
            new this.THREE.Vector3(0, 0, 0),
            new this.THREE.Vector3(0, 0, -1)
          ]);

          const material = new this.THREE.LineBasicMaterial({
            color: 0x41f3ff,
            transparent: true,
            opacity: 0.85
          });

          this.line = new this.THREE.Line(geometry, material);
          this.line.visible = false;
          this.el.object3D.add(this.line);
        },

        startTeleport: function (source) {
          this.activeSource = source;
          this.teleporting = true;
          this.validTarget = false;

          if (this.targetEl) this.targetEl.setAttribute("visible", "true");
          if (this.line) this.line.visible = true;

          this.updateTeleportTarget();
        },

        updateTeleportTarget: function () {
          if (!this.activeSource) return;

          this.activeSource.object3D.updateMatrixWorld(true);
          this.activeSource.object3D.getWorldPosition(this.origin);
          this.activeSource.object3D.getWorldQuaternion(this.quat);

          this.direction.set(0, 0, -1).applyQuaternion(this.quat);

          if (!Number.isFinite(this.direction.x) || this.direction.lengthSq() < 0.0001) {
            this.direction.set(0, -0.35, -1);
          }

          if (this.direction.y > -0.12) {
            this.direction.y = -0.35;
          }

          this.direction.normalize();

          const rayOrigin = this.origin.clone().addScaledVector(this.direction, 0.18);
          this.raycaster.set(rayOrigin, this.direction);

          const intersected = this.raycaster.ray.intersectPlane(this.floorPlane, this.hit);
          const distance = intersected ? rayOrigin.distanceTo(this.hit) : 9999;

          if (!intersected || distance < 0.5 || distance > this.data.teleportMax) {
            this.hit.copy(rayOrigin).addScaledVector(this.direction, Math.min(5, this.data.teleportMax));
            this.hit.y = 0;
          }

          this.validTarget = true;
          this.lastTarget.copy(this.hit);

          if (this.targetEl) {
            this.targetEl.setAttribute("position", {
              x: this.lastTarget.x,
              y: 0.035,
              z: this.lastTarget.z
            });
          }

          if (this.line && this.line.geometry && this.line.geometry.attributes.position) {
            const pos = this.line.geometry.attributes.position.array;
            pos[0] = rayOrigin.x;
            pos[1] = rayOrigin.y;
            pos[2] = rayOrigin.z;
            pos[3] = this.lastTarget.x;
            pos[4] = this.lastTarget.y + 0.05;
            pos[5] = this.lastTarget.z;
            this.line.geometry.attributes.position.needsUpdate = true;
            this.line.geometry.computeBoundingSphere();
          }
        },

        completeTeleport: function () {
          if (this.teleporting && this.validTarget && this.rig) {
            const current = this.rig.getAttribute("position") || { x: 0, y: 0, z: 0 };
            this.rig.setAttribute("position", {
              x: this.lastTarget.x,
              y: Number(current.y || 0),
              z: this.lastTarget.z
            });
          }

          this.cancelTeleport();
        },

        cancelTeleport: function () {
          this.teleporting = false;
          this.activeSource = null;
          this.validTarget = false;

          if (this.targetEl) this.targetEl.setAttribute("visible", "false");
          if (this.line) this.line.visible = false;
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
