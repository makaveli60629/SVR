/**
 * SVR Poker — teleport.js
 * A-Frame teleport system using raycasting.
 * F key → toggle teleport mode.
 * Click/trigger on floor → teleport camera rig.
 */

if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('teleport-system', {
    schema: {
      rigSelector:   { type: 'string', default: '#rig'   },
      floorSelector: { type: 'string', default: '#floor' },
    },

    init() {
      this._teleportMode = false;
      this._raycaster    = new THREE.Raycaster();
      this._mouse        = new THREE.Vector2();

      // Keyboard toggle
      window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'f') {
          this._teleportMode = !this._teleportMode;
          console.log('[Teleport] Mode:', this._teleportMode ? 'ON' : 'OFF');
          this.el.sceneEl.canvas.style.cursor = this._teleportMode ? 'crosshair' : '';
        }
      });

      // Click to teleport
      this.el.sceneEl.canvas.addEventListener('click', (e) => {
        if (!this._teleportMode) return;
        this._doTeleport(e);
      });

      console.log('[Teleport] System initialized. Press F to toggle.');
    },

    _doTeleport(mouseEvent) {
      const canvas = this.el.sceneEl.canvas;
      this._mouse.x = (mouseEvent.clientX / canvas.clientWidth ) * 2 - 1;
      this._mouse.y = -(mouseEvent.clientY / canvas.clientHeight) * 2 + 1;

      const camera = this.el.sceneEl.camera;
      this._raycaster.setFromCamera(this._mouse, camera);

      const floor = document.querySelector(this.data.floorSelector);
      if (!floor || !floor.object3D) return;

      const intersects = this._raycaster.intersectObject(floor.object3D, true);
      if (!intersects.length) return;

      const point = intersects[0].point;
      const rig   = document.querySelector(this.data.rigSelector);
      if (rig) {
        rig.setAttribute('position', { x: point.x, y: 0, z: point.z });
        console.log('[Teleport] → ', point.x.toFixed(2), point.z.toFixed(2));
      }
    },
  });
}
