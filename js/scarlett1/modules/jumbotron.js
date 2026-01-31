AFRAME.registerComponent("scarlett-jumbotron", {
  init() {
    // HLS test stream (Big Buck Bunny)
    const src = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;

    // Many Quest builds can play HLS directly; if not, it will just stay dark.
    video.src = src;

    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    const mesh = this.el.getObject3D("mesh");
    if (!mesh) {
      // Wait for plane mesh to exist
      this.el.addEventListener("object3dset", () => this.apply(tex, video));
      return;
    }
    this.apply(tex, video);
  },

  apply(tex, video) {
    const mesh = this.el.getObject3D("mesh");
    if (!mesh) return;

    mesh.material = new THREE.MeshBasicMaterial({ map: tex });
    video.play().then(() => {
      hudLog("Jumbotron video ✅");
    }).catch(() => {
      hudLog("Jumbotron play blocked (tap screen once) ⚠️");
    });
  }
});
