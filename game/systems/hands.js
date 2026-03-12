/**
 * SVR Poker — hands.js (A-Frame VR hands system)
 * Registers VR hand controller entities for WebXR / A-Frame scenes.
 * Three.js r170 / A-Frame 1.5
 */

if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('vr-hands', {
    schema: {
      leftColor:  { type: 'color', default: '#b95aff' },
      rightColor: { type: 'color', default: '#5dd8ff' },
    },

    init() {
      const scene = this.el;

      // Left hand
      const left = document.createElement('a-entity');
      left.setAttribute('hand-controls', 'hand: left');
      left.setAttribute('laser-controls', 'hand: left');
      left.setAttribute('vr-gesture-controls', 'hand: left');
      left.setAttribute('color', this.data.leftColor);
      scene.appendChild(left);

      // Right hand
      const right = document.createElement('a-entity');
      right.setAttribute('hand-controls', 'hand: right');
      right.setAttribute('laser-controls', 'hand: right');
      right.setAttribute('vr-gesture-controls', 'hand: right');
      right.setAttribute('color', this.data.rightColor);
      scene.appendChild(right);

      console.log('[VRHands] Left and right hand controllers initialized');
    },
  });
}
