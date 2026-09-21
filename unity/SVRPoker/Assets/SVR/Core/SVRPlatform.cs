using UnityEngine;

namespace SVR
{
    public enum SVRTarget
    {
        Editor,
        Web,
        Android,
        QuestPrototype,
        Other
    }

    public static class SVRPlatform
    {
        public static SVRTarget Current
        {
            get
            {
#if UNITY_EDITOR
                return SVRTarget.Editor;
#elif UNITY_WEBGL
                return SVRTarget.Web;
#elif UNITY_ANDROID
                return SVRTarget.Android;
#else
                return SVRTarget.Other;
#endif
            }
        }

        public static bool IsWeb => Current == SVRTarget.Web;
        public static bool IsAndroidFamily => Current == SVRTarget.Android || Current == SVRTarget.QuestPrototype;

        public static int RecommendedTargetFrameRate
        {
            get
            {
                if (Current == SVRTarget.Web && Application.isMobilePlatform) return 60;
                if (Current == SVRTarget.Android) return 72;
                return 60;
            }
        }
    }
}
