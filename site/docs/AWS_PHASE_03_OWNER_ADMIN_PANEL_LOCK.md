# AWS Phase 03 — Owner Admin Panel Lock

Adds a private owner-facing static page:

```text
/site/owner.html
```

The page calls the live AWS API:

```text
https://api.svrpoker.com
```

## Included

- Owner login
- Admin Online / Offline controls
- Public message viewer
- API health link
- Public site link

## Security notes

- No API secrets are stored in the page.
- No database password is exposed.
- The owner password is submitted only to the HTTPS API login endpoint.
- The admin token is kept in memory only and clears on refresh/logout.
- Page uses `noindex,nofollow` and is not linked publicly by this patch.

## Protected

- `/game`
- `api/server.js`
- `site-public-hooks.js`
- root public Matrix page
