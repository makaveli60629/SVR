# SVR Poker — Riki Luxury Showroom Lock

## Phase Label

Riki Luxury Showroom Lock

## Purpose

Upgrade the Riki/Reiki storefront into a polished luxury wellness showroom while preserving the current lobby baseline, portal routing, and game-side-only workflow.

## Hard Rules

- Game-side only.
- Do not touch the public website/site track.
- Preserve the current lobby baseline.
- Keep the Riki/Reiki work modular and easy to remove or revise.
- Keep portal routing clean.
- Keep the game package under 25 MB.
- Do not use unapproved sponsor/founder branding unless explicit approval is later given.
- Use SVR branding and AWAITING APPROVAL placeholders where sponsor/founder content is pending.

## Luxury Showroom Direction

The Riki/Reiki area should feel like a premium wellness showroom, not a loose set of signs.

Target feel:

- calm
- clean
- luxury spa
- high-end glass showroom
- easy to understand in VR
- clear walking path
- no clutter in the user's face
- symmetrical where possible

## Layout Lock

Preferred layout:

```text
[ Left Glass Walkway ]   [ Center Hologram Wall ]   [ Right Glass Walkway ]
```

### Left Side

- informational wellness panels
- clean glass side
- plants behind or outside rails

### Center

- main curved hologram display
- no large sign in front of video
- small label under video only
- audio zone centered to the viewing area

### Right Side

- seven chakra light wall
- future hologram expansion zone
- clean glass and rail alignment

## Required Visual Fixes

- Replace yellow/gold stanchion feel with silver showroom poles.
- Use deep red velvet rope.
- Extend red carpet from the storefront entrance through the glass viewing path.
- Keep plants out of the walkway.
- Keep glass visible on both sides.
- Keep two readable entry lanes.
- Keep volume panel small and off the main glass/hologram view.
- Add small help/status panel rather than large debug signage.

## Chakra Wall

Add a luxury chakra fixture on the right-side wall:

- Crown
- Third Eye
- Throat
- Heart
- Solar Plexus
- Sacral
- Root

Visual style:

- vertical floating medallions
- soft pulse
- transparent glass/plasma look
- short labels
- no excessive text

## User-Friendly Panels

### Help Panel

Text target:

```text
RIKI EXPERIENCE
1. Enter the glass showroom
2. Face the hologram
3. Audio rises automatically
4. Use the side panel for volume
5. Use the portal for the private room
```

### Status Panel

Text target:

```text
Hologram: Playing
Audio Zone: Auto
Portal: Ready
Approval: Pending
```

## Approval Safety

Until explicit approval is given, live runtime should avoid unapproved sponsor/founder branding. Use:

```text
AWAITING APPROVAL
```

or

```text
PENDING APPROVAL
```

## Testing Checklist

- [ ] Riki showroom has glass on both sides.
- [ ] Red carpet is long, straight, and centered.
- [ ] Rails are silver with red ropes.
- [ ] Plants do not block walkway.
- [ ] Hologram is visible and not blocked by signs.
- [ ] Hologram label is under the video only.
- [ ] Volume panel is smaller and moved to the side.
- [ ] Chakra wall is visible on the right side.
- [ ] Help/status panels are readable.
- [ ] Portal path remains clear.
- [ ] Scorpion portal remains at X 12.78 / Z 15.75 / yaw 51.78.
- [ ] Moon/Mars and lobby systems are not broken by this pass.

## Rollback

If the luxury showroom causes visual clutter or frame issues:

1. Disable the luxury showroom extras.
2. Keep the base Riki/Reiki portal active.
3. Keep the hologram video plane active.
4. Remove chakra medallions first, then rail extras, then plants.

## Next After Lock

After Riki/Reiki is stable, review:

1. portal alignment
2. Moon/Mars visibility
3. Camera 3 route
4. watch orientation
5. teleport controls
6. Scorpion room gameplay
