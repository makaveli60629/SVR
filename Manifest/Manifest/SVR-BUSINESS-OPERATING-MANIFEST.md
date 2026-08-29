# SVR Poker — Business Operating Manifest

**Build:** `PHASE-423-PROFESSIONAL-MODULAR-BUSINESS-UNITY-READINESS-LOCK`  
**Scope:** business structure, marketing/client acquisition, sponsorship, community impact, money-flow controls, compliance gates, operational authority and future game/Unity integration.

> This is an operational architecture and compliance checklist, not a declaration that any specific gaming, fundraising, securities, tax, employment or payment activity is legally authorized. Value-bearing poker, charitable solicitation, investment solicitation and regulated promotions remain disabled until the applicable professional/jurisdictional approvals are documented.

## 1. Operating principle

SVR should be run as a set of separately governed modules. Code existing in the repository does not by itself authorize a business activity.

Every module must have:

1. a named authority/source of truth;
2. a business owner;
3. technical dependencies;
4. data classification;
5. activation requirements;
6. compliance review when applicable;
7. accounting treatment;
8. measurable success criteria;
9. incident/rollback procedure;
10. retained evidence of approvals and changes.

The module catalog is `SVR-MODULE-CATALOG.json`.

## 2. Business lanes

### A. Product/platform

Responsible for:

- web/mobile/Quest poker experience;
- lobby, table, profile, avatar and future Unity experience;
- release management;
- technical QA;
- cloud/API/data services;
- security and availability.

The product lane does **not** decide whether a value-bearing tournament, charitable solicitation, sponsor claim or payout is legally permitted.

### B. Marketing/client acquisition

Responsible for:

- sponsor prospects;
- advertisers;
- memberships/community acquisition;
- partner/hub prospects;
- creator/influencer outreach;
- email/social campaigns;
- campaign creative and attribution;
- lead qualification and CRM handoff.

### C. Sponsorship/advertising

Responsible for:

- inventory definition (site placement, VR billboard, event placement, store feature, hub placement);
- rate card/proposal version;
- signed agreement;
- brand asset permissions;
- campaign dates;
- disclosure requirements;
- impression/click/event reports;
- invoice and receivable status;
- make-good/refund rules.

No sponsor should be displayed merely because an image exists in the repository. `approved=true` plus a contract/approval record should be the activation gate.

### D. Community/impact

Responsible for:

- partner charity/nonprofit verification;
- campaign purpose;
- whether money is a donation, sponsorship, event proceeds, or another classification;
- restricted-fund/campaign tracking;
- public representations about where money goes;
- receipts/disclosures/reporting;
- proof of remittance to intended recipients.

### E. Finance/accounting

Responsible for the monetary source of truth. Client-side game code is never the accounting ledger.

Track separately:

- customer/store gross receipts;
- sponsorship revenue;
- advertising revenue;
- membership revenue;
- donations/charitable campaign receipts when legally enabled;
- processor fees;
- taxes collected/payable;
- refunds;
- chargebacks;
- contractor/vendor payables;
- sponsor revenue shares if any;
- charity/community remittances;
- marketing spend;
- operating expenses;
- owner/company distributions where authorized.

### F. Legal/compliance

Responsible for activation approval on regulated/high-risk modules, including:

- poker/gaming/prizes/entry fees;
- sweepstakes/contests/promotions;
- charitable solicitation/fundraising;
- professional fundraising relationships;
- advertising claims and endorsements;
- privacy/data handling;
- email/SMS outreach;
- payment processing/refunds;
- intellectual property/trademarks/music/assets;
- age/geographic restrictions;
- employment/contractor classification;
- taxes and entity/accounting structure;
- investment/securities solicitations if capital is ever raised from investors.

## 3. Money-flow authority

All money movement should follow this control path:

```text
source transaction
  -> immutable transaction record
  -> classification
  -> processor settlement/reconciliation
  -> fees/tax/refund/chargeback adjustments
  -> contractual allocation if applicable
  -> payable/receivable ledger
  -> approval
  -> payout/remittance
  -> proof/receipt
  -> accounting close/reconciliation
```

### Required transaction fields

- transaction ID;
- external processor/reference ID;
- timestamp;
- payer/payee/customer/campaign reference as appropriate;
- gross amount;
- currency;
- transaction type;
- campaign/sponsor/order/tournament reference;
- fees;
- taxes;
- refund/chargeback status;
- net settled amount;
- revenue/fund classification;
- allocation terms/version;
- approval identity/timestamp;
- payout/remittance reference;
- reconciliation status.

### Payout rule

Do not calculate or execute real payouts from browser/Unity state. The client can display an approved result, but server/accounting records own monetary truth.

For any revenue-share arrangement, define the contract formula explicitly. A safe general model is:

```text
Gross collected
- refunds
- chargebacks
- processor fees (if contractually deductible)
- applicable taxes (if contractually deductible)
= defined settlement base
x agreed percentage
= payable amount
```

The contract—not code comments—must determine which deductions are allowed.

## 4. Sponsor lifecycle

```text
lead
-> qualified
-> proposal
-> due diligence / brand fit
-> terms agreed
-> contract signed
-> creative submitted
-> IP/claims/disclosure review
-> campaign configured
-> preview approval
-> live
-> measurement
-> invoice/collection
-> campaign close
-> renewal/archive
```

### Sponsor record

- sponsor ID;
- legal/brand name;
- billing/contact data;
- campaign owner;
- approved logos/assets;
- proof of permission to use assets;
- placement inventory;
- rate/contract ID;
- start/end dates;
- target audience/channel;
- disclosure text/requirements;
- creative approval status;
- invoice/collection status;
- campaign metrics;
- renewal status.

### Advertising truth/disclosure gate

Paid endorsements or material brand relationships must be handled so consumers can understand the relationship. FTC guidance treats financial, employment, personal/family relationships and free/discounted value as potential material connections requiring clear disclosure when not otherwise obvious.

SVR campaign records therefore need:

- `sponsoredContent: true/false`;
- `materialConnectionDisclosureRequired: true/false`;
- approved disclosure wording;
- placement position proof/screenshots when live;
- claims substantiation/approval notes.

Official references:

- FTC Endorsements, Influencers, and Reviews: https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews
- FTC Disclosures 101: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers

## 5. Marketing campaign architecture

Every campaign gets a durable campaign ID rather than relying on page names or ad filenames.

### Campaign definition

```json
{
  "campaignId": "SVR-YYYY-CHANNEL-PURPOSE-001",
  "objective": "qualified sponsor leads",
  "audience": "example segment",
  "channel": "email|social|partner|event|paid-media|organic",
  "creativeIds": [],
  "destinationRoute": "/site/sponsor-intake.html",
  "budgetCeiling": 0,
  "startAt": null,
  "endAt": null,
  "owner": "business role",
  "disclosureRequired": false,
  "approved": false,
  "conversionEvents": ["lead_submit"]
}
```

### Measurement funnel

- impression/reach;
- view/engagement;
- click;
- landing-page session;
- lead submit;
- qualified lead;
- proposal;
- signed client/sponsor;
- billed revenue;
- collected revenue;
- renewal.

Do not report impressions/clicks as clients or revenue.

## 6. Email marketing gate

Commercial email should not be activated until the workflow can maintain:

- accurate sender/from information;
- truthful subject lines;
- physical postal address where required;
- clear unsubscribe mechanism;
- suppression list;
- reliable opt-out processing;
- vendor/agency oversight;
- campaign/audience source records.

FTC guidance says commercial email opt-out requests must be honored within 10 business days and marketers remain responsible for vendors sending on their behalf.

Official reference: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

## 7. Community fundraising and charitable impact

SVR's community mission can be a strong part of the brand, but fundraising must be structurally separated from ordinary sales and sponsorships.

Before soliciting charitable donations, record:

- legal identity of the organization soliciting/receiving funds;
- whether that organization is eligible/registered where required;
- beneficiary charity/nonprofit and verification date;
- campaign agreement;
- exact public representation of how funds are calculated/distributed;
- whether the payment is a donation or includes goods/services;
- receipt/acknowledgment responsibility;
- bank/processor destination;
- accounting restriction/classification;
- remittance timing;
- reporting requirements.

### Illinois gate

Illinois Attorney General guidance states that charitable organizations soliciting donations or holding charitable assets in Illinois generally must register with the Attorney General, and separate requirements apply to professional fundraisers/consultants. This must be reviewed before SVR or a partner activates an Illinois solicitation.

Official references:

- https://illinoisattorneygeneral.gov/consumer-protection/charities/
- https://illinoisattorneygeneral.gov/Consumer-Protection/Charities/Building-Better-Charities/Charity-Registration/
- https://illinoisattorneygeneral.gov/Consumer-Protection/Charities/Building-Better-Charities/Requirements-for-Fundraisers/

### Federal donation records

IRS guidance states that substantiation/disclosure rules can apply to charitable contributions, including written acknowledgment needed by donors for contributions of $250 or more and written disclosure by a charitable organization for certain quid-pro-quo payments over $75.

Official reference: https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-written-acknowledgments

## 8. Poker, prizes and charitable gaming gate

The current product should remain free-play/test-mode unless a separately reviewed value-bearing activity is approved.

Do not infer that a charity purpose automatically makes poker legally permissible. Illinois has a specific Charitable Games Act/licensing framework; Illinois Department of Revenue guidance lists permitted charitable games including hold-em poker and imposes eligibility/license/event/proceeds rules.

Before enabling any entry fee, cash-equivalent prize, paid tournament, charitable poker proceeds, sweepstakes-like promotion or real-money feature, obtain jurisdiction-specific review and document:

- operator eligibility;
- license/permit requirements;
- game format;
- entry consideration;
- prize value/source;
- age requirement;
- geography/geofencing;
- event frequency/location restrictions;
- beneficiary/proceeds restrictions;
- tax/recordkeeping obligations;
- official rules;
- payment processor approval.

Official Illinois reference: https://tax.illinois.gov/research/taxinformation/charitygaming/charitable.html

## 9. Store/commerce gate

Store catalog preview can exist without checkout. Live checkout requires:

- approved merchant/payment processor account;
- item legal/brand ownership;
- final price/currency;
- tax determination;
- shipping/fulfillment terms where applicable;
- refund/return/cancellation policy;
- privacy/security review;
- order confirmation/receipt;
- inventory and settlement reconciliation;
- chargeback process.

No private payment keys belong in static site or Unity files.

## 10. Client/lead CRM stages

Use consistent stages:

```text
new
contacted
qualified
discovery
proposal
negotiation
contracted
active
renewal
closed-won
closed-lost
archived
```

Minimum lead record:

- lead ID;
- source/campaign ID;
- date created;
- person/company;
- contact methods;
- interest type;
- consent/contact basis;
- owner;
- current stage;
- next action/date;
- notes;
- proposal/contract references;
- revenue forecast (clearly labeled forecast);
- actual collected revenue when won.

## 11. Contracts/approval records

For sponsor/partner/vendor/contractor relationships retain:

- executed agreement;
- effective/expiration dates;
- scope/deliverables;
- payment terms;
- revenue share formula if any;
- intellectual-property license/permissions;
- confidentiality/data terms where applicable;
- cancellation/termination terms;
- liability/indemnity/insurance provisions as reviewed;
- approval identity/date;
- amendments;
- final closeout.

Repository demo content is not a substitute for executed rights to use a third party's name/logo/content.

## 12. Privacy/security/data classification

### Public

Approved marketing copy, approved sponsor creative, public product descriptions, public event information.

### Internal

Campaign plans, lead stages, forecasts, non-sensitive operating notes.

### Confidential

Contracts, invoices, private partner notes, nonpublic analytics, support messages.

### Restricted

Passwords, tokens, database credentials, payment secrets, identity verification data, high-risk personal information.

Restricted data must not be committed to Git and should be accessible only to the service/process that needs it.

## 13. Release/change authority

Professional release flow:

```text
main known-good
-> phase branch
-> audit/research
-> modular change
-> automated tests
-> protected-current-release regression tests
-> preview/manual review where possible
-> PR
-> merge only when gates are green
-> production deploy
-> source-provenance verification
-> post-deploy health check
```

Public landing-page files are protected during Phase 423 and should not change without a separately authorized public-page phase.

## 14. Phase 423 priorities

1. Restore reliable source-to-live deployment verification.
2. Lock module catalog and dependency validation.
3. Protect current public landing page from accidental edits.
4. Make internal site pages consume shared browser/API contracts instead of hard-coded guesses.
5. Document cloud authority truthfully: implemented source is not the same as deployed service.
6. Define Unity package/assembly/asset migration map.
7. Establish sponsor/campaign/fundraising/finance activation gates.
8. Preserve Phase 403/408/420/422 poker/mobile/Quest behavior.
9. Defer broad VR geometry redesign until this foundation is green.

## 15. Professional activation checklist

A module is ready to move from design/local/pending to live only when all applicable boxes are documented:

- [ ] source authority identified
- [ ] dependencies green
- [ ] unit/contract tests green
- [ ] browser/device tests green
- [ ] security review complete
- [ ] privacy review complete
- [ ] legal/compliance review complete
- [ ] contract/rights approval complete
- [ ] accounting treatment defined
- [ ] customer/user disclosures approved
- [ ] rollback tested
- [ ] monitoring/incident owner assigned
- [ ] production endpoint/config actually provisioned
- [ ] post-deploy verification passed

This checklist prevents an unfinished module from silently becoming production truth.
