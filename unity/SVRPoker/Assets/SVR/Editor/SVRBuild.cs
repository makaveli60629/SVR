#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace SVR.Editor
{
    public static class SVRBuild
    {
        private const string ScenePath = "Assets/SVR/Scenes/SVRBootstrap.unity";
        private const string PackageId = "com.svrpoker.game";

        [MenuItem("SVR/Build/Web")]
        public static void BuildWeb()
        {
            ConfigureCommon();
            EnsureBootstrapScene();

            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
            PlayerSettings.WebGL.dataCaching = true;

            var output = GetOutputPath("Web");
            Directory.CreateDirectory(output);

            Build(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                target = BuildTarget.WebGL,
                locationPathName = output,
                options = BuildOptions.None
            });
        }

        [MenuItem("SVR/Build/Android")]
        public static void BuildAndroid()
        {
            ConfigureCommon();
            EnsureBootstrapScene();

            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, PackageId);
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.LandscapeLeft;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel29;

            var output = GetOutputPath("Android");
            Directory.CreateDirectory(output);
            var apk = Path.Combine(output, "SVRPoker.apk");

            Build(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                target = BuildTarget.Android,
                locationPathName = apk,
                options = BuildOptions.CompressWithLz4HC
            });
        }

        // Phase 465 is a clean Android/Quest foundation. OpenXR/Meta XR activation
        // is intentionally deferred until the first interactive Unity Editor pass,
        // where XR settings assets can be generated and verified safely.
        [MenuItem("SVR/Build/Quest Prototype")]
        public static void BuildQuestPrototype()
        {
            BuildAndroid();
        }

        public static void BuildWebCloud()
        {
            BuildWeb();
        }

        public static void BuildAndroidCloud()
        {
            BuildAndroid();
        }

        private static void ConfigureCommon()
        {
            PlayerSettings.companyName = "SVR Poker";
            PlayerSettings.productName = "SVR Poker";
            PlayerSettings.runInBackground = true;
        }

        private static void EnsureBootstrapScene()
        {
            var directory = Path.GetDirectoryName(ScenePath);
            if (!string.IsNullOrEmpty(directory))
                Directory.CreateDirectory(directory);

            if (File.Exists(ScenePath))
                return;

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "SVRBootstrap";
            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.Refresh();
        }

        private static string GetOutputPath(string platform)
        {
            var cloudOutput = Environment.GetEnvironmentVariable("OUTPUT_DIRECTORY");
            if (!string.IsNullOrWhiteSpace(cloudOutput))
                return Path.Combine(cloudOutput, platform);

            return Path.GetFullPath(Path.Combine("Builds", platform));
        }

        private static void Build(BuildPlayerOptions options)
        {
            var report = BuildPipeline.BuildPlayer(options);
            var result = report.summary.result;
            Debug.Log($"[SVR BUILD] {options.target} => {result} ({report.summary.totalSize} bytes)");

            if (result != UnityEditor.Build.Reporting.BuildResult.Succeeded)
                throw new Exception($"SVR build failed: {result}");
        }
    }
}
#endif
