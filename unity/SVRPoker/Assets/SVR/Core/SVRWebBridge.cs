using System.Runtime.InteropServices;
using UnityEngine;

namespace SVR
{
    public static class SVRWebBridge
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void SVRWebNotifyReady();

        [DllImport("__Internal")]
        private static extern void SVRWebNotifyProgress(int percent);
#endif

        public static void NotifyReady()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            SVRWebNotifyReady();
#endif
        }

        public static void NotifyProgress(int percent)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            SVRWebNotifyProgress(Mathf.Clamp(percent, 0, 100));
#endif
        }
    }
}
