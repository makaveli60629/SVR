# SVR Poker Phase 373 Production Deploy Trigger

This marker triggers the single production publisher after PR #155 merged.

- Merged recovery commit: `1c74117c5698536f30878058ea08ea998fdfcf9c`
- Android route: `/game/android.html?channel=stable&v=phase372`
- Quest/Oculus route: `/game/index.html?platform=quest&v=phase373`
- Database provider: AWS
- Identity: Cognito
- Profiles and sessions: DynamoDB
- Publisher: `.github/workflows/deploy.yml`
- Publish branch: `gh-pages`

Production completion requires `deploy-health.json` on `gh-pages` and `svrpoker.com` to identify this trigger commit.