import * as THREE from 'three';
const SUITS = ['H','D','C','S'];
const RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14];

export function initDealer({ scene, Bus }) {
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.12,0.05,0.18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x111111, emissiveIntensity: 0.8 })
  );
  deck.position.set(0.9, 1.08, 0.5);
  scene.add(deck);

  function meta(){
    return { rank: RANKS[(Math.random()*RANKS.length)|0], suit: SUITS[(Math.random()*SUITS.length)|0] };
  }
  function deal(x,z){
    const m = meta();
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08,0.12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x111111, emissiveIntensity: 0.6, side: THREE.DoubleSide })
    );
    card.rotation.x = -Math.PI/2;
    card.position.set(x, 1.11, z);
    card.userData = { ...m, isCard:true };
    scene.add(card);
    Bus?.log?.(`DEALT: ${m.rank}${m.suit}`);
  }

  window.dealFlop = () => {
    Bus?.log?.('DEAL: FLOP');
    deal(-0.25, 0.0);
    deal(0.00, 0.0);
    deal(0.25, 0.0);
  };

  Bus?.log?.('DEALER ONLINE');
}
