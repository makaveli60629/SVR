const SpineEngine = {
    init() {
        this.posHUD = document.getElementById('pos-display');
        this.stickHUD = document.getElementById('stick-status');
        this.rig = document.querySelector('#rig');
        
        setInterval(() => {
            const p = this.rig.getAttribute('position');
            this.posHUD.innerText = `XYZ: ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
            
            const pads = navigator.getGamepads();
            if(pads[0] || pads[1]) {
                this.stickHUD.innerText = "STICKS: CONNECTED";
                this.stickHUD.style.color = "#00FFFF";
            }
        }, 100);
        console.log("SPINE: Online. Controller Active.");
    }
};
window.onload = () => SpineEngine.init();
