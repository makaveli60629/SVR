AFRAME.registerComponent('vr-hands', {

    init: function () {
        const scene = this.el
        const left = document.createElement('a-entity')
        left.setAttribute('hand-controls', 'left')
        scene.appendChild(left)
        const right = document.createElement('a-entity')
        right.setAttribute('hand-controls', 'right')
        scene.appendChild(right)
    }

})
