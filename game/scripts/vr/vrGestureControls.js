/**
 * SVR Poker — vrGestureControls.js
 * Maps VR controller grip/trigger gestures to poker actions.
 * Works with A-Frame hand-controls or tracked-controls.
 */

/**
 * Attach gesture listeners to a VR hand controller entity.
 *
 * Grip  → bet / raise
 * Trigger → fold
 * Thumbstick click → check / call
 *
 * @param {Element}  handEl   — A-Frame hand entity
 * @param {Function} callback — fn(actionType: string, amount?: number)
 */
export function attachGestureControls(handEl, callback) {
  if (!handEl) { console.warn('[VRGesture] No hand element provided'); return; }

  handEl.addEventListener('gripdown', () => {
    console.log('[VRGesture] Grip → raise');
    callback('raise', 40);
  });

  handEl.addEventListener('triggerdown', () => {
    console.log('[VRGesture] Trigger → fold');
    callback('fold');
  });

  handEl.addEventListener('thumbstickdown', () => {
    console.log('[VRGesture] Thumbstick → call');
    callback('call');
  });

  handEl.addEventListener('xbuttondown', () => {
    console.log('[VRGesture] X/Square → check');
    callback('check');
  });

  handEl.addEventListener('abuttondown', () => {
    console.log('[VRGesture] A/Cross → all-in');
    callback('allin');
  });
}

// Register as A-Frame component
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('vr-gesture-controls', {
    schema: { hand: { type: 'string', default: 'right' } },
    init() {
      this.el.addEventListener('loaded', () => {
        attachGestureControls(this.el, (type, amount) => {
          this.el.sceneEl.emit('pokerAction', { type, amount });
        });
      });
    },
  });
}
