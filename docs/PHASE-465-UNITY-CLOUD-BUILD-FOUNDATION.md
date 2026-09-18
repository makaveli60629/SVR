# Phase 465 — Unity Cloud-Build Foundation

## Status
Foundation committed on the Phase 464/465 draft branch. Production `main` is unchanged.

## Objective
Create an SVR Unity project that can be built from cloud infrastructure while the project owner works from Android.

## Architecture
Android phone
→ GitHub repository
→ Unity Build Automation
→ Web build / Android APK
→ SVRPoker.com deployment and Quest testing

## Why Unity 6.3 LTS
Unity 6.3 is the current LTS line and is appropriate for the production migration track. The project is pinned to 6000.3.15f1 for reproducibility.

## Cloud build roots
Unity project root: `unity/SVRPoker`

Web custom method:
`SVR.Editor.SVRBuild.BuildWebCloud`

Android custom method:
`SVR.Editor.SVRBuild.BuildAndroidCloud`

## Deliberately not enabled yet
- Meta XR SDK
- OpenXR loader
- XR Plug-in Management serialized settings
- production keystore/signing
- production table/avatars/audio binary imports

Those require an actual Unity Editor serialization pass or secure user credentials. They should not be guessed into source control.

## First successful-build acceptance
Web:
- Unity project restores packages.
- Bootstrap scene is generated.
- Web player builds with Brotli.
- Browser receives `svr:unity-ready`.

Android:
- APK compiles.
- Package id is `com.svrpoker.game`.
- Landscape orientation.
- Bootstrap table renders.

## Next migration slice
After both cloud builds pass, port only the canonical table + lighting + seated camera. Eric follows after scale/origin verification. This keeps geometry errors isolated and avoids reproducing the current browser phase-stack inside Unity.
