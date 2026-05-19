# SVR Poker — Gameplay + SQL Manifest Lock

_Last updated: 2026-05-19_

## Purpose

This manifest locks the next critical SVR Poker direction across two separate tracks:

1. **Game-side Scorpion poker gameplay**
2. **Website/backend SQL architecture**

These tracks must remain separate unless explicitly approved. Game-side work must not modify the website/site baseline. Website/backend work must not modify the game runtime.

---

# 1. Hard Separation Rules

## Game track

- Game-side only when working in the game chat.
- Do not touch website/site files from the game track.
- Do not redesign or replace the locked lobby.
- Scorpion poker gameplay is the priority.
- Keep the game package under 25 MB.
- Preserve Quest/Oculus controller fallback and Meta hand tracking.

## Website/backend track

- Website/site baseline remains locked unless explicitly working in the site track.
- GitHub Pages is static and must not connect directly to Azure SQL.
- All database writes must go through a secure backend API.
- Never expose SQL, Stripe, API, admin, JWT, or connection-string secrets in frontend files.

---

# 2. Scorpion Room Poker Gameplay Lock

## Core goal

The Scorpion Room must feel like a real seated VR poker table. The room is atmosphere; the table is the game board.

## Table reality lock

Required:

- Real-looking flat poker chips.
- No sideways chips.
- Chips stacked flat on the felt.
- Visible chip denominations:
  - `$1`
  - `$5`
  - `$25`
  - `$100`
  - `$500`
- Centered SVR logo embedded into the table felt.
- Real curved pass/bet line.
- Player chip area outside/behind the pass line.
- Bets and pot inside the pass line.
- Pot pile clearly visible in the center.
- Winner pot vacuum/sweep animation to the winner stack.
- Winner stack visibly grows after payout.

## Card readability lock

Cards must be readable from a seated VR position.

Required:

- Bigger card numbers.
- Bigger suit symbols.
- High-contrast ranks and suits.
- Community cards raised slightly above felt.
- Player hole cards angled toward the seated player.
- Winning cards highlighted at showdown.
- Winner hand name displayed clearly.

Example display:

```text
WINNER: PLAYER
HAND: FLUSH — ACE HIGH
POT: 520
```

## Deal direction lock

Permanent rule:

```text
All poker hands deal left-to-right from the dealer button.
Never deal right-to-left.
```

Required:

- Dealer button rotates each hand.
- Deal starts left of the dealer button.
- Cards continue left-to-right around the table.
- No future phase may reverse the dealing direction.

---

# 3. Player Turn + Timer Lock

## Player turn notice

When it is the player’s turn, show clear notices on both the table and watch.

Example:

```text
YOUR TURN — 20
CALL 40 • RAISE • FOLD
```

Required indicators:

- Table glow at player seat.
- Floating “YOUR TURN” notice above player card area.
- Watch alert.
- Correct call amount.
- Pot amount.
- Player stack amount.
- Countdown timer.
- Optional audio cue.
- Active seat glow.
- Next-to-act indicator.

## 20-second action timer

Required behavior:

| Situation | Result |
|---|---|
| Player turn starts | 20-second countdown begins |
| Player acts | Timer clears |
| No bet facing player | Timeout = auto-check |
| Bet facing player | Timeout = auto-fold |
| Last 5 seconds | Warning pulse |
| Bot turn | Fast 1–2 second decision |

Important lock:

```text
If facing a bet and no action is taken after 20 seconds, auto-fold.
If checking is legal and no action is taken after 20 seconds, auto-check.
```

This prevents stalled tables and protects player flow.

---

# 4. Auto Bet Tray Lock

The player must not have to search for chips just to call.

Required:

- Correct call amount is automatically staged.
- CALL sends the prepared chips into the pot.
- CHECK checks automatically when legal.
- FOLD mucks cards.
- RAISE opens raise controls.
- Manual chip grabbing is optional for raises and immersion only.

## Raise panel

```text
RAISE TO:
+10   +25   +50   +100   ALL-IN
CONFIRM
CANCEL
```

Also display:

```text
To Call: 40
Pot: 180
Your Stack: 960
Minimum Raise: 80
```

## Legal action lock

Only show legal actions.

| Situation | Buttons shown |
|---|---|
| No bet | Check / Bet / Fold |
| Facing bet | Call / Raise / Fold |
| All-in | Waiting |
| Hand ended | Next Hand |

---

# 5. Winner Reveal Lock

At showdown:

1. Reveal/flip cards.
2. Highlight winning cards.
3. Display winner name.
4. Display winning hand.
5. Show pot amount.
6. Vacuum/sweep pot chips to winner stack.
7. Increase winner chip pile.
8. Update hand history.
9. Show Next Hand prompt.

Required banner format:

```text
WINNER: PLAYER
HAND: TWO PAIR — KINGS AND QUEENS
POT: 520
```

---

# 6. Hand History + Table Feedback

Add a small hand/action history strip near the table.

Examples:

```text
Bot 2 calls 20
You raise to 60
Bot 4 folds
Flop dealt
Player wins 520 with Flush
```

Also add:

- Current pot label.
- Player stack labels.
- Bot stack labels.
- Last action text.
- Active player glow.
- Muck pile for folded cards.
- Burn card slot for authenticity.

---

# 7. GLB / VRM Avatar Motion Lock

Current procedural bots are not the final high-end avatar target.

Future table avatars should use optimized GLB/VRM-style seated avatars instead of heavy raw FBX payloads.

Required avatar behavior:

- Seated idle breathing.
- Subtle head movement.
- Look toward active player.
- Card peek motion.
- Chip reach motion.
- Fold motion.
- Win reaction.
- Lose reaction.
- No T-pose.
- Fallback procedural bot if GLB fails.

Suggested module:

```text
game/modules/avatar_seated_controller.js
```

The avatar system must never crash the poker table if an avatar asset is missing.

---

# 8. Recommended Game Modules

Add or lock these modules:

```text
game/modules/poker_turn_indicator.js
game/modules/bet_tray.js
game/modules/chip_flow.js
game/modules/winner_reveal.js
game/modules/avatar_seated_controller.js
game/modules/poker_timer.js
game/modules/card_readability.js
```

| Module | Purpose |
|---|---|
| `poker_turn_indicator.js` | YOUR TURN, active glow, next-to-act, timer notice |
| `bet_tray.js` | Auto-staged call chips and raise controls |
| `chip_flow.js` | Stack → bet line → pot → winner |
| `winner_reveal.js` | Winner banner, hand name, card highlight |
| `avatar_seated_controller.js` | GLB seated avatar motion |
| `poker_timer.js` | 20-second action timer |
| `card_readability.js` | Bigger rank/suit rendering |

---

# 9. Game Phase Order

```text
Phase 84 — Scorpion Poker Table Reality Lock
Phase 85 — Turn Timer + Auto Bet Tray Lock
Phase 86 — GLB Avatar Motion Lock
Phase 87 — Full Poker Logic Lock
```

## Phase 84 must include

- Fix sideways chips.
- Make chips flat and stacked.
- Improve chip denominations.
- Lock table SVR logo.
- Make pass/bet line look real.
- Improve seated card visibility.
- Add winner banner.
- Show winning hand.
- Pot vacuum to winner stack.

## Phase 85 must include

- Bigger card ranks/suits.
- Left-to-right dealing enforcement.
- 20-second action timer.
- Auto-check when legal.
- Auto-fold when facing a bet.
- Auto-staged call amount.
- Watch/table turn indicators.
- Active seat glow.
- Hand history strip.

## Phase 86 must include

- GLB/VRM seated avatars.
- Idle, card peek, chip reach, fold, win/lose reactions.
- No T-pose fallback.
- Lightweight optimized assets.

## Phase 87 must include

- Full hand evaluator.
- Bot decision logic.
- Correct chip accounting.
- Winner correctness.
- All-in and side-pot groundwork.

---

# 10. Website + SQL Database Architecture Lock

## Core website/database rule

The website is static on GitHub Pages. It must call a backend API before touching Azure SQL.

Correct architecture:

```text
GitHub Pages Website
        ↓
Secure Backend API
        ↓
Azure SQL Database
```

Do not put these in frontend code:

- SQL passwords.
- Azure connection strings.
- Stripe secret keys.
- Admin passwords.
- JWT secrets.
- Private API keys.

## Recommended backend host

Preferred:

```text
Azure App Service + Node.js Express API
```

Acceptable:

```text
Azure Functions
```

For SVR, Azure App Service is preferred because the platform needs admin, store, messages, analytics, sponsorship, membership, and future game account integration.

---

# 11. Required API Endpoints

## Core endpoints

```text
GET  /api/health
POST /api/messages
GET  /api/admin/status
POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/messages
POST /api/admin/messages/:id/read
GET  /api/store/products
POST /api/sponsorship/inquiry
POST /api/membership/signup
POST /api/donations/support
POST /api/analytics/event
GET  /api/admin/analytics
```

## Future game endpoints

```text
POST /api/game/session/start
POST /api/game/session/end
POST /api/game/hand/result
GET  /api/game/player/profile
POST /api/game/player/update
GET  /api/game/store/inventory
```

---

# 12. SQL Tables Needed

## Minimum launch tables

```sql
CREATE TABLE SiteMessages (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(100) NULL,
  Email NVARCHAR(255) NULL,
  Message NVARCHAR(MAX) NOT NULL,
  Source NVARCHAR(50) DEFAULT 'public_site',
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
  IsRead BIT DEFAULT 0
);

CREATE TABLE AdminStatus (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  AdminName NVARCHAR(100) NOT NULL,
  IsOnline BIT DEFAULT 0,
  LastSeen DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE StoreProducts (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(150) NOT NULL,
  Description NVARCHAR(MAX) NULL,
  PriceCents INT NOT NULL,
  StripePriceId NVARCHAR(255) NULL,
  Category NVARCHAR(100) NULL,
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE AdminLogs (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Action NVARCHAR(255) NOT NULL,
  Details NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

## Sponsorship inquiries

```sql
CREATE TABLE SponsorshipInquiries (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  CompanyName NVARCHAR(150) NULL,
  ContactName NVARCHAR(150) NULL,
  Email NVARCHAR(255) NOT NULL,
  Phone NVARCHAR(50) NULL,
  InterestArea NVARCHAR(100) NULL,
  Message NVARCHAR(MAX) NULL,
  Status NVARCHAR(50) DEFAULT 'new',
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

## Membership signups

```sql
CREATE TABLE MembershipSignups (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  DisplayName NVARCHAR(100) NULL,
  Email NVARCHAR(255) NOT NULL,
  RequestedTier NVARCHAR(50) NULL,
  Source NVARCHAR(50) DEFAULT 'website',
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

## Support donations

```sql
CREATE TABLE SupportDonations (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  SupportType NVARCHAR(50) DEFAULT 'cashapp',
  AmountCents INT NULL,
  ExternalReference NVARCHAR(255) NULL,
  Note NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

## Analytics events

```sql
CREATE TABLE AnalyticsEvents (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  EventName NVARCHAR(150) NOT NULL,
  PagePath NVARCHAR(255) NULL,
  SessionId NVARCHAR(100) NULL,
  UserAgent NVARCHAR(500) NULL,
  Metadata NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

## Future game hand results

```sql
CREATE TABLE GameHandResults (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  SessionId NVARCHAR(100) NULL,
  TableName NVARCHAR(100) NULL,
  WinnerName NVARCHAR(100) NULL,
  WinningHand NVARCHAR(100) NULL,
  PotAmount INT NULL,
  HandJson NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

---

# 13. Azure App Settings Required

These must be stored only in Azure App Service Configuration:

```text
NODE_ENV=production
ALLOWED_ORIGIN=https://svrpoker.com

AZURE_SQL_CONNECTION_STRING=
ADMIN_EMAIL=
ADMIN_DISPLAY_NAME=King
ADMIN_PASSWORD=
ADMIN_JWT_SECRET=

STORE_CHECKOUT_ENABLED=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Keep checkout disabled until approved:

```text
STORE_CHECKOUT_ENABLED=false
```

---

# 14. Website Pages and Database Mapping

| Page | Database connection |
|---|---|
| Contact | `SiteMessages` |
| Sponsorship | `SponsorshipInquiries` |
| Membership | `MembershipSignups` |
| Store | `StoreProducts` |
| Donate / Help Expand | `SupportDonations` later |
| Admin Preview | Admin login/status later |
| Updates | Static first, database later |
| Impact | Static first, database later |

---

# 15. Admin Dashboard Needs

Admin dashboard should eventually show:

- Admin online/offline toggle.
- Public messages.
- Sponsorship inquiries.
- Membership requests.
- Store products.
- Donation/support log.
- Analytics events.
- Game session stats.
- Hand history.
- Crash/error logs.
- Moderation tools.

---

# 16. Website / Backend Phase Order

```text
Website SQL Phase 01 — Backend Health + SQL Connection
Website SQL Phase 02 — Admin Login + Online Status
Website SQL Phase 03 — Messages + Sponsorship Forms
Website SQL Phase 04 — Store Products Table
Website SQL Phase 05 — Analytics Events
Website SQL Phase 06 — Game Account / Session Bridge
```

---

# 17. Immediate Website / Database Checklist

1. Confirm Azure SQL connection string works locally.
2. Run base SQL schema.
3. Add sponsorship, membership, support, analytics, and game-hand tables.
4. Deploy backend API to Azure App Service.
5. Set Azure environment variables.
6. Test:
   - `/api/health`
   - `/api/messages`
   - `/api/admin/status`
7. Connect public forms to API.
8. Keep secrets out of GitHub and frontend files.

---

# 18. Locked Summary

## Game

Scorpion poker must become a real seated VR poker table with readable cards, correct left-to-right dealing, real chip flow, 20-second action timer, auto-staged call amount, legal action buttons, winner reveal, pot vacuum, and later GLB seated avatars.

## Website / SQL

The website must use a secure backend API between GitHub Pages and Azure SQL. All secrets stay in Azure settings. SQL must support admin, messages, sponsorship, membership, store, donations/support, analytics, logs, and future game/account integration.
