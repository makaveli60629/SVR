# SVR Poker — Phase 422 AWS Staging Deployment Contract

## Goal

Create an isolated AWS staging environment that can validate player accounts, tournament services, backend health, WebSocket/game-server work, logs, and rollback without changing `svrpoker.com` or the current Phase 420/421 production game.

## Required isolation

Use the environment name `staging` for all stacks/resources. Production and staging must never share:

- Cognito user pools or app clients;
- DynamoDB tables;
- API Gateway stages/domains;
- Lambda environment secrets;
- WebSocket/game-server endpoints;
- CloudWatch log groups/alarms;
- Stripe secret keys/webhook secrets;
- Webex tokens;
- SQL credentials;
- admin/JWT secrets;
- Android signing material.

## Existing reusable foundation

`infrastructure/aws/phase372-player-account-foundation.yml` is parameterized with `EnvironmentName`. Deploying it with `staging` creates isolated staging Cognito/profile/session resources without changing production resources.

Recommended stack names:

- `svr-staging-player-foundation`
- `svr-staging-api`
- `svr-staging-game-authority` (future server-authoritative poker)

## Deployment order

1. Deploy `phase372-player-account-foundation.yml` with `EnvironmentName=staging`.
2. Store staging-only backend values in AWS Secrets Manager / encrypted Lambda environment references.
3. Deploy the staging API behind a staging-only API Gateway endpoint.
4. Deploy the future WebSocket/game-authority service to a staging-only endpoint.
5. Route Lambda/API/WebSocket logs to staging-only CloudWatch log groups with retention configured.
6. Run `/api/health` and account/tournament smoke tests against staging.
7. Run server-authoritative poker simulations before any production endpoint is enabled.
8. Only after all staging gates pass, deploy equivalent production infrastructure and update the public JSON configs with verified production URLs.

## Public-site protection

Do **not** write a staging API URL into:

- `site/config/player-api.json`
- `game/config/tournament-api.json`
- `game/android.html`
- `game/iphone.html`
- `game/quest.html`

Use local/staging test configuration outside the production static tree or an explicitly staging-only host/build.

## Health acceptance

Staging is not considered healthy until all applicable checks return verified results:

- backend process health: OK;
- database connectivity: verified;
- Cognito account flow: register/verify/login/logout verified;
- player profile read/write verified;
- tournament register/unregister/roster verified;
- WebSocket reconnect verified when the game-authority service exists;
- CloudWatch logs contain timestamps/request IDs and no secrets;
- failure tests return non-200 safe errors;
- production static pages remain unchanged.

## Rollback

Application rollback:

1. Keep the current known-good production `main`/`gh-pages` release unchanged.
2. Roll back only the staging Lambda/API/game-server version or alias.
3. Preserve staging logs for diagnosis.
4. Never roll a rotated/compromised secret backward.
5. DynamoDB/Cognito resources use retention/deletion-protection policies; do not destroy player data as part of application rollback.

Production promotion:

- promote immutable tested artifacts/configuration from staging;
- do not copy staging secrets into production;
- verify production health before changing public `apiBase` values;
- if production health fails, restore the previous application artifact/config while keeping any newly rotated secrets.

## Current blocker

The connected GitHub integration cannot list repository secret names (403) and no AWS deployment connector is available in the current toolset. Therefore this phase can define and validate the staging contract in source, but it cannot truthfully claim that a staging AWS endpoint exists yet.
