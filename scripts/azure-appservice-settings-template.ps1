# Fill values locally. Do not commit real secrets.
az webapp config appsettings set --resource-group YOUR_RG --name YOUR_APP_NAME --settings `
  NODE_ENV=production `
  ALLOWED_ORIGIN=https://svrpoker.com `
  STORE_CHECKOUT_ENABLED=false `
  ADMIN_EMAIL=YOUR_EMAIL `
  ADMIN_PASSWORD=YOUR_PRIVATE_PASSWORD `
  ADMIN_JWT_SECRET=YOUR_LONG_RANDOM_SECRET `
  AZURE_SQL_CONNECTION_STRING="YOUR_PRIVATE_CONNECTION_STRING"
