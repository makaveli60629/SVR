# SVR Poker Mobile — Standalone MVP

This is a separate phone-first sister product. It does not load the VR lobby.

## MVP
- Home, Quick Play, Practice, Tournaments and Free For All entry
- lightweight 2D avatar selector
- play-chip wallet UI
- chip-pack and cosmetic store UI
- native billing adapter that fails closed until Google Play Billing / Apple StoreKit are connected
- rewarded-ad adapter that fails closed until an ad SDK is connected
- shared SVR account links
- installable PWA shell
- promotion path into SVR VR

## Money policy
All chips are play money only. They have no cash value, no withdrawal, and no redemption. Store purchases are for play chips or cosmetics only.

## Native packaging next
Wrap the mobile folder with Capacitor or the existing native Android shell, then connect Google Play Billing, Apple StoreKit, ads, production account/match APIs, push notifications, and store listing assets.

The MVP reuses the existing audited phone poker and tournament routes while giving them a separate product shell.