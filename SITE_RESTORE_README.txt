SVR Poker official public site restore package

Source: SVR-main (3).zip -> update/site.zip
Purpose: restore Matrix public launch page and one-page site without touching /game.

Includes:
- index.html public launch page
- binary Matrix rain via matrix.js
- hidden Matrix phrases preserved: I LOVE SHY and I LOVE SCARLETT
- site/index.html one-page site with Login, Store, Stripe/SQL handoff, Contact
- Admin Online / Admin Offline UI hook
- Visitor Message Drop UI hook, local-safe until Azure SQL/API is wired
- logo.webp, launch.css, style.css, setup notes

Deploy target with current workflow:
- copy this ZIP to the repository root as site.zip
- commit site.zip
- run Auto Deploy

Do not put this file in update/site.zip for the current workflow; current deploy.yml restores the public site from root site.zip.
