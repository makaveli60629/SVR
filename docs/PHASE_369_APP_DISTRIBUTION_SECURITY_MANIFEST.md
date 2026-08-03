# SVR App Distribution and Prize-Fund Security Manifest

## Distribution records

Track three separate metrics:

1. **Google Play metrics** — installs, active audience, updates, DAU/MAU and crashes from Play Console.
2. **Direct-download metrics** — count a server-side signed-download redirect, not a static GitHub Pages file hit.
3. **Active-install metrics** — authenticated first-run registration and periodic heartbeat tied to a random installation ID.

Never use an installation ID as proof that an APK is genuine.

## Integrity verification

For a Play-distributed Android app:

- keep the app signing key in Play App Signing or a controlled HSM/KMS process;
- verify package name, version code and signing certificate;
- obtain Play Integrity verdicts at login, tournament entry, result submission and payout claim;
- bind each integrity request to a stable SHA-256 `requestHash`;
- reject replayed, unlicensed, unrecognized or tampered requests according to a documented risk policy;
- keep poker results, balances, prizes and payout approvals server-authoritative.

For a sideloaded build:

- sign every APK with the same protected release key;
- publish SHA-256 checksums;
- use an HTTPS manifest;
- verify the signing certificate inside the native wrapper and report it to the backend;
- understand that sideloading cannot fully prevent copying, modification or reverse engineering.

## Privacy and admin research

Recommended long-retention fields:

- player ID and display name
- installation ID
- app version
- first/last seen
- last login
- integrity verdict
- coarse country/region
- keyed IP hash
- tamper flags
- account and admin audit events

Avoid exposing raw IP addresses in the admin browser. Publish a privacy notice, define retention periods, restrict admin roles and log every admin lookup.

## Cash prizes and payment providers

Cash App/Square acceptance APIs are not automatically a lawful prize-disbursement system. Prize payout stays disabled until:

- official written tournament rules exist;
- no unlawful consideration/wager is required;
- participant age and jurisdiction are checked;
- identity and sanctions screening are complete;
- tax reporting is handled;
- the payment provider approves the activity;
- a licensed attorney/accountant reviews the structure;
- any nonprofit partner signs a written agreement defining restricted funds, fees and control.

Use a dedicated business bank account at an FDIC-insured bank. An escrow account is a legal fiduciary arrangement, not merely a savings account. Do not label a normal account “escrow” or invest participant/prize funds for yield without legal authority and written rules.

## Current locks

- `automatedPayoutsEnabled = false`
- prize claims start `pending_compliance`
- no bank routing/account data in SVR registration
- no real-money poker or wagering claim
- no cloud deployment claim
