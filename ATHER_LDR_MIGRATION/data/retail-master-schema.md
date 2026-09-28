# Retail Master Sheet Schema

## Join Key

The Retail Master is joined to the Lead Master using:
- **Lead Master side:** `opty_id`
- **Retail Master side:** `sourceLeadId` (aliases: `sourcelead id`, `sourcelead_id`, `source lead id`, `source_lead_id`, `sourceleadid`, `lead id`, `leadid`, `optyid`, `opty id`, `opty_id`)

## Required Columns

| Column | Aliases tried | Notes |
|--------|--------------|-------|
| `sourceLeadId` | sourcelead id, lead id, opty_id, etc. | Join key to Lead Master |
| `performance_month` | performance month, performancemonth, retail month, booking month, booking_month, month | Booking month (normalized to `"Mon'YYYY"`) |
| `purchasedModel` | retail model, retail_model, purchasedmodel, purchased model, model, model name | Model purchased |
| `retail_attribution_date` | retailattributiondate, attribution date, retail date, retaildate, date | Date of retail event |

## Optional Columns (enrichment)

| Column | Aliases | Notes |
|--------|---------|-------|
| `Call Type` | call type, calltype | `"dms"` or `"co"` (call out) — affects RT filter |
| `brand` | brand | Used for brand filtering |

## Brand Filter

Only retail rows with these brand values are included:
- Empty / blank
- Starts with `"ather"` (case-insensitive)
- Starts with `"hero"` (case-insensitive)

KONARC, TATA, SUZUKI, and other brands are excluded.

## Retail Attribution Rules

A retail row is "in-scope" (counted as `isRetailed = true`) only when ALL of the following are true:

1. `isBooked = true` (row has a valid `performance_month`)
2. `booking_month` is set (non-null)
3. `lead_month` is set (from the joined lead)
4. `d = atherMonthOrder(booking_month) - atherMonthOrder(lead_month)` satisfies `0 ≤ d ≤ 2`
5. `canonPurMdl(purchasedModel)` is one of the 4 scope models

## Scope Models (`ATHER_SCOPE_MODELS`)

```js
new Set(['Ather Rizta', 'Ather 450X', 'Ather 450S', 'Ather 450 Apex'])
```

**KONARC SR2 and SR3 are out-of-scope** — retail rows with these models do not count as retails.

## Model Canonical Map (`_RE_PUR_MDL_CANONICAL`)

Raw purchased model names are normalized (case-insensitive, trimmed):

| Raw values (examples) | Canonical |
|----------------------|-----------|
| rizta, rizta s, rizta z, rizta s lr, rizta z hr, ather rizta | Ather Rizta |
| 450x, 450x hr, 450x gen 3, ather 450x | Ather 450X |
| 450s, 450s hr, 450s lr, ather 450s | Ather 450S |
| 450 apex, ather 450 apex, 450apex, 450 apex gen 3 | Ather 450 Apex |

Any model name not in the map is returned as-is (case-preserved from input).

## Retail Dispersion (Day-Bucket) — Legacy Data

The dashboard also computes day-bucket data from `leadDate` and `retailDate`:
- Days between lead creation and retail
- Buckets: 0, 1, 2, 3, 4, 5–6, 7–9, 10–13, 14–20, 21–30, 31–45, 46–60, 61–90, 91–120, 121+
- This data is computed but the "Retail Dispersion" tab has been **removed** from the 7-tab deployment

## Non-Scope Retail Rows

`parseAtherNonScopeRetailRows()` parses retail rows where `d < 0 || d > 2` or model is out of scope.
These are displayed as "Non-Scope R" column in the Source Analysis tab.
