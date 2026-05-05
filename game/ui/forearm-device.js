AFRAME.registerComponent('watch-ui', {
  init: function () {
    const el = document.createElement('a-entity');
    el.setAttribute('id', 'watch-ui');
    el.setAttribute('text', {
      value: 'Loading...',
      color: '#00ffcc',
      align: 'center',
      width: 2
    });

    el.setAttribute('position', '0 0 -1');
    this.el.appendChild(el);
  }
});
