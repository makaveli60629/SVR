# SVR Original Public Page + Safe Site Restore

This package restores the uploaded original public landing page while preserving the safer interior `/site/` pages from the previous safe rollback backup.

## Locked rules
- Root `index.html` uses the uploaded original public page.
- Root `css/style.css` uses the uploaded original public CSS.
- Root `js/matrix.js` uses the uploaded original Matrix code.
- `/site/` pages are restored from the safe rollback backup.
- `/site/` pages use `css/site-style.css` so they do not overwrite the original public page CSS.
- `js/site-public-hooks.js` is included for admin/message safe local mode.
- No `/game` folder is included or touched.

## Files restored
- index.html
- css/style.css
- css/site-style.css
- js/matrix.js
- js/site-public-hooks.js
- img/logo.png
- site/
