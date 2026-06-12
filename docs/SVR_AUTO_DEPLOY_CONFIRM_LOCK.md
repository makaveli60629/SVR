# SVR Auto Deploy Confirm Lock

## What this does

This installs a GitHub Pages workflow where deployment can happen two ways:

1. **Automatic deploy on push to `main`**
2. **Manual confirm deploy from GitHub Actions**

## Manual confirm button

Open:

```text
https://github.com/makaveli60629/SVR/actions/workflows/deploy.yml
```

Then press:

```text
Run workflow â†’ main â†’ Run workflow
```

The workflow includes a confirmation field. Leave it as `YES`.

## Test after deploy

```text
https://svrpoker.com/deploy-health.json
https://svrpoker.com/reiki/
https://svrpoker.com/android/
https://svrpoker.com/site/presentations/reiki/
https://svrpoker.com/site/android/
```

## Rule

The assistant cannot permanently hold GitHub access if the GitHub connector is disabled. This local script keeps the workflow ready so you only need to confirm the run in GitHub.
