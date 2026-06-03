/**
 * Smoker Specialty Shop VR Component
 * Premium smoking accessories, cigars, and loungewear retail experience
 * 
 * Usage:
 * <a-entity smoker-storefront="enabled: true"></a-entity>
 */

AFRAME.registerComponent('smoker-storefront', {
  schema: {
    enabled: { type: 'boolean', default: true }
  },

  init: function() {
    const scene = this.el.sceneEl;

    // Environment
    this.createEnvironment();
    
    // Lighting with moody ambiance
    this.setupLighting();
    
    // Storefront structure
    this.createStorefront();
    
    // Product displays
    this.createProductDisplays();
    
    // Lounge area
    this.createLoungeArea();
    
    // Background
    this.createBackground();

    console.log('🚬 Smoker Storefront loaded');
  },

  createEnvironment: function() {
    const scene = this.el.sceneEl;

    // Urban environment
    const sky = document.createElement('a-sky');
    sky.setAttribute('color', '#2c2c2c');
    scene.appendChild(sky);

    // Urban ground
    const ground = document.createElement('a-plane');
    ground.setAttribute('position', '0 0 0');
    ground.setAttribute('rotation', '-90 0 0');
    ground.setAttribute('width', '100');
    ground.setAttribute('height', '100');
    ground.setAttribute('color', '#3a3a3a');
    ground.setAttribute('material', 'emissive: #1a1a1a; emissiveIntensity: 0.3;');
    scene.appendChild(ground);
  },

  setupLighting: function() {
    const scene = this.el.sceneEl;

    // Main warm light
    const mainLight = document.createElement('a-light');
    mainLight.setAttribute('type', 'point');
    mainLight.setAttribute('position', '5 10 5');
    mainLight.setAttribute('intensity', '0.8');
    mainLight.setAttribute('color', '#ffaa66');
    scene.appendChild(mainLight);

    // Ambient warm lighting
    const ambient = document.createElement('a-light');
    ambient.setAttribute('type', 'ambient');
    ambient.setAttribute('intensity', '0.5');
    ambient.setAttribute('color', '#ff9944');
    scene.appendChild(ambient);

    // Accent lights
    const accentLight = document.createElement('a-light');
    accentLight.setAttribute('type', 'point');
    accentLight.setAttribute('position', '-5 8 -5');
    accentLight.setAttribute('intensity', '0.4');
    accentLight.setAttribute('color', '#aa6655');
    scene.appendChild(accentLight);
  },

  createStorefront: function() {
    const scene = this.el.sceneEl;

    // Main storefront building (brick style)
    const building = document.createElement('a-box');
    building.setAttribute('position', '0 3 -10');
    building.setAttribute('width', '14');
    building.setAttribute('height', '7');
    building.setAttribute('depth', '6');
    building.setAttribute('color', '#8B4513');
    building.setAttribute('material', 'emissive: #663300; emissiveIntensity: 0.2;');
    scene.appendChild(building);

    // Storefront roof (dark wood)
    const roof = document.createElement('a-box');
    roof.setAttribute('position', '0 7 -10');
    roof.setAttribute('width', '15');
    roof.setAttribute('height', '1.5');
    roof.setAttribute('depth', '7');
    roof.setAttribute('color', '#2c1810');
    scene.appendChild(roof);

    // Front window 1 (dark tinted)
    const window1 = document.createElement('a-plane');
    window1.setAttribute('position', '-4 3.5 -3.9');
    window1.setAttribute('width', '3');
    window1.setAttribute('height', '5');
    window1.setAttribute('material', 'color: #1a1a1a; opacity: 0.6; transparent: true; emissive: #443322; emissiveIntensity: 0.3;');
    scene.appendChild(window1);

    const window2 = document.createElement('a-plane');
    window2.setAttribute('position', '0 3.5 -3.9');
    window2.setAttribute('width', '3');
    window2.setAttribute('height', '5');
    window2.setAttribute('material', 'color: #1a1a1a; opacity: 0.6; transparent: true; emissive: #443322; emissiveIntensity: 0.3;');
    scene.appendChild(window2);

    const window3 = document.createElement('a-plane');
    window3.setAttribute('position', '4 3.5 -3.9');
    window3.setAttribute('width', '3');
    window3.setAttribute('height', '5');
    window3.setAttribute('material', 'color: #1a1a1a; opacity: 0.6; transparent: true; emissive: #443322; emissiveIntensity: 0.3;');
    scene.appendChild(window3);

    // Entrance door (elegant wood)
    const door = document.createElement('a-box');
    door.setAttribute('position', '0 1.5 -3.95');
    door.setAttribute('width', '1.5');
    door.setAttribute('height', '3');
    door.setAttribute('depth', '0.1');
    door.setAttribute('color', '#3d2817');
    scene.appendChild(door);

    const doorHandle = document.createElement('a-sphere');
    doorHandle.setAttribute('position', '0.6 1.5 -3.94');
    doorHandle.setAttribute('radius', '0.15');
    doorHandle.setAttribute('color', '#FFD700');
    scene.appendChild(doorHandle);

    // Store sign (elegant)
    const sign = document.createElement('a-box');
    sign.setAttribute('position', '0 7.5 -10');
    sign.setAttribute('width', '6');
    sign.setAttribute('height', '1.5');
    sign.setAttribute('depth', '0.4');
    sign.setAttribute('color', '#2c1810');
    scene.appendChild(sign);

    const signText = document.createElement('a-text');
    signText.setAttribute('position', '0 7.5 -9.8');
    signText.setAttribute('value', '🚬 SMOKER\'S LOUNGE 🚬');
    signText.setAttribute('align', 'center');
    signText.setAttribute('anchor', 'center');
    signText.setAttribute('scale', '1.8 1.8 1.8');
    signText.setAttribute('color', '#FFD700');
    scene.appendChild(signText);

    const tagline = document.createElement('a-text');
    tagline.setAttribute('position', '0 6.8 -9.8');
    tagline.setAttribute('value', 'Premium Tobacco & Accessories');
    tagline.setAttribute('align', 'center');
    tagline.setAttribute('anchor', 'center');
    tagline.setAttribute('scale', '0.6 0.6 0.6');
    tagline.setAttribute('color', '#ccaa77');
    scene.appendChild(tagline);
  },

  createProductDisplays: function() {
    const scene = this.el.sceneEl;

    // Premium Cigars
    this.createDisplay(scene, -5, 2.5, -5, '🔘 PREMIUM CIGARS', '#c49a5c', '$50-300');
    
    // Tobacco
    this.createDisplay(scene, 0, 2.5, -5, '🚬 TOBACCO', '#8B4513', '$20-100');
    
    // Pipes
    this.createDisplay(scene, 5, 2.5, -5, '🫖 PIPES', '#d4a574', '$30-200');
    
    // Lighters
    this.createDisplay(scene, -5, 2.5, 0, '🔥 LIGHTERS', '#FFD700', '$15-150');
    
    // Humidors
    this.createDisplay(scene, 0, 2.5, 0, '📦 HUMIDORS', '#8B4513', '$80-500');
    
    // Loungewear
    this.createDisplay(scene, 5, 2.5, 0, '👔 LOUNGEWEAR', '#444444', '$40-200');
  },

  createDisplay: function(scene, x, y, z, label, color, priceRange) {
    // Display case (glass-like)
    const caseBack = document.createElement('a-box');
    caseBack.setAttribute('position', `${x} ${y} ${z}`);
    caseBack.setAttribute('width', '1.8');
    caseBack.setAttribute('height', '2.5');
    caseBack.setAttribute('depth', '1.8');
    caseBack.setAttribute('color', color);
    caseBack.setAttribute('material', `emissive: ${color}; emissiveIntensity: 0.4; opacity: 0.8; transparent: true;`);
    scene.appendChild(caseBack);

    // Glass front
    const caseFront = document.createElement('a-plane');
    caseFront.setAttribute('position', `${x} ${y} ${z + 0.95}`);
    caseFront.setAttribute('width', '1.8');
    caseFront.setAttribute('height', '2.5');
    caseFront.setAttribute('material', 'color: #333; opacity: 0.3; transparent: true; emissive: #555; emissiveIntensity: 0.5;');
    scene.appendChild(caseFront);

    // Product sphere
    const product = document.createElement('a-sphere');
    product.setAttribute('position', `${x} ${y + 0.8} ${z}`);
    product.setAttribute('radius', '0.6');
    product.setAttribute('color', color);
    product.setAttribute('material', `emissive: ${color}; emissiveIntensity: 0.7; shininess: 80;`);
    product.setAttribute('animation', 'property: rotation; from: 0 0 0; to: 0 360 0; dur: 5000; loop: true;');
    scene.appendChild(product);

    // Label
    const labelText = document.createElement('a-text');
    labelText.setAttribute('position', `${x} ${y + 1.8} ${z + 1}`);
    labelText.setAttribute('value', label);
    labelText.setAttribute('align', 'center');
    labelText.setAttribute('anchor', 'center');
    labelText.setAttribute('scale', '0.8 0.8 0.8');
    labelText.setAttribute('color', '#fff');
    scene.appendChild(labelText);

    // Price range
    const priceText = document.createElement('a-text');
    priceText.setAttribute('position', `${x} ${y - 0.5} ${z + 1}`);
    priceText.setAttribute('value', priceRange);
    priceText.setAttribute('align', 'center');
    priceText.setAttribute('anchor', 'center');
    priceText.setAttribute('scale', '0.6 0.6 0.6');
    priceText.setAttribute('color', '#FFD700');
    scene.appendChild(priceText);

    // Buy button
    this.createBuyButton(scene, x, y - 1.3, z, label);
  },

  createBuyButton: function(scene, x, y, z, productName) {
    const button = document.createElement('a-box');
    button.setAttribute('position', `${x} ${y} ${z}`);
    button.setAttribute('width', '1');
    button.setAttribute('height', '0.5');
    button.setAttribute('depth', '0.2');
    button.setAttribute('color', '#8B4513');
    button.setAttribute('material', 'emissive: #cc6600; emissiveIntensity: 0.6;');
    button.setAttribute('class', 'buy-button');
    button.setAttribute('data-product', productName);

    const buttonText = document.createElement('a-text');
    buttonText.setAttribute('position', '0 0 0.15');
    buttonText.setAttribute('value', 'ADD TO CART');
    buttonText.setAttribute('align', 'center');
    buttonText.setAttribute('anchor', 'center');
    buttonText.setAttribute('scale', '0.5 0.5 0.5');
    buttonText.setAttribute('color', '#fff');
    button.appendChild(buttonText);

    button.addEventListener('click', () => {
      this.handlePurchase(productName);
    });

    scene.appendChild(button);
  },

  createLoungeArea: function() {
    const scene = this.el.sceneEl;

    // Lounge seating area sign
    const loungeSign = document.createElement('a-text');
    loungeSign.setAttribute('position', '0 6 5');
    loungeSign.setAttribute('value', '🪑 Lounge Seating Area 🪑');
    loungeSign.setAttribute('align', 'center');
    loungeSign.setAttribute('anchor', 'center');
    loungeSign.setAttribute('scale', '1.5 1.5 1.5');
    loungeSign.setAttribute('color', '#FFD700');
    scene.appendChild(loungeSign);

    // Lounge chairs
    for (let i = 0; i < 3; i++) {
      const chair = document.createElement('a-box');
      chair.setAttribute('position', `${-3 + i * 3} 1 3`);
      chair.setAttribute('width', '1.2');
      chair.setAttribute('height', '1.5');
      chair.setAttribute('depth', '1.2');
      chair.setAttribute('color', '#333');
      scene.appendChild(chair);
    }

    // Coffee table
    const table = document.createElement('a-box');
    table.setAttribute('position', '0 0.8 2');
    table.setAttribute('width', '3');
    table.setAttribute('height', '0.3');
    table.setAttribute('depth', '1.5');
    table.setAttribute('color', '#8B4513');
    scene.appendChild(table);
  },

  createBackground: function() {
    const scene = this.el.sceneEl;

    // Urban backdrop
    const backdrop = document.createElement('a-plane');
    backdrop.setAttribute('position', '0 5 -30');
    backdrop.setAttribute('width', '100');
    backdrop.setAttribute('height', '20');
    backdrop.setAttribute('color', '#4a4a4a');
    backdrop.setAttribute('material', 'emissive: #2a2a2a; emissiveIntensity: 0.3;');
    scene.appendChild(backdrop);

    // Building silhouettes
    const building1 = document.createElement('a-box');
    building1.setAttribute('position', '-30 10 -25');
    building1.setAttribute('width', '15');
    building1.setAttribute('height', '20');
    building1.setAttribute('depth', '10');
    building1.setAttribute('color', '#222');
    scene.appendChild(building1);

    const building2 = document.createElement('a-box');
    building2.setAttribute('position', '30 8 -25');
    building2.setAttribute('width', '12');
    building2.setAttribute('height', '16');
    building2.setAttribute('depth', '10');
    building2.setAttribute('color', '#333');
    scene.appendChild(building2);

    // Night sky effect
    const sky = document.createElement('a-plane');
    sky.setAttribute('position', '0 15 -50');
    sky.setAttribute('width', '200');
    sky.setAttribute('height', '100');
    sky.setAttribute('color', '#1a1a2e');
    scene.appendChild(sky);
  },

  handlePurchase: function(productName) {
    alert(`🛒 Added to cart: ${productName}`);
    
    if (window.eventEmitter) {
      window.eventEmitter.emit('purchase:item', { product: productName, store: 'smoker' });
    }

    if (window.api) {
      window.api.post('/api/purchases/item', {
        product: productName,
        store: 'smoker-storefront',
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Purchase tracking error:', err));
    }
  }
});
