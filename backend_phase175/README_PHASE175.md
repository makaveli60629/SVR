# SVR Phase 175 Backend Notes

Build: PHASE-175-CLEAN-RUNTIME-POKER-DB-LOCK

Use this backend after Phase 174 starter. It adds SQL tables for game hand results and telemetry.
Keep SQL connection strings, Stripe secrets, and admin passwords in Azure App Service settings or `.env` only.
Never commit secrets into GitHub Pages/frontend files.
