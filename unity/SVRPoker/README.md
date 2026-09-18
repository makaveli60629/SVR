# SVR Poker — Unity 6.3 LTS Foundation

This folder is the parallel Unity project for SVR Poker. It does **not** replace the production A-Frame/Three.js/WebXR game.

## Current foundation
- Unity 6.3 LTS project pinned to 6000.3.15f1.
- Minimal dependency set to keep cloud restore/build predictable.
- Automatic bootstrap scene creation.
- Web build entry point: `SVR.Editor.SVRBuild.BuildWebCloud`.
- Android/Quest-prototype entry point: `SVR.Editor.SVRBuild.BuildAndroidCloud`.
- Brotli Web compression + Web data caching.
- Browser event bridge:
  - `svr:unity-progress`
  - `svr:unity-ready`
- Simple generated table/lighting scene so CI can prove the Unity project builds before the production poker assets are migrated.

## Unity Build Automation project root
Set the Unity project subdirectory/root to:

`unity/SVRPoker`

## Recommended build configurations

### SVR-Web
- Unity: 6000.3.15f1 / Unity 6.3 LTS
- Target: WebGL
- Build method: `SVR.Editor.SVRBuild.BuildWebCloud`
- Auto-build: off initially
- Auto-cancel: on after the first successful build

### SVR-Android
- Unity: 6000.3.15f1 / Unity 6.3 LTS
- Target: Android
- Build method: `SVR.Editor.SVRBuild.BuildAndroidCloud`
- Artifact: `SVRPoker.apk`
- Signing: debug/testing first; production keystore later

## Quest
The first Android cloud build validates the shared Unity pipeline. Meta/OpenXR packages and XR Plug-in Management settings should be added during the first interactive Unity Editor session on a cloud workstation. That keeps the repository buildable instead of committing hand-written XR settings assets that have never been opened/serialized by Unity.

## Migration order
1. Verify empty/bootstrap Web build.
2. Verify Android APK build.
3. Import the canonical SVR table asset.
4. Port lighting and seated camera.
5. Port Eric and animation controller.
6. Port poker cards/chips/game state.
7. Add OpenXR/Meta XR and Quest input/hands.
8. Port avatars/watch/social systems.
9. Move secondary rooms to Addressables/progressive loading.

The browser game remains the fallback throughout migration.
