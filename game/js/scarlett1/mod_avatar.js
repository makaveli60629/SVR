(function(){
  'use strict';
  const MODULE = 'mod_avatar';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    localAvatar: null,
    remoteAvatars: {},
    init(){
      window.addEventListener('svr_user_authenticated', e => this.createLocalAvatar(e.detail?.user_id || 'guest'));
      window.addEventListener('svr_commerce_success', e => this.equipCosmeticItem(e.detail?.userId, e.detail?.slot, e.detail?.asset_path));
      window.addEventListener('svr_network_player_update', e => this.syncRemoteAvatar(e.detail));
      console.info('[SVR]', MODULE, 'ready');
    },
    createLocalAvatar(userId){
      if (!window.THREE) return;
      this.localAvatar = new THREE.Group(); this.localAvatar.name = `avatar_${userId}`;
      const head = new THREE.Mesh(new THREE.ConeGeometry(.12,.3,6), new THREE.MeshStandardMaterial({ color:0x2d1442, roughness:.5 }));
      head.name = 'head_mesh'; this.localAvatar.add(head);
      window.dispatchEvent(new CustomEvent('svr_local_avatar_ready', { detail: { userId, avatar: this.localAvatar } }));
    },
    syncRemoteAvatar(packet){
      if (!window.THREE || !packet?.userId) return;
      let avatar = this.remoteAvatars[packet.userId];
      if (!avatar){
        avatar = new THREE.Group();
        const head = new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2), new THREE.MeshStandardMaterial({ color:0x1c1a21 })); head.name = 'head_mesh'; avatar.add(head);
        const left = new THREE.Mesh(new THREE.SphereGeometry(.05,6,6), new THREE.MeshStandardMaterial({ color:0x00ffcc, wireframe:true })); left.name = 'left_hand_mesh'; avatar.add(left);
        const right = left.clone(); right.name = 'right_hand_mesh'; avatar.add(right);
        this.remoteAvatars[packet.userId] = avatar; window.dispatchEvent(new CustomEvent('svr_add_mesh_to_scene', { detail: { mesh: avatar } }));
      }
      if (packet.headPos) avatar.getObjectByName('head_mesh')?.position.copy(packet.headPos);
      if (packet.leftHandPos) avatar.getObjectByName('left_hand_mesh')?.position.copy(packet.leftHandPos);
      if (packet.rightHandPos) avatar.getObjectByName('right_hand_mesh')?.position.copy(packet.rightHandPos);
    },
    equipCosmeticItem(userId, slot, assetPath){ if (userId && slot && assetPath) window.dispatchEvent(new CustomEvent('svr_avatar_cosmetic_requested', { detail: { userId, slot, assetPath } })); }
  };
  root.modules[MODULE] = api;
  window.SVRAvatarModule = api;
  api.init();
})();
