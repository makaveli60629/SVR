/**
 * Reiki Meditation Private Room Component
 * A serene, immersive meditation environment with calming visuals and audio
 * 
 * Usage:
 * <a-entity reiki-meditation-room="roomId: private-001"></a-entity>
 */

AFRAME.registerComponent('reiki-meditation-room', {
  schema: {
    roomId: { type: 'string', default: 'reiki-default' },
    isPrivate: { type: 'boolean', default: true },
    ambientLight: { type: 'number', default: 0.6 },
    soundVolume: { type: 'number', default: 0.5 }
  },

  init: function() {
    const scene = this.el.sceneEl;
    const data = this.data;

    this.createEnvironment();
    this.setupLighting(data.ambientLight);
    this.createMeditationElements();
    this.setupAudio(data.soundVolume);
    this.createEnergyField();

    console.log(`🧘 Reiki Meditation Room initialized: ${data.roomId}`);
  },

  createEnvironment: function() {
    const scene = this.el.sceneEl;

    const sky = document.createElement('a-sphere');
    sky.setAttribute('radius', '500');
    sky.setAttribute('segments-height', '64');
    sky.setAttribute('segments-width', '64');
    sky.setAttribute('material', 'shader: flat; color: #0a1f3a; side: back;');
    sky.setAttribute('position', '0 0 0');
    scene.appendChild(sky);

    const ground = document.createElement('a-plane');
    ground.setAttribute('width', '100');
    ground.setAttribute('height', '100');
    ground.setAttribute('color', '#1a1a2e');
    ground.setAttribute('position', '0 0 0');
    ground.setAttribute('rotation', '-90 0 0');
    ground.setAttribute('material', 'emissive: #16213e; emissiveIntensity: 0.3;');
    scene.appendChild(ground);
  },

  setupLighting: function(ambientLevel) {
    const scene = this.el.sceneEl;

    const ambientLight = document.createElement('a-light');
    ambientLight.setAttribute('type', 'ambient');
    ambientLight.setAttribute('intensity', ambientLevel);
    ambientLight.setAttribute('color', '#7b68ee');
    scene.appendChild(ambientLight);

    const mainLight = document.createElement('a-light');
    mainLight.setAttribute('type', 'point');
    mainLight.setAttribute('position', '0 20 0');
    mainLight.setAttribute('intensity', 0.8);
    mainLight.setAttribute('distance', '100');
    mainLight.setAttribute('decay', '2');
    mainLight.setAttribute('color', '#ffffff');
    scene.appendChild(mainLight);

    const spiritualLight = document.createElement('a-light');
    spiritualLight.setAttribute('type', 'point');
    spiritualLight.setAttribute('position', '-15 15 -15');
    spiritualLight.setAttribute('intensity', 0.5);
    spiritualLight.setAttribute('distance', '80');
    spiritualLight.setAttribute('decay', '2');
    spiritualLight.setAttribute('color', '#9370db');
    scene.appendChild(spiritualLight);

    const accentLight = document.createElement('a-light');
    accentLight.setAttribute('type', 'point');
    accentLight.setAttribute('position', '15 15 -15');
    accentLight.setAttribute('intensity', 0.4);
    accentLight.setAttribute('distance', '80');
    accentLight.setAttribute('decay', '2');
    accentLight.setAttribute('color', '#ffd700');
    scene.appendChild(accentLight);
  },

  createMeditationElements: function() {
    const scene = this.el.sceneEl;

    const centerSphere = document.createElement('a-sphere');
    centerSphere.setAttribute('position', '0 2 -5');
    centerSphere.setAttribute('radius', '2');
    centerSphere.setAttribute('segments-height', '32');
    centerSphere.setAttribute('segments-width', '32');
    centerSphere.setAttribute('material', 'color: #9370db; emissive: #7b68ee; emissiveIntensity: 0.8; shininess: 100;');
    centerSphere.setAttribute('animation', 'property: scale; from: 1 1 1; to: 1.1 1.1 1.1; dur: 3000; dir: alternate; loop: true;');
    scene.appendChild(centerSphere);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 5;
      const z = Math.sin(angle) * 5 - 5;

      const crystal = document.createElement('a-dodecahedron');
      crystal.setAttribute('position', `${x} 2 ${z}`);
      crystal.setAttribute('radius', '0.4');
      crystal.setAttribute('material', 'color: #ffd700; emissive: #ffed4e; emissiveIntensity: 0.6;');
      crystal.setAttribute('animation', `property: rotation; from: 0 0 0; to: 360 360 360; dur: ${5000 + i * 500}; loop: true;`);
      scene.appendChild(crystal);
    }

    for (let ring = 1; ring <= 3; ring++) {
      const mandalaRing = document.createElement('a-torus');
      mandalaRing.setAttribute('position', '0 2 -5');
      mandalaRing.setAttribute('radius', `${ring * 1.5}`);
      mandalaRing.setAttribute('radius-tubular', '0.1');
      mandalaRing.setAttribute('segments-radial', '32');
      mandalaRing.setAttribute('segments-tubular', '32');
      mandalaRing.setAttribute('material', `color: #${['9370db', '7b68ee', 'dda0dd'][ring - 1]}; emissive: #${['7b68ee', '6a5acd', 'ba55d3'][ring - 1]}; emissiveIntensity: 0.5; opacity: 0.7; transparent: true;`);
      mandalaRing.setAttribute('rotation', `${ring * 20} ${ring * 15} ${ring * 10}`);
      mandalaRing.setAttribute('animation', `property: rotation; from: ${ring * 20} ${ring * 15} ${ring * 10}; to: ${ring * 20 + 360} ${ring * 15} ${ring * 10}; dur: ${8000 + ring * 2000}; loop: true;`);
      scene.appendChild(mandalaRing);
    }

    const cushion = document.createElement('a-cylinder');
    cushion.setAttribute('position', '0 0.2 -5');
    cushion.setAttribute('radius', '1.5');
    cushion.setAttribute('height', '0.4');
    cushion.setAttribute('material', 'color: #6a4c93; emissive: #5a3c83; emissiveIntensity: 0.3;');
    scene.appendChild(cushion);
  },

  setupAudio: function(volume) {
    const scene = this.el.sceneEl;

    const soundEntity = document.createElement('a-entity');
    soundEntity.setAttribute('sound', `src: url(./assets/audio/reiki-meditation.mp3); volume: ${volume}; loop: true; autoplay: true;`);
    soundEntity.setAttribute('position', '0 5 0');
    scene.appendChild(soundEntity);

    console.log('🎵 Meditation ambient audio initialized');
  },

  createEnergyField: function() {
    const scene = this.el.sceneEl;

    const particleContainer = document.createElement('a-entity');
    particleContainer.setAttribute('position', '0 2 -5');
    scene.appendChild(particleContainer);

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('a-sphere');
      const x = (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 15;

      particle.setAttribute('position', `${x} ${y} ${z}`);
      particle.setAttribute('radius', `${0.1 + Math.random() * 0.2}`);
      particle.setAttribute('material', `color: #${['9370db', 'dda0dd', 'ffd700'][Math.floor(Math.random() * 3)]}; emissive: #${['7b68ee', 'ba55d3', 'ffed4e'][Math.floor(Math.random() * 3)]}; emissiveIntensity: 0.8; transparent: true; opacity: 0.6;`);
      
      const duration = 8000 + Math.random() * 4000;
      const targetX = (Math.random() - 0.5) * 15;
      const targetY = (Math.random() - 0.5) * 10 + 3;
      const targetZ = (Math.random() - 0.5) * 15;

      particle.setAttribute('animation', `property: position; from: ${x} ${y} ${z}; to: ${targetX} ${targetY} ${targetZ}; dur: ${duration}; loop: true; dir: alternate;`);
      
      particleContainer.appendChild(particle);
    }
  },

  tick: function() {
    // Real-time updates or physics
  }
});
