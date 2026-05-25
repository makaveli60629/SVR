# SVR Phase 174 Backend + Database Starter

This package upgrades the database/backend side without touching the public Matrix page.

## Install locally
```powershell
cd backend
npm install
Copy-Item .env.example .env
notepad .env
npm start
```

## Azure SQL
Run `sql/001_svr_enterprise_schema.sql` in Azure SQL Query Editor.

## Secrets rule
Do not commit `.env`. Do not place Azure SQL, Stripe, JWT, or admin passwords in website/game JavaScript.

## Checkout lock
`STORE_CHECKOUT_ENABLED=false` by default.
