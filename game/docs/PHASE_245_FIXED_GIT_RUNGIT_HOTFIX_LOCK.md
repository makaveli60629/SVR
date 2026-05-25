# PHASE-245-FIXED-GIT-RUNGIT-HOTFIX-LOCK

Fixes the failed PowerShell hotfix runner.

Root cause:
- The prior script used a RunGit function with an Args parameter.
- PowerShell invoked git with no arguments, so git printed the help screen and the script threw git failed:.

Direct fixes:
- Uses Run-GitSafe with GitArgs.
- Refuses to call git with empty arguments.
- Keeps main.js PHASE.build fix locked.
- Bumps cache to phase245.
- Public Matrix page untouched.
