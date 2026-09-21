mergeInto(LibraryManager.library, {
  SVRWebNotifyReady: function () {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('svr:unity-ready', {
      detail: { source: 'unity', version: 'phase465' }
    }));
  },

  SVRWebNotifyProgress: function (percent) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('svr:unity-progress', {
      detail: { percent: percent, source: 'unity' }
    }));
  }
});
