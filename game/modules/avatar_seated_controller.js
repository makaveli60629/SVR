// PHASE-86-GLB-AVATAR-MOTION-LOCK
// SVR Poker — seated avatar motion controller
// Game-side only module. Safe fallback: never lets missing GLB/VRM assets crash the table.

(function () {
  const PHASE = "PHASE-86-GLB-AVATAR-MOTION-LOCK";

  const DEFAULT_ACTIONS = {
    idle: { label: "idle", lean: 0, headYaw: 0, handReach: 0 },
    waiting: { label: "waiting", lean: 0, headYaw: 0.04, handReach: 0 },
    active: { label: "active", lean: 0.08, headYaw: 0, handReach: 0.08 },
    check: { label: "check", lean: 0.05, headYaw: 0, handReach: 0.18 },
    call: { label: "call", lean: 0.09, headYaw: 0, handReach: 0.26 },
    raise: { label: "raise", lean: 0.13, headYaw: 0, handReach: 0.35 },
    fold: { label: "fold", lean: -0.05, headYaw: -0.08, handReach: -0.08 },
    peek: { label: "peek", lean: 0.12, headYaw: 0.05, handReach: 0.22 },
    win: { label: "win", lean: 0.05, headYaw: 0.1, handReach: 0.15 },
    lose: { label: "lose", lean: -0.07, headYaw: -0.05, handReach: 0 },
    showdown: { label: "showdown", lean: 0.04, headYaw: 0.03, handReach: 0.05 }
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function createFallbackAvatar(index, name) {
    const group = new THREE.Group();
    group.name = `SVR_Fallback_Seated_Avatar_${index}`;

    const skin = new THREE.MeshStandardMaterial({ color: 0x9b6a45, roughness: 0.75 });
    const suit = new THREE.MeshStandardMaterial({ color: 0x191923, roughness: 0.8 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.55 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 6, 10), suit);
    torso.name = "torso";
    torso.position.set(0, 0.72, 0);
    torso.rotation.x = 0.06;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), skin);
    head.name = "head";
    head.position.set(0, 1.12, 0.02);
    group.add(head);

    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.42, 5, 8), skin);
    leftArm.name = "leftArm";
    leftArm.position.set(-0.23, 0.78, -0.15);
    leftArm.rotation.set(1.1, 0.12, 0.32);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.42, 5, 8), skin);
    rightArm.name = "rightArm";
    rightArm.position.set(0.23, 0.78, -0.15);
    rightArm.rotation.set(1.1, -0.12, -0.32);
    group.add(rightArm);

    const namePlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.055, 0.015), accent);
    namePlate.name = "namePlate";
    namePlate.position.set(0, 1.38, 0);
    group.add(namePlate);

    group.userData.svrAvatar = {
      fallback: true,
      name: name || `BOT ${index + 1}`,
      action: "idle",
      phase: PHASE,
      parts: { torso, head, leftArm, rightArm }
    };

    return group;
  }

  class SVRAvatarSeatedController {
    constructor(options = {}) {
      this.phase = PHASE;
      this.scene = options.scene || null;
      this.tableCenter = options.tableCenter || new THREE.Vector3(0, 0, 0);
      this.tableRadius = options.tableRadius || 2.15;
      this.avatars = [];
      this.clock = new THREE.Clock();
      this.enabled = true;
      this.assetMap = options.assetMap || {};
      this.loader = null;
      this._initLoader();
    }

    _initLoader() {
      if (typeof THREE !== "undefined" && THREE.GLTFLoader) {
        this.loader = new THREE.GLTFLoader();
      } else if (typeof GLTFLoader !== "undefined") {
        this.loader = new GLTFLoader();
      } else {
        this.loader = null;
      }
    }

    seatPosition(index, total = 6) {
      // South/front seat is reserved for the human player; bots fill remaining seats.
      const botAngles = [235, 180, 125, 55, 305];
      const deg = botAngles[index % botAngles.length];
      const rad = (deg * Math.PI) / 180;
      return new THREE.Vector3(
        Math.sin(rad) * this.tableRadius,
        0,
        Math.cos(rad) * this.tableRadius
      ).add(this.tableCenter);
    }

    faceTable(obj) {
      const dx = this.tableCenter.x - obj.position.x;
      const dz = this.tableCenter.z - obj.position.z;
      obj.rotation.y = Math.atan2(dx, dz);
    }

    async loadAvatar(index, url, name) {
      if (!this.scene) return null;

      const fallback = () => {
        const avatar = createFallbackAvatar(index, name);
        avatar.position.copy(this.seatPosition(index));
        this.faceTable(avatar);
        this.scene.add(avatar);
        this.avatars[index] = avatar;
        return avatar;
      };

      if (!url || !this.loader) return fallback();

      return new Promise((resolve) => {
        this.loader.load(
          url,
          (gltf) => {
            const avatar = gltf.scene || fallback();
            avatar.name = `SVR_GLB_Seated_Avatar_${index}`;
            avatar.position.copy(this.seatPosition(index));
            avatar.scale.setScalar(0.92);
            this.faceTable(avatar);
            avatar.userData.svrAvatar = {
              fallback: false,
              name: name || `BOT ${index + 1}`,
              action: "idle",
              phase: PHASE,
              mixer: gltf.animations && gltf.animations.length ? new THREE.AnimationMixer(avatar) : null,
              clips: gltf.animations || []
            };
            this.scene.add(avatar);
            this.avatars[index] = avatar;
            resolve(avatar);
          },
          undefined,
          () => resolve(fallback())
        );
      });
    }

    async createTableBots(botNames = ["Nova", "Echo", "Vega", "Orion", "Mika"]) {
      const jobs = botNames.slice(0, 5).map((name, index) => {
        const url = this.assetMap[name] || this.assetMap[index] || null;
        return this.loadAvatar(index, url, name);
      });
      return Promise.all(jobs);
    }

    setAction(index, action) {
      const avatar = this.avatars[index];
      if (!avatar || !avatar.userData.svrAvatar) return false;
      avatar.userData.svrAvatar.action = DEFAULT_ACTIONS[action] ? action : "idle";
      return true;
    }

    setActive(index) {
      this.avatars.forEach((_, i) => this.setAction(i, i === index ? "active" : "waiting"));
    }

    update(dt = 0.016) {
      if (!this.enabled) return;
      const t = performance.now() * 0.001;

      this.avatars.forEach((avatar, index) => {
        if (!avatar || !avatar.userData.svrAvatar) return;
        const state = DEFAULT_ACTIONS[avatar.userData.svrAvatar.action] || DEFAULT_ACTIONS.idle;
        const parts = avatar.userData.svrAvatar.parts || {};

        const breathe = Math.sin(t * 1.7 + index) * 0.012;
        const lean = clamp(state.lean + breathe, -0.12, 0.18);

        avatar.position.y = breathe * 0.2;

        if (parts.torso) {
          parts.torso.rotation.x = 0.06 + lean;
        }
        if (parts.head) {
          parts.head.rotation.y = state.headYaw + Math.sin(t * 1.1 + index) * 0.035;
          parts.head.rotation.x = -lean * 0.25;
        }
        if (parts.leftArm) {
          parts.leftArm.rotation.x = 1.1 - state.handReach;
          parts.leftArm.rotation.z = 0.32 + state.handReach * 0.25;
        }
        if (parts.rightArm) {
          parts.rightArm.rotation.x = 1.1 - state.handReach;
          parts.rightArm.rotation.z = -0.32 - state.handReach * 0.25;
        }

        const mixer = avatar.userData.svrAvatar.mixer;
        if (mixer) mixer.update(dt);
      });
    }

    bindToPokerEvents(eventBus = window) {
      eventBus.addEventListener?.("svr:poker:turn", (ev) => {
        const seatIndex = ev.detail?.seatIndex ?? ev.detail?.botIndex;
        if (Number.isFinite(seatIndex)) this.setActive(seatIndex);
      });

      eventBus.addEventListener?.("svr:poker:action", (ev) => {
        const seatIndex = ev.detail?.seatIndex ?? ev.detail?.botIndex;
        const action = ev.detail?.action || "idle";
        if (Number.isFinite(seatIndex)) this.setAction(seatIndex, action);
      });

      eventBus.addEventListener?.("svr:poker:showdown", () => {
        this.avatars.forEach((_, i) => this.setAction(i, "showdown"));
      });

      eventBus.addEventListener?.("svr:poker:winner", (ev) => {
        const seatIndex = ev.detail?.seatIndex ?? ev.detail?.botIndex;
        if (Number.isFinite(seatIndex)) this.setAction(seatIndex, "win");
      });
    }
  }

  window.SVRAvatarSeatedController = SVRAvatarSeatedController;
  window.SVR_AVATAR_MOTION_LOCK = {
    phase: PHASE,
    status: "loaded",
    safeFallback: true,
    noTPoseFallback: true,
    preferredAssetType: "glb-vrm"
  };
})();
