# Phase 101P - Backend Admin Presence Endpoint Stub / Cross-Device Sync

## Purpose

Move admin presence from local-only browser state toward backend-backed cross-device sync.

## Findings

The active API server already includes these routes:

```text
POST /api/admin/login
POST /api/admin/online
GET  /api/admin/status
```

The problem was not the absence of all backend support. The problem was the owner panel did not store the JWT returned from `POST /api/admin/login`, and then tried to sync presence through endpoint aliases that were not the active backend contract.

## Patch applied

### Updated owner panel

File:

```text
site/owner.html
```

New behavior:

- Stores admin token returned by `POST /api/admin/login`.
- Adds token as `Authorization: Bearer <token>` for admin API calls.
- `Set Admin Online` and `Set Admin Offline` now try backend sync through:

```text
POST /api/admin/online
```

- If backend sync fails, local bridge still updates same-browser public status.
- `Log Out` clears local admin session/token and sets admin offline.
- Owner panel shows whether API token is connected.

## Current active backend contract

### Login

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "owner email",
  "password": "owner password"
}
```

Expected response:

```json
{
  "ok": true,
  "token": "jwt-token",
  "admin": {
    "email": "owner email",
    "displayName": "King",
    "isOnline": true
  }
}
```

### Set admin presence

```http
POST /api/admin/online
Authorization: Bearer <token>
Content-Type: application/json

{
  "isOnline": false
}
```

or:

```json
{
  "isOnline": true
}
```

### Read public admin status

```http
GET /api/admin/status
```

Expected response:

```json
{
  "ok": true,
  "isOnline": false,
  "displayName": "King",
  "statusText": "Admin Offline",
  "source": "database"
}
```

## Optional alias endpoints for later backend wiring

If desired later, add aliases:

```text
POST /api/admin/presence -> same behavior as POST /api/admin/online
POST /api/admin/status   -> same behavior as POST /api/admin/online
```

The owner panel already tries these aliases after `/api/admin/online`, but `/api/admin/online` is the active source of truth.

## Validation

1. Open owner panel:

```text
https://svrpoker.com/site/owner.html?v=phase101p-backend-sync
```

2. Log in with owner credentials.

Expected:

```text
API token: connected
```

3. Click:

```text
Set Admin Offline
```

Expected control note:

```text
Admin Offline set locally and synced through /api/admin/online.
```

4. Open public page in a different browser/device:

```text
https://svrpoker.com/?v=phase101p-admin-sync
```

Expected:

```text
ADMIN OFFLINE
```

5. Click:

```text
Set Admin Online
```

Expected on public page after refresh:

```text
ADMIN ONLINE
```

## Console checks

Owner panel:

```text
window.SVR_OWNER_ADMIN_PANEL
window.SVR_OWNER_ADMIN_PRESENCE_SYNC
localStorage.getItem('SVR_ADMIN_TOKEN')
```

Public page:

```text
window.SVR_ADMIN_PRESENCE
```

## Locked rule

This phase changes admin/backend presence sync only. It does not touch the game scene, Quest movement, Android movement, sponsor modules, or Unity logic.

## Commit name

```text
Phase 101P - Backend Admin Presence Sync Through Active API Contract
```
