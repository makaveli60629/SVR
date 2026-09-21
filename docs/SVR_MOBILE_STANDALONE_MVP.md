# SVR Mobile Standalone MVP

Branch: mobile-standalone-mvp

Goal: create a phone-only sister product that monetizes through play-chip and cosmetic in-app purchases plus advertising while introducing players to the larger SVR VR network.

## Boundaries
- Phone-first UI with no VR lobby dependency.
- Android and iPhone supported.
- Play-money poker only; no cash-out or redemption.
- Lightweight 2D avatars.
- Reuse the protected phone poker engine and tournament routes rather than forking poker rules.
- Shared SVR login/network links remain available.

## Monetization architecture
The MVP has fail-closed adapters for native billing and rewarded ads. Native Google Play Billing or StoreKit receipt verification should be server-side before chips or owned cosmetics are granted.

## Next phase
- native wrapper
- SKU catalog and receipt verification endpoint
- rewarded/banner ads
- mobile-only matchmaking queue
- push notifications
- App Store / Play Store listing assets and disclosures
- analytics and crash reporting
