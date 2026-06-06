using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class SVRRepairWorldFeatures
{
    private static readonly List<string> Changes = new List<string>();
    private static readonly List<string> Warnings = new List<string>();

    [MenuItem("SVR/Repair/Repair Moon Mars Lounges Storefront")]
    public static void RepairWorldFeatures()
    {
        Changes.Clear();
        Warnings.Clear();

        string reportDir = Path.Combine(Directory.GetCurrentDirectory(), "SVRReports");
        Directory.CreateDirectory(reportDir);

        string[] sceneGuids = AssetDatabase.FindAssets("t:Scene", new[] { "Assets" });

        if (sceneGuids.Length == 0)
        {
            Warnings.Add("No Unity scenes found under Assets.");
            WriteReport(reportDir);
            return;
        }

        List<string> candidateScenes = new List<string>();

        foreach (string guid in sceneGuids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            string lower = path.ToLowerInvariant();

            if (
                lower.Contains("lobby") ||
                lower.Contains("hub") ||
                lower.Contains("main") ||
                lower.Contains("menu") ||
                lower.Contains("world")
            )
            {
                candidateScenes.Add(path);
            }
        }

        if (candidateScenes.Count == 0)
        {
            candidateScenes.Add(AssetDatabase.GUIDToAssetPath(sceneGuids[0]));
            Warnings.Add("No obvious lobby/hub scene found. Repaired first scene only: " + candidateScenes[0]);
        }

        foreach (string scenePath in candidateScenes)
        {
            try
            {
                Scene scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                RepairScene(scene);
                EditorSceneManager.SaveScene(scene);
            }
            catch (Exception ex)
            {
                Warnings.Add("Failed to repair scene " + scenePath + ": " + ex.Message);
            }
        }

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        WriteReport(reportDir);
        Debug.Log("[SVR] World feature repair complete. Report written to SVRReports/world_features_repair_report.json");
    }

    private static void RepairScene(Scene scene)
    {
        GameObject[] roots = scene.GetRootGameObjects();

        Transform player = FindByNameContains(roots, new[] {
            "player", "xr rig", "xrrig", "camera rig", "vr rig", "spawn", "playerstart", "player_start"
        });

        Transform mainBuilding = FindByNameContains(roots, new[] {
            "main building", "mainbuilding", "building", "lobby", "hub"
        });

        Transform portal = FindByNameContains(roots, new[] {
            "portal", "gateway", "warp", "teleporter"
        });

        Vector3 playerPos = player != null ? player.position : Vector3.zero;
        Vector3 buildingPos = mainBuilding != null ? mainBuilding.position : new Vector3(0f, 0f, 35f);

        Vector3 behindDirection = buildingPos - playerPos;

        if (behindDirection.sqrMagnitude < 1f)
        {
            behindDirection = Vector3.forward;
        }

        behindDirection.Normalize();

        Vector3 skyBase = buildingPos + behindDirection * 140f + Vector3.up * 85f;

        GameObject skyRoot = GetOrCreateRoot("SVR_SkyRoot");
        skyRoot.transform.position = buildingPos + Vector3.up * 65f;

        CreateOrRepairMoonMars(scene, skyRoot.transform, skyBase);
        CreateOrRepairPortalSideFeatures(scene, portal, playerPos);

        EditorSceneManager.MarkSceneDirty(scene);
    }

    private static void CreateOrRepairMoonMars(Scene scene, Transform skyRoot, Vector3 skyBase)
    {
        int skyLayer = LayerMask.NameToLayer("Sky");
        if (skyLayer < 0)
        {
            skyLayer = LayerMask.NameToLayer("Ignore Raycast");
            Warnings.Add(scene.path + ": No layer named Sky found. Using Ignore Raycast for Moon/Mars.");
        }

        GameObject moon = GetOrCreatePrimitiveSphere("SVR_Moon");
        moon.transform.SetParent(skyRoot, true);
        moon.transform.position = skyBase + new Vector3(-35f, 12f, 0f);
        moon.transform.localScale = new Vector3(18f, 18f, 18f);
        moon.layer = skyLayer >= 0 ? skyLayer : moon.layer;
        RemovePhysicalColliders(moon);
        AssignMaterial(moon, "SVR_Moon_Material", new Color(0.82f, 0.84f, 0.9f, 1f));

        SVRSkyOrbit moonOrbit = moon.GetComponent<SVRSkyOrbit>();
        if (moonOrbit == null) moonOrbit = moon.AddComponent<SVRSkyOrbit>();
        moonOrbit.pivot = skyRoot;
        moonOrbit.degreesPerSecond = 0.08f;
        moonOrbit.orbitAxis = Vector3.up;
        moonOrbit.rotateSelf = true;
        moonOrbit.selfRotationMultiplier = 2f;

        GameObject mars = GetOrCreatePrimitiveSphere("SVR_Mars");
        mars.transform.SetParent(skyRoot, true);
        mars.transform.position = skyBase + new Vector3(48f, 22f, 26f);
        mars.transform.localScale = new Vector3(11f, 11f, 11f);
        mars.layer = skyLayer >= 0 ? skyLayer : mars.layer;
        RemovePhysicalColliders(mars);
        AssignMaterial(mars, "SVR_Mars_Material", new Color(0.85f, 0.28f, 0.16f, 1f));

        SVRSkyOrbit marsOrbit = mars.GetComponent<SVRSkyOrbit>();
        if (marsOrbit == null) marsOrbit = mars.AddComponent<SVRSkyOrbit>();
        marsOrbit.pivot = skyRoot;
        marsOrbit.degreesPerSecond = 0.05f;
        marsOrbit.orbitAxis = Vector3.up;
        marsOrbit.rotateSelf = true;
        marsOrbit.selfRotationMultiplier = 3f;

        Changes.Add(scene.path + ": Repaired Moon at " + Vec(moon.transform.position));
        Changes.Add(scene.path + ": Repaired Mars at " + Vec(mars.transform.position));
        Changes.Add(scene.path + ": Moon/Mars colliders removed and slow sky orbit configured.");
    }

    private static void CreateOrRepairPortalSideFeatures(Scene scene, Transform portal, Vector3 playerPos)
    {
        Vector3 portalPos = portal != null ? portal.position : new Vector3(18f, 0f, 32f);

        if (portal == null)
        {
            Warnings.Add(scene.path + ": No portal found by name. Created portal-side features at fallback position " + Vec(portalPos));
        }

        GameObject root = GetOrCreateRoot("SVR_PortalSideFeatures");
        root.transform.position = portalPos;

        Vector3 awayFromPlayer = portalPos - playerPos;
        if (awayFromPlayer.sqrMagnitude < 1f) awayFromPlayer = Vector3.forward;
        awayFromPlayer.Normalize();

        Vector3 right = Vector3.Cross(Vector3.up, awayFromPlayer).normalized;
        if (right.sqrMagnitude < 0.1f) right = Vector3.right;

        Vector3 loungeA = portalPos + right * 10f + awayFromPlayer * 7f;
        Vector3 loungeB = portalPos + right * 22f + awayFromPlayer * 7f;
        Vector3 storefront = portalPos + right * 16f + awayFromPlayer * 18f;

        CreateLounge(scene, root.transform, "SVR_NewLounge_A", loungeA, new Color(0.12f, 0.20f, 0.38f, 1f));
        CreateLounge(scene, root.transform, "SVR_NewLounge_B", loungeB, new Color(0.20f, 0.12f, 0.35f, 1f));
        CreateStorefront(scene, root.transform, "SVR_Storefront_NextToPortal", storefront);

        GameObject clearPath = GetOrCreateRoot("SVR_Portal_ClearPath_DoNotBlock");
        clearPath.transform.position = portalPos + awayFromPlayer * 3f;
        clearPath.transform.localScale = new Vector3(7f, 0.15f, 7f);
        AssignMaterial(clearPath, "SVR_ClearPath_Material", new Color(0f, 0.8f, 1f, 0.22f));

        Changes.Add(scene.path + ": Repaired portal-side lounges/storefront near portal at " + Vec(portalPos));
        Changes.Add(scene.path + ": Added clear path marker so portal access stays open.");
    }

    private static void CreateLounge(Scene scene, Transform parent, string name, Vector3 position, Color color)
    {
        GameObject lounge = GetOrCreateRoot(name);
        lounge.transform.SetParent(parent, true);
        lounge.transform.position = position;

        GameObject floor = GetOrCreateChildCube(lounge.transform, "Floor");
        floor.transform.localPosition = Vector3.zero;
        floor.transform.localScale = new Vector3(8f, 0.25f, 6f);
        AssignMaterial(floor, name + "_Floor_Material", color);

        GameObject backWall = GetOrCreateChildCube(lounge.transform, "BackWall");
        backWall.transform.localPosition = new Vector3(0f, 1.8f, 3f);
        backWall.transform.localScale = new Vector3(8f, 3.5f, 0.25f);
        AssignMaterial(backWall, name + "_Wall_Material", color * 0.8f);

        GameObject leftSeat = GetOrCreateChildCube(lounge.transform, "LeftSeat");
        leftSeat.transform.localPosition = new Vector3(-2.2f, 0.55f, 0.6f);
        leftSeat.transform.localScale = new Vector3(2.5f, 0.8f, 1.4f);
        AssignMaterial(leftSeat, name + "_Seat_Material", new Color(0.08f, 0.08f, 0.1f, 1f));

        GameObject rightSeat = GetOrCreateChildCube(lounge.transform, "RightSeat");
        rightSeat.transform.localPosition = new Vector3(2.2f, 0.55f, 0.6f);
        rightSeat.transform.localScale = new Vector3(2.5f, 0.8f, 1.4f);
        AssignMaterial(rightSeat, name + "_Seat_Material", new Color(0.08f, 0.08f, 0.1f, 1f));

        GameObject anchor = GetOrCreateChildEmpty(lounge.transform, "SVR_Lounge_PlayerAnchor");
        anchor.transform.localPosition = new Vector3(0f, 1f, -1.8f);

        Changes.Add(scene.path + ": Created/updated lounge " + name + " at " + Vec(position));
    }

    private static void CreateStorefront(Scene scene, Transform parent, string name, Vector3 position)
    {
        GameObject store = GetOrCreateRoot(name);
        store.transform.SetParent(parent, true);
        store.transform.position = position;

        GameObject baseObj = GetOrCreateChildCube(store.transform, "StorefrontBase");
        baseObj.transform.localPosition = Vector3.zero;
        baseObj.transform.localScale = new Vector3(10f, 0.3f, 6f);
        AssignMaterial(baseObj, "SVR_Storefront_Base_Material", new Color(0.16f, 0.16f, 0.18f, 1f));

        GameObject counter = GetOrCreateChildCube(store.transform, "Counter");
        counter.transform.localPosition = new Vector3(0f, 0.9f, -1.6f);
        counter.transform.localScale = new Vector3(7f, 1.2f, 0.8f);
        AssignMaterial(counter, "SVR_Storefront_Counter_Material", new Color(0.7f, 0.45f, 0.2f, 1f));

        GameObject sign = GetOrCreateChildCube(store.transform, "SignPlaceholder");
        sign.transform.localPosition = new Vector3(0f, 3.1f, 2.8f);
        sign.transform.localScale = new Vector3(8f, 1.1f, 0.25f);
        AssignMaterial(sign, "SVR_Storefront_Sign_Material", new Color(0.0f, 0.55f, 0.95f, 1f));

        GameObject displayLeft = GetOrCreateChildCube(store.transform, "Display_Left");
        displayLeft.transform.localPosition = new Vector3(-3f, 1f, 1.2f);
        displayLeft.transform.localScale = new Vector3(1.2f, 1.8f, 1.2f);
        AssignMaterial(displayLeft, "SVR_Storefront_Display_Material", new Color(0.12f, 0.8f, 0.9f, 1f));

        GameObject displayRight = GetOrCreateChildCube(store.transform, "Display_Right");
        displayRight.transform.localPosition = new Vector3(3f, 1f, 1.2f);
        displayRight.transform.localScale = new Vector3(1.2f, 1.8f, 1.2f);
        AssignMaterial(displayRight, "SVR_Storefront_Display_Material", new Color(0.12f, 0.8f, 0.9f, 1f));

        GameObject anchor = GetOrCreateChildEmpty(store.transform, "SVR_Storefront_InteractionAnchor");
        anchor.transform.localPosition = new Vector3(0f, 1f, -3.5f);

        Changes.Add(scene.path + ": Created/updated storefront next to portal at " + Vec(position));
    }

    private static Transform FindByNameContains(GameObject[] roots, string[] keys)
    {
        foreach (GameObject root in roots)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);

            foreach (Transform t in transforms)
            {
                string n = t.name.ToLowerInvariant();

                foreach (string key in keys)
                {
                    if (n.Contains(key.ToLowerInvariant()))
                    {
                        return t;
                    }
                }
            }
        }

        return null;
    }

    private static GameObject GetOrCreateRoot(string name)
    {
        GameObject existing = GameObject.Find(name);
        if (existing != null)
        {
            existing.SetActive(true);
            return existing;
        }

        GameObject created = new GameObject(name);
        return created;
    }

    private static GameObject GetOrCreatePrimitiveSphere(string name)
    {
        GameObject existing = GameObject.Find(name);
        if (existing != null)
        {
            existing.SetActive(true);
            return existing;
        }

        GameObject created = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        created.name = name;
        return created;
    }

    private static GameObject GetOrCreateChildCube(Transform parent, string name)
    {
        Transform existing = parent.Find(name);
        if (existing != null)
        {
            existing.gameObject.SetActive(true);
            return existing.gameObject;
        }

        GameObject created = GameObject.CreatePrimitive(PrimitiveType.Cube);
        created.name = name;
        created.transform.SetParent(parent, false);
        return created;
    }

    private static GameObject GetOrCreateChildEmpty(Transform parent, string name)
    {
        Transform existing = parent.Find(name);
        if (existing != null)
        {
            existing.gameObject.SetActive(true);
            return existing.gameObject;
        }

        GameObject created = new GameObject(name);
        created.transform.SetParent(parent, false);
        return created;
    }

    private static void RemovePhysicalColliders(GameObject obj)
    {
        Collider[] colliders = obj.GetComponentsInChildren<Collider>(true);
        foreach (Collider col in colliders)
        {
            UnityEngine.Object.DestroyImmediate(col);
        }
    }

    private static void AssignMaterial(GameObject obj, string materialName, Color color)
    {
        Renderer renderer = obj.GetComponent<Renderer>();
        if (renderer == null) renderer = obj.GetComponentInChildren<Renderer>();

        if (renderer == null) return;

        string matDir = "Assets/SVR/Materials";
        if (!AssetDatabase.IsValidFolder("Assets/SVR"))
        {
            AssetDatabase.CreateFolder("Assets", "SVR");
        }

        if (!AssetDatabase.IsValidFolder(matDir))
        {
            AssetDatabase.CreateFolder("Assets/SVR", "Materials");
        }

        string matPath = matDir + "/" + materialName + ".mat";
        Material mat = AssetDatabase.LoadAssetAtPath<Material>(matPath);

        if (mat == null)
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            if (shader == null) shader = Shader.Find("Sprites/Default");

            mat = new Material(shader);
            AssetDatabase.CreateAsset(mat, matPath);
        }

        mat.color = color;
        renderer.sharedMaterial = mat;
    }

    private static string Vec(Vector3 v)
    {
        return "(" + v.x.ToString("0.00") + ", " + v.y.ToString("0.00") + ", " + v.z.ToString("0.00") + ")";
    }

    private static void WriteReport(string reportDir)
    {
        string reportPath = Path.Combine(reportDir, "world_features_repair_report.json");

        StringBuilder sb = new StringBuilder();
        sb.AppendLine("{");
        sb.AppendLine("  \"tool\": \"SVRRepairWorldFeatures\",");
        sb.AppendLine("  \"generatedAt\": \"" + Escape(DateTime.Now.ToString("s")) + "\",");
        sb.AppendLine("  \"changes\": [");

        for (int i = 0; i < Changes.Count; i++)
        {
            sb.Append("    \"").Append(Escape(Changes[i])).Append("\"");
            if (i < Changes.Count - 1) sb.Append(",");
            sb.AppendLine();
        }

        sb.AppendLine("  ],");
        sb.AppendLine("  \"warnings\": [");

        for (int i = 0; i < Warnings.Count; i++)
        {
            sb.Append("    \"").Append(Escape(Warnings[i])).Append("\"");
            if (i < Warnings.Count - 1) sb.Append(",");
            sb.AppendLine();
        }

        sb.AppendLine("  ]");
        sb.AppendLine("}");

        File.WriteAllText(reportPath, sb.ToString());
    }

    private static string Escape(string value)
    {
        return value
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\r", "")
            .Replace("\n", "\\n");
    }
}
