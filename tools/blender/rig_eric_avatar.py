# Phase 111 - Eric avatar rigging helper
# Run this inside Blender, not in the browser.
# Goal: import Eric FBX, use the rigged human armature as the skeleton source,
# attempt automatic weighting, add seated pose helper, and export a WebXR-ready GLB.
#
# Usage in Blender Python console or command line:
# blender --background --python tools/blender/rig_eric_avatar.py -- \
#   --rigged-blend /path/to/riggedhumanmale.blend \
#   --eric-fbx /path/to/eric.fbx \
#   --out game/assets/avatars/eric/eric_rigged.glb

import argparse
import os
import sys
import bpy
from mathutils import Vector


def after_double_dash():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1:]
    return []


def parse_args():
    parser = argparse.ArgumentParser(description="SVR Eric NPC rig transfer/export helper")
    parser.add_argument("--rigged-blend", required=True, help="Path to riggedhumanmale.blend")
    parser.add_argument("--eric-fbx", required=True, help="Path to eric.fbx")
    parser.add_argument("--out", required=True, help="Output GLB path")
    return parser.parse_args(after_double_dash())


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def append_rigged_source(blend_path):
    # Append all objects from the rigged blend, then keep the largest armature as the skeleton source.
    with bpy.data.libraries.load(blend_path, link=False) as (data_from, data_to):
        data_to.objects = list(data_from.objects)
    for obj in data_to.objects:
        if obj is not None:
            bpy.context.collection.objects.link(obj)
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if not armatures:
        raise RuntimeError("No armature found in riggedhumanmale.blend")
    armatures.sort(key=lambda o: len(o.data.bones), reverse=True)
    rig = armatures[0]
    rig.name = "SVR_Eric_Humanoid_Armature"
    rig.data.name = "SVR_Eric_Humanoid_ArmatureData"
    return rig


def import_eric_fbx(fbx_path):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    imported = [obj for obj in bpy.context.scene.objects if obj not in before]
    meshes = [obj for obj in imported if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("No mesh found in Eric FBX")
    for obj in imported:
        obj.name = "EricNPC_" + obj.name
    return meshes, imported


def normalize_meshes(meshes):
    # Keep Eric centered and WebXR-friendly. Exact fitting should be adjusted visually in Blender.
    for mesh in meshes:
        bpy.context.view_layer.objects.active = mesh
        mesh.select_set(True)
        try:
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        except Exception:
            pass
        mesh.select_set(False)

    # Estimate bounds and scale to about 1.75m height if needed.
    all_corners = []
    for obj in meshes:
        for corner in obj.bound_box:
            all_corners.append(obj.matrix_world @ Vector(corner))
    min_z = min(v.z for v in all_corners)
    max_z = max(v.z for v in all_corners)
    height = max(max_z - min_z, 0.001)
    scale = 1.75 / height
    if scale > 0 and scale < 20:
        for obj in meshes:
            obj.scale *= scale
        bpy.ops.object.select_all(action="DESELECT")
        for obj in meshes:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def bind_meshes_to_rig(meshes, rig):
    # Attempt automatic weights. This is a start; final hand/finger quality may need Blender cleanup.
    bpy.ops.object.select_all(action="DESELECT")
    for mesh in meshes:
        mesh.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    try:
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    except Exception as exc:
        print("[SVR] Automatic weights failed; adding armature modifier fallback:", exc)
        for mesh in meshes:
            mod = mesh.modifiers.new("SVR_Eric_Armature", "ARMATURE")
            mod.object = rig
            mesh.parent = rig


def add_metadata(rig, meshes):
    rig["SVR_PHASE"] = "PHASE-111-ERIC-AVATAR-RIG-PIPELINE"
    rig["SVR_ROLE"] = "Scorpion poker NPC / seated dealer-player candidate"
    for mesh in meshes:
        mesh["SVR_AVATAR"] = "EricNPC"
        mesh["SVR_EXPORT_TARGET"] = "WebXR GLB"


def export_glb(out_path, rig, meshes):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for mesh in meshes:
        mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=True,
        export_skins=True,
        export_morph=True,
        export_materials="EXPORT",
        export_image_format="AUTO"
    )


def main():
    args = parse_args()
    clear_scene()
    rig = append_rigged_source(args.rigged_blend)
    meshes, imported = import_eric_fbx(args.eric_fbx)
    normalize_meshes(meshes)
    bind_meshes_to_rig(meshes, rig)
    add_metadata(rig, meshes)
    export_glb(args.out, rig, meshes)
    print("[SVR] Eric rig export complete:", args.out)


if __name__ == "__main__":
    main()
