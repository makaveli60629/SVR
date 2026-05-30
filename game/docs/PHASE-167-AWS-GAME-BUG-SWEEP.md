# PHASE-167-AWS-GAME-BUG-SWEEP

## Infrastructure rule

SVR website/backend planning is AWS-first. Do not describe Azure as the current deployment/database plan unless the owner explicitly changes the infrastructure direction.

Current rule:

- Frontend can remain static/GitHub Pages during development.
- Production backend target is AWS.
- Use AWS API Gateway or AWS App Runner/Lambda for backend APIs.
- Use Amazon RDS/PostgreSQL or Aurora PostgreSQL for relational data.
- Use S3/CloudFront for static media and sponsor assets when moved off GitHub.
- Never expose database passwords, Stripe keys, AWS credentials, admin tokens, or private API keys in frontend code.

## Game bug sweep scope

Phase 167 keeps the game track separate from website work and applies a lobby-side cleanup layer:

- Cache-bump lobby to Phase 167.
- Keep Phase 164 camera-forward teleport wrapper active.
- Keep Phase 166 higher Moon/Mars modules active.
- Add Phase 167 floor cleanup to reduce black blinking/z-fighting.
- Compact table/seat tags so they are smaller and less overlapping.
- Add Quest-friendly renderer tuning.

## Locked constraints preserved

- Do not touch public Matrix launch page unless specifically requested.
- Keep site and game tracks separate.
- Reiki live branding remains SVR placeholder / AWAITING APPROVAL only.
- Portal/private-room routing remains intact.
