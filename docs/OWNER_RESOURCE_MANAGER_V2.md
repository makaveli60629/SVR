# SVR Resource Manager v2

Owner-only UI: `/site/owner.html`.

## Added
- Rename/display-name metadata without changing the original uploaded filename.
- Edit category and owner notes.
- Archive resources without deleting the S3 object.
- Assign ready resources to live game slots.
- View current slot assignments.
- Public same-origin runtime manifest for assigned resources only.

## Assignment target types
- dealer
- avatar-male
- avatar-female
- poker-table
- lobby-environment
- prop
- animation
- texture

Each target uses a key such as `primary`, `deal-left`, `felt-main`, or another stable game slot.

## Runtime endpoint
`GET /api/game/resources/manifest`

The runtime response includes only ready, non-archived, assigned resources. Each object receives a short-lived private S3 GET URL. The S3 bucket remains private.

## Security
All mutation/list management routes require the existing owner JWT. Only the runtime manifest is public to the SVR web origin through the API CORS policy. No AWS credentials are exposed to the browser.

## Activation dependency
The existing S3 environment configuration from `OWNER_RESOURCE_UPLOADER_AWS_S3_V1.md` must be configured and the API redeployed before upload/runtime URLs can function.
