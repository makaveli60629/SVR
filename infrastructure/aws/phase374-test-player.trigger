PHASE-374-TEST-PLAYER-AVATAR-LOCK

This marker triggers the protected, idempotent Cognito/DynamoDB test-player workflow after merge.

Required protected repository secrets:
- AWS_ROLE_TO_ASSUME
- AWS_REGION
- SVR_COGNITO_USER_POOL_ID
- SVR_TEST_ACCOUNT_PASSWORD

Optional protected repository secrets:
- SVR_TEST_ACCOUNT_EMAIL
- SVR_PLAYER_PROFILES_TABLE

No credentials are stored in this repository.
