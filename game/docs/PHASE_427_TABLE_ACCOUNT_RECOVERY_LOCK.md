# Phase 427 — Table Polish + Player Account Recovery Lock

Build: `DEALER-LAB-V2.2-TABLE-POLISH-PASSLINE-DEALER-HANDS`

## Scope lock
- Private Dealer Lab and reusable game modules only for table/dealer work.
- Account-client/mobile account recovery is allowed.
- Public landing page is not modified.

## Locked sizing baseline
Dealer:
- scale `0.0055`
- x `-0.10`
- grounded y baseline `0.00268026492655681`
- z `0.71`
- shoulderX `0.55`
- shoulderZ `-0.48`
- elbowX `0.36`
- wristZ `-0.45`
- speed `1.35`

Table:
- tableY `0.62`
- feltDrop `0.014`
- innerMargin `0.125`
- collisionDrop `0.020`
- cardLift legacy tuning value `0.008`

## Table authority
- Native `polotno` mesh is the visible felt.
- Existing upper/rail geometry is restored as the padded handrest and rendered with dark leather material.
- Handrest geometry is tightened slightly rather than replaced with a generated purple slab.
- Center branding uses `/logo.png`.
- Permanent sponsor locations are left and right of the center logo.
- Left placeholder is `REIKI / SPONSOR`; right placeholder is `SPONSOR / RESERVED`.
- White elliptical betting/pass line is painted on the branding overlay.

## Card surface authority
Card landing height is derived from the measured native felt top plus half card thickness and a sub-millimeter anti-z-fighting clearance. The old collisionDrop/cardLift arithmetic is not the visual card landing authority.

## Felt interaction contract
`felt_interaction_module.js` defines the lab/reusable interaction contract:
- cards committed inside the betting line => fold event;
- chips committed inside the betting line => wager event;
- chips outside the line remain in the player zone;
- wager math reports bet/call/raise/incomplete/all-in states using stack, toCall and minimumRaiseTo inputs.

This module does not mutate the production poker engine by itself. Production promotion requires visual and gameplay approval.

## Eric dealer authority
- Eric remains grounded.
- Default pose raises both arms to a dealer-ready posture.
- A visible deck is attached to the left-hand world position.
- The deal card is staged at the right hand.
- Deal events expose the right-hand world-space origin so cards no longer originate from the opposite side/invisible point.

## Player account recovery
The cloud account endpoint remains pending and must not be shown green.

Phase 427 removes the Create Player dead end while AWS is unavailable:
- Create Player makes a playable device-local provisional identity.
- Local password is not stored in plaintext.
- A random salt plus PBKDF2-SHA256 verifier is stored locally for same-device sign-in.
- Cloud registration/login remains the authority automatically when `apiBase` is configured and healthy.
- DynamoDB/Cognito/API Gateway are not claimed online until a real public endpoint passes health and end-to-end registration/login tests.

## Promotion checklist
- [ ] handrest visually approved
- [ ] logo/pass line/sponsor placement visually approved
- [ ] cards visibly touch felt without clipping/hover
- [ ] Eric deck/hand/deal origin visually approved
- [ ] fold/wager line behavior tested before production poker-engine hookup
- [ ] Create Player works on a fresh Android/iPhone browser with AWS endpoint absent
- [ ] local sign-in works after sign-out on same device
- [ ] cloud endpoint remains yellow/pending until real AWS deployment is verified
