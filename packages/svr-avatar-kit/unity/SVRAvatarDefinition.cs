using System;
using UnityEngine;

namespace SVRPoker.AvatarKit
{
    public static class SVRAvatarSchema
    {
        public const int Version = 2;
        public const string Build = "SVR-AVATAR-KIT-V1";
    }

    [Serializable]
    public class SVRAvatarDefinition
    {
        public int schemaVersion = SVRAvatarSchema.Version;
        public string baseBodyId = "male-eric-v1";
        public SVRAppearance appearance = new SVRAppearance();
        public SVRBodyMorphs morphs = new SVRBodyMorphs();
        public SVREquipment equipment = new SVREquipment();
        public SVRProfileCosmetics profileCosmetics = new SVRProfileCosmetics();

        public void ClampMorphs()
        {
            morphs.height = Mathf.Clamp01(morphs.height);
            morphs.bodyMass = Mathf.Clamp01(morphs.bodyMass);
            morphs.shoulderWidth = Mathf.Clamp01(morphs.shoulderWidth);
            morphs.torsoLength = Mathf.Clamp01(morphs.torsoLength);
            morphs.armLength = Mathf.Clamp01(morphs.armLength);
            morphs.legLength = Mathf.Clamp01(morphs.legLength);
            morphs.handScale = Mathf.Clamp01(morphs.handScale);
            morphs.footScale = Mathf.Clamp01(morphs.footScale);
        }

        public static SVRAvatarDefinition FromJson(string json)
        {
            var avatar = JsonUtility.FromJson<SVRAvatarDefinition>(json);
            if (avatar == null) throw new ArgumentException("SVR_AVATAR_JSON_INVALID");
            if (avatar.schemaVersion != SVRAvatarSchema.Version)
                throw new ArgumentException($"SVR_AVATAR_SCHEMA_UNSUPPORTED:{avatar.schemaVersion}");
            avatar.ClampMorphs();
            return avatar;
        }

        public string ToJson(bool prettyPrint = false)
        {
            ClampMorphs();
            return JsonUtility.ToJson(this, prettyPrint);
        }
    }

    [Serializable]
    public class SVRAppearance
    {
        public string skinToneId = "skin-05";
        public string eyeColorId = "eye-brown";
        public string hairStyleId = "hair-short-fade";
        public string hairColorId = "hair-black";
        public string nailStyleId = "nail-natural";
        public string nailColorId = "nail-clear";
    }

    [Serializable]
    public class SVRBodyMorphs
    {
        [Range(0f, 1f)] public float height = 0.5f;
        [Range(0f, 1f)] public float bodyMass = 0.5f;
        [Range(0f, 1f)] public float shoulderWidth = 0.5f;
        [Range(0f, 1f)] public float torsoLength = 0.5f;
        [Range(0f, 1f)] public float armLength = 0.5f;
        [Range(0f, 1f)] public float legLength = 0.5f;
        [Range(0f, 1f)] public float handScale = 0.5f;
        [Range(0f, 1f)] public float footScale = 0.5f;
    }

    [Serializable]
    public class SVREquipment
    {
        public string hair = "hair-short-fade";
        public string headwear = "none";
        public string eyewear = "none";
        public string faceAccessory = "none";
        public string top = "top-svr-black-tee";
        public string outerwear = "none";
        public string bottom = "bottom-black-jeans";
        public string shoes = "shoe-black-low";
        public string neck = "none";
        public string wristLeft = "none";
        public string wristRight = "watch-svr-classic";
        public string handLeft = "none";
        public string handRight = "none";
    }

    [Serializable]
    public class SVRProfileCosmetics
    {
        public string portraitFrame = "none";
        public string title = "none";
        public string badge = "none";
        public string pose = "default";
        public string emote = "none";
    }

    public enum SVRAvatarEquipSlot
    {
        Hair,
        Headwear,
        Eyewear,
        FaceAccessory,
        Top,
        Outerwear,
        Bottom,
        Shoes,
        Neck,
        WristLeft,
        WristRight,
        HandLeft,
        HandRight
    }

    [Serializable]
    public class SVRAvatarCatalogItem
    {
        public string itemId;
        public string label;
        public string storeCategory;
        public SVRAvatarEquipSlot equipSlot;
        public string geometryProfile;
        public string assetKey;
        public bool ownedByDefault;
    }
}
