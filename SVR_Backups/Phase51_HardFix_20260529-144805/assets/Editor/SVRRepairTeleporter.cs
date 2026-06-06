using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class SVRRepairTeleporter
{
    private static readonly List<string> Changes = new List<string>();
    private static readonly List<string> Warnings = new List<string>();

    [MenuItem("SVR/Repair/Repair Teleporter")]
    public static void RepairTeleporter()
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

        foreach (string guid in sceneGuids)
        {
            string scenePath = AssetDatabase.GUIDToAssetPath(guid);

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

        Debug.Log("[SVR] Teleporter repair complete. Report written to SVRReports/teleporter_repair_report.json");
    }

    private static void RepairScene(Scene scene)
    {
        GameObject[] roots = scene.GetRootGameObjects();

        List<GameObject> teleporters = new List<GameObject>();
        List<GameObject> destinations = new List<GameObject>();
        List<GameObject> spawnAnchors = new List<GameObject>();

        foreach (GameObject root in roots)
        {
            Transform[] allTransforms = root.GetComponentsInChildren<Transform>(true);

            foreach (Transform t in allTransforms)
            {
                string n = t.name.ToLowerInvariant();

                if (n.Contains("teleporter") || n.Contains("teleport"))
                {
                    teleporters.Add(t.gameObject);
                }

                if (
                    n.Contains("teleportdestination") ||
                    n.Contains("teleport_destination") ||
                    n.Contains("destination") ||
                    n.Contains("tp_destination")
                )
                {
                    destinations.Add(t.gameObject);
                }

                if (
                    n.Contains("spawn") ||
                    n.Contains("playerstart") ||
                    n.Contains("player_start") ||
                    n.Contains("anchor")
                )
                {
                    spawnAnchors.Add(t.gameObject);
                }
            }
        }

        if (teleporters.Count == 0)
        {
            Warnings.Add(scene.path + ": No teleporter objects found by name.");
        }

        foreach (GameObject teleporter in teleporters)
        {
            if (!teleporter.activeSelf)
            {
                teleporter.SetActive(true);
                Changes.Add(scene.path + ": Enabled teleporter object " + GetPath(teleporter.transform));
            }

            Collider col = teleporter.GetComponent<Collider>();

            if (col == null)
            {
                Renderer renderer = teleporter.GetComponentInChildren<Renderer>();
                if (renderer != null)
                {
                    BoxCollider box = teleporter.AddComponent<BoxCollider>();
                    box.isTrigger = true;
                    Changes.Add(scene.path + ": Added trigger BoxCollider to " + GetPath(teleporter.transform));
                }
                else
                {
                    Warnings.Add(scene.path + ": Teleporter has no Collider and no Renderer bounds: " + GetPath(teleporter.transform));
                }
            }
            else if (!col.isTrigger)
            {
                col.isTrigger = true;
                Changes.Add(scene.path + ": Set Collider.isTrigger=true on " + GetPath(teleporter.transform));
            }
        }

        if (destinations.Count == 0)
        {
            Vector3 destinationPosition = Vector3.zero;

            if (spawnAnchors.Count > 0)
            {
                destinationPosition = spawnAnchors[0].transform.position + new Vector3(0f, 0f, 2f);
            }

            GameObject destination = new GameObject("SVR_TeleportDestination_Default");
            destination.transform.position = destinationPosition;
            destination.transform.rotation = Quaternion.identity;

            Changes.Add(scene.path + ": Created missing default teleporter destination at " + destinationPosition);
        }
        else
        {
            foreach (GameObject dest in destinations)
            {
                if (!dest.activeSelf)
                {
                    dest.SetActive(true);
                    Changes.Add(scene.path + ": Enabled destination object " + GetPath(dest.transform));
                }
            }
        }

        ValidatePlayerRig(scene, roots);
        ValidateDuplicateDestinations(scene, destinations);

        EditorSceneManager.MarkSceneDirty(scene);
    }

    private static void ValidatePlayerRig(Scene scene, GameObject[] roots)
    {
        bool foundRig = false;

        foreach (GameObject root in roots)
        {
            Transform[] allTransforms = root.GetComponentsInChildren<Transform>(true);

            foreach (Transform t in allTransforms)
            {
                string n = t.name.ToLowerInvariant();

                if (
                    n.Contains("player") ||
                    n.Contains("xr rig") ||
                    n.Contains("xrrig") ||
                    n.Contains("camera rig") ||
                    n.Contains("vr rig")
                )
                {
                    foundRig = true;

                    if (!t.gameObject.activeInHierarchy)
                    {
                        Warnings.Add(scene.path + ": Possible player rig exists but is inactive: " + GetPath(t));
                    }
                }
            }
        }

        if (!foundRig)
        {
            Warnings.Add(scene.path + ": No obvious Player/XR/Camera Rig object found by name.");
        }
    }

    private static void ValidateDuplicateDestinations(Scene scene, List<GameObject> destinations)
    {
        if (destinations.Count <= 1) return;

        Dictionary<string, int> nameCounts = new Dictionary<string, int>();

        foreach (GameObject dest in destinations)
        {
            string key = dest.name.ToLowerInvariant();

            if (!nameCounts.ContainsKey(key))
                nameCounts[key] = 0;

            nameCounts[key]++;
        }

        foreach (var pair in nameCounts)
        {
            if (pair.Value > 1)
            {
                Warnings.Add(scene.path + ": Duplicate destination name detected: " + pair.Key + " count=" + pair.Value);
            }
        }
    }

    private static string GetPath(Transform t)
    {
        string path = t.name;
        Transform current = t.parent;

        while (current != null)
        {
            path = current.name + "/" + path;
            current = current.parent;
        }

        return path;
    }

    private static void WriteReport(string reportDir)
    {
        string reportPath = Path.Combine(reportDir, "teleporter_repair_report.json");

        StringBuilder sb = new StringBuilder();
        sb.AppendLine("{");
        sb.AppendLine("  \"tool\": \"SVRRepairTeleporter\",");
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
