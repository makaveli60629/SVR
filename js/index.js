const SDK = {
    init() {
        this.rig = document.querySelector('#rig');
        this.startLoops();
        console.log("SPINE 5.6: QUAD-JUMBO READY");
    },
    startLoops() {
        setInterval(() => {
            const p = this.rig.getAttribute('position');
            document.getElementById('val-pos').innerText = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
            
            if(navigator.getGamepads()[0]) document.getElementById('val-input').innerText = "STICKS ACTIVE";
            
            // Handshake & Init
            if (window.scarlettModule && !window.__scarlettInitDone) {
                window.__scarlettInitDone = true;
                window.scarlettModule.init();
                document.getElementById('mod-load').innerText = "ACTIVE";
                document.getElementById('mod-load').style.color = "#00FF00";
            }

            // Texture Refresh Guard
            ['jumbo_NE', 'jumbo_NW', 'jumbo_SE', 'jumbo_SW'].forEach(id => this.safeNeedsUpdate(id));
        }, 100);
    },
    safeNeedsUpdate(elId) {
        const el = document.getElementById(elId);
        const obj = el && el.getObject3D && el.getObject3D('mesh');
        const mat = obj && obj.material;
        const m = Array.isArray(mat) ? mat[0] : mat;
        if (m && m.map) m.map.needsUpdate = true;
    },
    toggleWireframe() {
        const scene = document.querySelector('a-scene');
        scene.setAttribute('debug', scene.getAttribute('debug') ? '' : 'physics: true');
    }
};
window.onload = () => SDK.init();
