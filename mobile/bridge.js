(() => {
  window.SVRMobileBridge = {
    platform: /Android/i.test(navigator.userAgent) ? "android" : (/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "ios" : "web"),
    async purchase(sku) {
      if (window.SVRMobileBilling && typeof window.SVRMobileBilling.purchase === "function") return window.SVRMobileBilling.purchase(sku);
      throw new Error("NATIVE_BILLING_NOT_CONNECTED");
    },
    async showRewardedAd() {
      if (window.SVRMobileAds && typeof window.SVRMobileAds.showRewarded === "function") return window.SVRMobileAds.showRewarded();
      throw new Error("REWARDED_ADS_NOT_CONNECTED");
    }
  };
})();