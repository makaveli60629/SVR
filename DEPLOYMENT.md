# Deployment Guide for Scarlett VR Poker

This guide covers deployment, hosting, monitoring, and maintenance of the SVR platform.

## 🚀 GitHub Pages Deployment

SVR is configured for automatic GitHub Pages deployment.

### Current Setup

- **Repository**: makaveli60629/SVR
- **Branch**: `main` (automatically deployed)
- **URL**: https://makaveli60629.github.io/SVR
- **Custom Domain**: Configured via `CNAME`
- **HTTPS**: Enabled automatically

### How It Works

1. Push to `main` branch
2. GitHub Actions workflow triggers (if configured)
3. Files sync to `gh-pages` branch
4. Site updates automatically at public URL

### Enabling Auto-Deploy

If not already configured, enable in GitHub:

1. Repository Settings → Pages
2. Select "main" as source branch
3. Select root folder
4. Save

## 🔄 Deployment Workflow

### Development → Production

```
Feature Branch
     ↓
Local Testing
     ↓
Create Pull Request
     ↓
Code Review
     ↓
Merge to main
     ↓
Auto-Deploy to GitHub Pages
     ↓
Live on https://makaveli60629.github.io/SVR
```

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors in desktop mode
- [ ] VR mode tested in supported browser
- [ ] Assets load correctly
- [ ] Performance acceptable (60 FPS)
- [ ] Responsive design verified on mobile
- [ ] Documentation updated
- [ ] Version number bumped (if applicable)
- [ ] CHANGELOG updated

### Deployment Commands

```bash
# 1. Ensure clean working directory
git status

# 2. Create deployment branch
git checkout -b deploy/v1.0.0

# 3. Make final fixes if needed
git add .
git commit -m "chore: Final pre-release fixes"

# 4. Merge to main
git checkout main
git merge deploy/v1.0.0

# 5. Push to trigger deployment
git push origin main

# 6. Verify deployment
curl https://makaveli60629.github.io/SVR
```

## 🌐 Custom Domain Configuration

### Setup

1. **Update CNAME file**
   ```
   yourdomain.com
   ```

2. **Update DNS records** at your domain provider:
   ```
   CNAME → makaveli60629.github.io
   ```

3. **Verify in GitHub**
   - Settings → Pages
   - Wait for SSL certificate generation

4. **Test**
   ```bash
   curl https://yourdomain.com
   ```

### HTTPS Enforcement

Automatic with GitHub Pages. Edit `.github/workflows/pages.yml` if needed:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/upload-pages-artifact@v1
        with:
          path: '.'
      - uses: actions/deploy-pages@v1
```

## 🔍 Monitoring

### Website Uptime

- **Status Page**: https://status.github.com
- **Monitor Service**: Use UptimeRobot or StatusCake
- **Custom Monitoring**: 
  ```bash
  # Add cron job
  */5 * * * * curl -f https://makaveli60629.github.io/SVR || alert
  ```

### Performance Monitoring

#### Lighthouse Scoring

```bash
# Run Lighthouse audit
npm install -g lighthouse

lighthouse https://makaveli60629.github.io/SVR --view
```

**Target Scores**:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

#### Real User Monitoring

Add to `index.html`:

```javascript
// Google Analytics
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID', {
    'page_path': window.location.pathname,
    'anonymize_ip': true
  });
</script>

// Web Vitals
<script>
  web.vitals.getCLS(metric => console.log('CLS:', metric.value));
  web.vitals.getFID(metric => console.log('FID:', metric.value));
  web.vitals.getFCP(metric => console.log('FCP:', metric.value));
</script>
```

### Error Tracking

Use Sentry for error monitoring:

```javascript
// Add to every page
<script src="https://browser.sentry-cdn.com/7.0.0/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: "production",
    tracesSampleRate: 0.1,
  });
</script>
```

## 🛠️ Maintenance

### Regular Maintenance Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| Dependency updates | Monthly | Update npm packages |
| Security audit | Monthly | Check for vulnerabilities |
| Performance review | Quarterly | Analyze metrics |
| Backup | Weekly | Version control serves as backup |
| Documentation | As needed | Update as features change |

### Updating Dependencies (Future Backend)

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update major versions
npm upgrade

# Install security updates only
npm audit fix
```

### Database Maintenance (Future)

```bash
# Backup production database
pg_dump production_db > backup_$(date +%Y%m%d).sql

# Verify backup
pg_restore -l backup_20260506.sql | head

# Test restore
createdb test_db
pg_restore -d test_db backup_20260506.sql
```

## 🔐 Security Checklist

### Before Each Release

- [ ] No API keys in code
- [ ] No secrets in commits
- [ ] Dependencies vulnerability checked
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Input validation in place
- [ ] Rate limiting configured (if applicable)

### Ongoing

```bash
# Check for security issues
npm audit

# Run security scan
snyk test

# Update security patches
npm audit fix --audit-level=moderate
```

## 📊 Backup & Recovery

### Backup Strategy

GitHub automatically maintains backup of your repository:

```bash
# Clone entire repository (includes history)
git clone --mirror https://github.com/makaveli60629/SVR.git svr-backup.git

# Schedule automatic backups
# Add to crontab:
0 0 * * 0 git clone --mirror https://github.com/makaveli60629/SVR.git /backups/svr-$(date +\%Y\%m\%d).git
```

### Recovery Procedures

#### Rollback to Previous Version

```bash
# Find commit to rollback to
git log --oneline | head -20

# Revert specific commit
git revert abc1234

# Or reset to previous state (careful!)
git reset --hard HEAD~1
git push --force-with-lease origin main
```

#### Restore from GitHub Pages Backup

GitHub Pages stores all published versions:

```bash
# Access Wayback Machine
https://web.archive.org/web/*/makaveli60629.github.io/SVR/

# Or use GitHub's API
curl https://api.github.com/repos/makaveli60629/SVR/deployments
```

## 🚨 Incident Response

### Critical Issue Response

1. **Identify Issue**
   - Check error monitoring (Sentry, etc.)
   - Review recent commits
   - Test in multiple browsers

2. **Communicate**
   - Update status page
   - Post GitHub issue
   - Notify users if applicable

3. **Fix & Deploy**
   ```bash
   git checkout main
   git pull
   # Fix issue
   git commit -m "fix: Critical issue #123"
   git push origin main
   ```

4. **Verify Fix**
   - Test in staging if available
   - Monitor error rate
   - Get user confirmation

5. **Post-Mortem**
   - Document what happened
   - Identify root cause
   - Plan prevention

### Performance Issues

```bash
# Analyze slow page loads
lighthouse https://makaveli60629.github.io/SVR --view

# Check asset sizes
du -sh game/assets/*
du -sh site/*

# Optimize images
find . -name "*.png" -exec pngquant --ext .png -f 256 {} \;
```

## 📈 Performance Optimization

### Asset Optimization

```bash
# Compress images
imagemin game/assets/textures/*.png --out-dir=game/assets/textures

# Minify CSS
cssnano style.css -o style.min.css

# Minify JavaScript
terser matrix.js -o matrix.min.js -c -m
```

### Caching Strategy

Add to `.htaccess` or web server config:

```apache
# Cache static assets for 1 year
<FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js|svg)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Don't cache HTML
<FilesMatch "\.html$">
  Header set Cache-Control "max-age=3600, public"
</FilesMatch>
```

### CDN Delivery (Future)

```html
<!-- Use CDN for large dependencies -->
<script src="https://cdn.jsdelivr.net/npm/aframe@1.4.2/dist/aframe-min.js"></script>

<!-- Serve assets from CDN -->
<img src="https://cdn.yoursite.com/game/assets/logo.png">
```

## 📝 Deployment Logs

### Enable Logging

```javascript
// Add to index.html
<script>
  // Log page loads
  console.log('SVR loaded at', new Date().toISOString());
  console.log('User Agent:', navigator.userAgent);
  console.log('VR Support:', !!navigator.xr);
  
  // Log errors
  window.addEventListener('error', (e) => {
    console.error('Error:', e.message, e.filename, e.lineno);
  });
  
  // Log performance
  window.addEventListener('load', () => {
    const perf = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', perf.loadEventEnd - perf.fetchStart, 'ms');
  });
</script>
```

### View Deployment History

```bash
# Show recent deployments
git log --oneline -10

# See deployment timeline
git log --graph --oneline --all

# Find tag history
git tag -l

# View specific deployment
git show v1.0.0
```

## 🎯 Deployment Best Practices

1. **Atomic Changes** - Deploy complete features, not partial work
2. **Blue-Green Deployment** - Keep old version available during deploy
3. **Feature Flags** - Use toggles to control new features
4. **Gradual Rollout** - Release to subset of users first
5. **Automated Tests** - Run before deployment
6. **Monitoring** - Watch metrics after each deploy
7. **Quick Rollback** - Always keep previous version easily accessible
8. **Documentation** - Keep deployment docs current

## 🔗 Useful Commands

```bash
# Quick status check
git status && npm audit && npm test

# Deploy current branch
git push origin main

# View deployment history
gh run list

# Download artifact
gh run download <run-id> -n pages

# Trigger workflow manually
gh workflow run deploy.yml
```

---

**Last Updated**: 2026-05-06
