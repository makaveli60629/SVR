/*
SVR Full Update Adapter
Engine-neutral helper for web/custom JS projects.

Use:
import {
  applySVRDuplicateCleanup,
  getSVRSkyObjects,
  getSVRPortalSideFeatures,
  getSVRTeleporterConfig
} from "./svr-full-update-adapter.js";

This adapter does not require Unity.
It keeps original floor/tabletop objects and disables only obvious duplicate overlay copies.
*/

export function applySVRDuplicateCleanup(worldObjects = []) {
  const duplicatePatterns = [
    "duplicate floor",
    "overlay floor",
    "second floor",
    "floor2",
    "floor_2",
    "floor-2",
    "extra floor",
    "duplicate tabletop",
    "overlay tabletop",
    "second tabletop",
    "tabletop2",
    "tabletop_2",
    "tabletop-2",
    "duplicate table top",
    "overlay table top",
    "second table top"
  ];

  return worldObjects.map((object) => {
    const label = [
      object.id,
      object.name,
      object.key,
      object.title,
      object.type,
      object.asset,
      object.assetId
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const shouldDisable = duplicatePatterns.some((pattern) =>
      label.includes(pattern)
    );

    if (!shouldDisable) return object;

    return {
      ...object,
      enabled: false,
      active: false,
      visible: false,
      disabledBy: "SVR full update duplicate cleanup",
      disableReason:
        "Duplicate overlay floor/tabletop removed while preserving original."
    };
  });
}

export function getSVRSkyObjects() {
  return {
    root: {
      id: "SVR_SkyRoot",
      position: { x: 0, y: 65, z: 140 },
      collision: "none"
    },
    objects: [
      {
        id: "SVR_Moon",
        type: "skyBody",
        enabled: true,
        collision: "none",
        position: { x: -35, y: 97, z: 160 },
        scale: { x: 18, y: 18, z: 18 },
        material: {
          color: "#D3D7E6",
          emissive: "#AAB0C8"
        },
        orbit: {
          pivot: "SVR_SkyRoot",
          radius: 145,
          degreesPerSecond: 0.08,
          safeBehindMainBuilding: true,
          neverCrossLobbyPlayArea: true
        }
      },
      {
        id: "SVR_Mars",
        type: "skyBody",
        enabled: true,
        collision: "none",
        position: { x: 48, y: 107, z: 186 },
        scale: { x: 11, y: 11, z: 11 },
        material: {
          color: "#D94A2A",
          emissive: "#8E2D1F"
        },
        orbit: {
          pivot: "SVR_SkyRoot",
          radius: 170,
          degreesPerSecond: 0.05,
          safeBehindMainBuilding: true,
          neverCrossLobbyPlayArea: true
        }
      }
    ]
  };
}

export function getSVRPortalSideFeatures() {
  return {
    root: "SVR_PortalSideFeatures",
    clearPath: {
      id: "SVR_Portal_ClearPath_DoNotBlock",
      enabled: true,
      radius: 7
    },
    objects: [
      {
        id: "SVR_NewLounge_A",
        type: "lounge",
        enabled: true,
        positionOffsetFromPortal: { right: 10, forward: 7, up: 0 },
        anchor: "SVR_Lounge_A_PlayerAnchor",
        placeholderGeometry: true
      },
      {
        id: "SVR_NewLounge_B",
        type: "lounge",
        enabled: true,
        positionOffsetFromPortal: { right: 22, forward: 7, up: 0 },
        anchor: "SVR_Lounge_B_PlayerAnchor",
        placeholderGeometry: true
      },
      {
        id: "SVR_Storefront_NextToPortal",
        type: "storefront",
        enabled: true,
        positionOffsetFromPortal: { right: 16, forward: 18, up: 0 },
        anchor: "SVR_Storefront_InteractionAnchor",
        placeholderGeometry: true
      }
    ]
  };
}

export function getSVRTeleporterConfig() {
  return {
    enabled: true,
    cooldownSeconds: 0.65,
    destinationRequired: true,
    spawnAnchorRequired: true,
    blockInvalidLanding: true,
    preserveFistLocomotion: true,
    preserveTeleportLeap: true,
    defaultDestination: {
      id: "SVR_TeleportDestination_Default",
      enabled: true,
      position: { x: 0, y: 1, z: 2 }
    }
  };
}
