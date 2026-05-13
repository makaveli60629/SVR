# SVR Site Phase 03 — Azure SQL Next Steps

Build: `SITE-PHASE-03-REFINED-SVRHELP-DIRECT-LOCK`

Do not put SQL passwords, Stripe secrets, or API keys in static website files.

Required backend pattern:

```text
GitHub Pages static site -> Azure App Service API -> Azure SQL
```

Recommended first API endpoints:

```text
GET  /api/health
GET  /api/admin/status
POST /api/messages
POST /api/admin/login
GET  /api/admin/messages
```
