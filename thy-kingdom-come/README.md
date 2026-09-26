# Thy Kingdom Come Project — Website Sandbox

This directory is an intentionally isolated, static project website for the development-stage Thy Kingdom Come Project / Restoration Village pilot.

## Isolation rule

Nothing in this directory is imported by, linked into, or required by the SVR Poker game runtime.

The site uses only relative paths:

- `./styles.css`
- `./app.js`
- `./availability.json`
- `./logo.svg`

That makes the folder portable to a future domain with no code dependency on `svrpoker.com`.

## Current temporary route

After production deployment, the intended sandbox route is:

`https://svrpoker.com/thy-kingdom-come/`

This temporary route is only a development foothold. The page includes `noindex,nofollow` so search engines are discouraged from treating the SVR domain as the permanent project home.

## Future domain migration

When the permanent project domain is purchased:

1. Copy the contents of this folder to the new host/document root.
2. Remove or change the `robots` noindex directive in `index.html`.
3. Add the permanent canonical URL and social preview metadata.
4. Connect the permanent fundraising, CRM, analytics and booking tools.
5. Replace the development-stage disclosure only after legal/status changes are verified.
6. Keep all links relative unless an external destination is intentional.

## Availability architecture

`availability.json` is the temporary single source for the public RV availability panel.

During pre-development:
- `acceptingReservations` = false
- `availableCount` = 0
- all sites = planned

At opening, this file can be replaced by a build step or API feed from a campground property-management system. The page is already structured so public availability can update without rewriting the design.

## Working financial assumptions shown publicly

The website currently shows:
- Phase 1 working budget: approximately $166,400
- Planning range: $105,000–$222,000
- Opening RV sites: 3
- Planned RV sites: 6
- Founder/caretaker residence: 1

These figures are planning assumptions and must be replaced with contractor, utility, engineering and insurance quotes as due diligence progresses.

## Compliance posture

The current page intentionally does **not** state that:
- a property has been purchased,
- RV reservations are open,
- donations are tax-deductible,
- 501(c)(3) recognition has been received,
- grants have been awarded,
- permits or zoning approvals have been issued.

Update those statements only after documentary confirmation.

## Contact

Ronald Chadee  
Thy Kingdom Come Project  
thykingdomcomeproject@gmail.com  
815-908-8411
