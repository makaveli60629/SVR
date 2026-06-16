# Phase 101O - Admin Presence API/Button Logic Audit

## Purpose

Fix the admin online/offline logic so the public page follows the owner/admin panel correctly.

## Reported bug

The admin panel could be set offline, but the public page still showed `ADMIN ONLINE`.

## Root causes found

### Owner panel bug

`site/owner.html` defaulted missing admin localStorage to online:

```text
localStorage.getItem(LOCAL_ADMIN_KEY) !== 'offline'
```

That means missing/null state became online.

The Logout button also only changed the login note. It did not clear presence and did not set admin offline.

### Public page bridge issue

`site-public-hooks.js` was hardened in Phase 101N to avoid stale localStorage, but that also meant the public page no longer followed the admin panel's local offline button.

## Patch applied

### Updated owner panel

File:

```text
site/owner.html
```

New behavior:

- Missing admin presence defaults offline.
- `Set Admin Online` writes a fresh presence payload.
- `Set Admin Offline` writes a fresh offline payload.
- `Log Out` clears the admin session and sets admin offline.
- `Log In` sets admin online after owner login/local owner mode.
- Buttons still try to sync live API routes.
- If API routes are unavailable, local/public bridge still works.

Fresh bridge keys:

```text
svr_admin_presence
svr_admin_presence_payload
```

Payload shape:

```json
{
  "state": "online|offline",
  "isOnline": true,
  "source": "owner-panel",
  "updatedAt": "ISO date",
  "expiresAt": "ISO date",
  "build": "PHASE-101O-OWNER-ADMIN-PRESENCE-BRIDGE-LOCK"
}
```

### Updated public page logic

File:

```text
site-public-hooks.js
```

New behavior:

- Public page checks `svr_admin_presence_payload` first.
- It only trusts the payload while fresh.
- Fresh owner-panel offline overrides stale API or old local state.
- If no fresh owner-panel payload exists, public defaults offline.
- API fallback still stays offline if API is unreachable.

## Console checks

On owner/admin page:

```text
window.SVR_OWNER_ADMIN_PANEL
window.SVR_OWNER_ADMIN_PRESENCE
window.SVR_OWNER_ADMIN_PRESENCE_SYNC
```

On public page:

```text
window.SVR_ADMIN_PRESENCE
localStorage.getItem('svr_admin_presence')
JSON.parse(localStorage.getItem('svr_admin_presence_payload'))
```

## Manual validation

1. Open owner panel:

```text
https://svrpoker.com/site/owner.html?v=phase101o-admin-bridge
```

2. Click:

```text
Set Admin Offline
```

3. Open public page:

```text
https://svrpoker.com/?v=phase101o-admin-check
```

Expected:

```text
ADMIN OFFLINE
```

4. Click `Set Admin Online` in owner panel.
5. Reload public page.

Expected:

```text
ADMIN ONLINE
```

6. Click `Log Out` in owner panel.
7. Reload public page.

Expected:

```text
ADMIN OFFLINE
```

## API behavior

The owner panel tries to sync:

```text
POST /api/admin/status
POST /api/admin/presence
```

If those routes are not connected yet, it still updates the local bridge so public/admin buttons work in the current browser.

## Locked rule

This phase only fixes admin/API/button logic. It does not touch game geometry, Quest movement, Android movement, sponsor modules, or Unity logic.

## Commit name

```text
Phase 101O - Admin Presence API Button Logic Audit and Public Sync Fix
```
