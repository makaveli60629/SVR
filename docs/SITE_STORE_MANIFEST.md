# SVR Poker Site Store Manifest

## Source
Added from uploaded store page packet on 2026-05-22.

## Store page target
The `site/store.html` page should be a polished premium storefront that keeps the SVR Poker visual language intact while replacing generic right-side placeholder content with a premium real-time interactive system banner.

## Required layout
- Header with SVR Poker logo area.
- Small `Admin Online` badge preserved.
- Navigation links: Home, About, Sponsors, Advertising, Billboards, Store, Membership, Impact, Contact.
- Main two-column store hero:
  - Left: SVR STORE title and professional storefront explanation.
  - Right: premium banner image/card.
- Lower category cards:
  - Game Items
  - Partner Products
  - Event Drops
- Footer links:
  - Public Launch
  - Preview Game
  - Contact

## Store copy target
The store should describe digital items, apparel concepts, sponsor products, collectibles, and VR-friendly shopping. It should explain that SVR can promote avatar clothing, table themes, chip styles, partner products, event drops, and premium memberships.

## Branding rules
- Keep dark premium casino/VR styling.
- Use clean lowercase-safe file paths and CSS conventions.
- Keep the page responsive for desktop, mobile, and VR web surfaces.
- Do not expose backend, database, AWS, admin, payment, or API implementation details in public-facing copy.
- Do not use temporary `googleusercontent.com/image_generation_content` links in production. Replace temporary banner references with repo-hosted assets under `site/assets`, `assets`, or another locked static asset path.

## Integration target
The store page should later connect through the public API/data bridge for product categories, sponsor products, memberships, and future avatar/game item ownership. Until backend endpoints are ready, use polished fallback content and static demo cards.

## Development lock
This manifest should be used before editing `site/store.html` so future updates do not lose the intended layout, header, admin badge, premium banner area, responsive grid, and category structure.
