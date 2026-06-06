using UnityEngine;

public class SVRSkyOrbit : MonoBehaviour
{
    public Transform pivot;
    public Vector3 orbitAxis = Vector3.up;
    public float degreesPerSecond = 0.25f;
    public bool rotateSelf = true;
    public float selfRotationMultiplier = 4f;

    private void Update()
    {
        if (pivot != null)
        {
            Vector3 safeAxis = orbitAxis.sqrMagnitude < 0.001f ? Vector3.up : orbitAxis.normalized;
            transform.RotateAround(pivot.position, safeAxis, degreesPerSecond * Time.deltaTime);
        }

        if (rotateSelf)
        {
            transform.Rotate(Vector3.up, degreesPerSecond * selfRotationMultiplier * Time.deltaTime, Space.Self);
        }
    }
}
