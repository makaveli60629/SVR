using UnityEngine;

namespace SVR
{
    public sealed class SVRBootstrap : MonoBehaviour
    {
        private static bool _installed;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Install()
        {
            if (_installed) return;
            _installed = true;

            Application.targetFrameRate = SVRPlatform.RecommendedTargetFrameRate;
            QualitySettings.vSyncCount = 0;

            var root = new GameObject("SVR_RUNTIME_ROOT");
            DontDestroyOnLoad(root);
            root.AddComponent<SVRBootstrap>();

            BuildFoundationScene();
            SVRWebBridge.NotifyProgress(100);
            SVRWebBridge.NotifyReady();

            Debug.Log($"[SVR] Unity foundation ready on {SVRPlatform.Current}");
        }

        private static void BuildFoundationScene()
        {
            if (Camera.main == null)
            {
                var cameraObject = new GameObject("SVR_MainCamera");
                cameraObject.tag = "MainCamera";
                var camera = cameraObject.AddComponent<Camera>();
                camera.clearFlags = CameraClearFlags.SolidColor;
                camera.backgroundColor = new Color(0.01f, 0.005f, 0.02f);
                camera.transform.position = new Vector3(0f, 2.25f, -4.6f);
                camera.transform.rotation = Quaternion.Euler(12f, 0f, 0f);
            }

            if (Object.FindFirstObjectByType<Light>() == null)
            {
                var key = new GameObject("SVR_KeyLight").AddComponent<Light>();
                key.type = LightType.Directional;
                key.intensity = 1.3f;
                key.transform.rotation = Quaternion.Euler(45f, -25f, 0f);

                var fill = new GameObject("SVR_TableFill").AddComponent<Light>();
                fill.type = LightType.Point;
                fill.intensity = 4.0f;
                fill.range = 9f;
                fill.transform.position = new Vector3(0f, 3.2f, 0f);
            }

            if (GameObject.Find("SVR_FOUNDATION_TABLE") == null)
            {
                var floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
                floor.name = "SVR_FLOOR";
                floor.transform.localScale = new Vector3(3.2f, 1f, 3.2f);

                var table = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                table.name = "SVR_FOUNDATION_TABLE";
                table.transform.position = new Vector3(0f, 0.85f, 0f);
                table.transform.localScale = new Vector3(2.25f, 0.12f, 1.35f);

                var material = new Material(Shader.Find("Standard"));
                material.color = new Color(0.045f, 0.23f, 0.13f);
                table.GetComponent<Renderer>().material = material;

                var labelObject = new GameObject("SVR_PHASE_LABEL");
                labelObject.transform.position = new Vector3(0f, 1.55f, 0.25f);
                labelObject.transform.rotation = Quaternion.Euler(0f, 180f, 0f);
                var label = labelObject.AddComponent<TextMesh>();
                label.text = "SVR POKER\nUNITY FOUNDATION";
                label.anchor = TextAnchor.MiddleCenter;
                label.alignment = TextAlignment.Center;
                label.fontSize = 72;
                label.characterSize = 0.025f;
                label.color = Color.white;
            }
        }
    }
}
