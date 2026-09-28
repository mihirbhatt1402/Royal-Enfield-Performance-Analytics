# Lead Master Sheet Schema

## Primary Key

`opty_id` — unique lead identifier. Column aliases tried in order:
`opty_id`, `opty id`, `lead id`, `leadid`, `lead_id`, `opportunity id`, `opportunity_id`

## Required Columns

| Column | Aliases tried | Notes |
|--------|--------------|-------|
| `opty_id` | opty id, lead id, leadid, lead_id, opportunity id | Primary key |
| `lead_month` | lead_month, lead month, leadmonth, month | Normalized to `"Mon'YYYY"` format |
| `brand` | brand | Used for brand filtering |
| `model` | model, model name, vehicle model, product name | Lead enquiry model |
| `state` | state, lead state | Canonicalized via `STATE_FIX` map |
| `city` | city, lead city, city name | Raw city name |
| `lead_type` | lead_type, lead type, lt | e.g., DMS Lead, Web Lead |
| `Medium` | medium, source, utm_medium, utm source | Source / UTM medium |
| `utm_campaign` | utm_campaign, utm campaign, utmcampaign | Campaign name |
| `duplicate check` | duplicity check, duplicate_check | `"Unique"` → include; anything else → exclude |

## Optional Columns (enrichment)

| Column | Aliases | Notes |
|--------|---------|-------|
| `encrypt_mobile_number` | encrypt_mobile_number, mobile | For Detailed CSV export |
| `id_verified_lead` | id_verified_lead, verified | For Detailed CSV export |
| `verified_dealer` | verified_dealer, verified dealer, dealer | Dealer name for lead |
| `dealerId` | dealerid, dealer_id, dealer id | Numeric dealer ID |
| `oem_crm_id` | oem_crm_id, oem crm id, oemcrmid | OEM CRM reference |
| `enquiryId` | enquiryid, enquiry_id, enquiry id | Enquiry reference |
| `Status_Name` | status_name, status name, statusname | Lead status |
| `Web ID` | web id, webid, web_id | Category: Direct Push / L1 Nurtured / etc. |
| `Date` | date, lead date | Lead creation date (for Retail Dispersion) |

## Deduplication Logic

```js
// Rows where this column is NOT 'Unique' are skipped
const dupCol = get(r, ['duplicate check', 'duplicity check', 'duplicate_check', 'duplicity_check']);
if (dupCol && dupCol.toLowerCase() !== 'unique') continue;
```

## Data Cutoff

Leads with a parsed lead date before `new Date(2026, 4, 1)` (01-May-2026) are excluded.

## Month Normalization (`normalizeAtherMonth`)

Converts any of these formats to `"Mon'YYYY"`:
- `"Aug'2026"` → already canonical
- `"August 2026"` → `"Aug'2026"`
- `"2026-08-01"` → `"Aug'2026"`
- `"Aug-26"` → `"Aug'2026"`
- `"8/2026"` → `"Aug'2026"`

## State Canonicalization

States are normalized using `STATE_FIX` map:
- `"Orissa"` → `"Odisha"`
- `"Tamilnadu"` → `"Tamil Nadu"`
- `"Uttaranchal"` → `"Uttarakhand"`
- etc.

Unknown/blank states → `"Unknown"`

## Source Classification (`classifySrc`)

The `Medium` column value is classified into source groups:
```
contains "adword"/"google"/"sem"/"ppc" → PAID → ADWORDS
contains "facebook"/"fb"/"meta"/"msfb" → PAID → MS FB
contains "whatsapp"                     → PAID → WHATSAPP
contains "organic"                      → ORG+NON MS → ORGANIC
anything else                           → ORG+NON MS → NON MS
```

## Lead Type Classification

The `lead_type` / `lt` field is used as-is (no normalization). Common values:
- `DMS Lead`
- `Web Lead`
- `Enquiry`

## Scope Models

The `model` field from Lead Master is the enquiry model. All models are included in leads count.
Only the 4 canonical Ather models count toward retail attribution (via Retail Master).
