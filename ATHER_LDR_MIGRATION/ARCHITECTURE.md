# Architecture Overview

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React (UMD, no build step) | 18.x |
| Charts | Chart.js | 4.x |
| Excel Export | SheetJS (xlsx) | 0.20.3 |
| Authentication | Firebase Auth (Google) | 10.12.2 |
| Database | Firebase Firestore | 10.12.2 |
| Presence | Firebase RTDB | 10.12.2 |
| Fonts | Google Fonts (DM Mono + Inter) | — |
| Hosting | GitHub Pages (static) | — |

All libraries are loaded from CDN — no npm, no build system.

---

## Single-File Architecture

The entire dashboard is one HTML file: `ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html`

Structure of the file:
1. **CSS** (lines 1–217): All styles. Brand colors: `--red:#0891B2`, `--navy:#164E63` (Ather teal/cyan theme)
2. **CDN Scripts** (lines 218–221): React, Chart.js, SheetJS, Firebase
3. **Config** (lines 222–255): `ATHER_LEAD_MASTER_BY_MONTH`, `ATHER_SHEETS_CONFIG`, sheet URL helpers
4. **Data utilities** (lines 246–300): `sheetUrlToCsvUrl`, `fetchSheetCsv`, `parseCsvToRows`
5. **Geography constants** (lines 302–368): `INDIA_ZONE_STATES`, `STATE_TO_ZONE`, `getZone`, `BD_BUCKETS`, `bdBucket`, `classifySrc`, `buildSrcGroups`
6. **React + Month/State helpers** (lines 370–448): `MONTH_NAMES`, `STATE_GARBAGE`, `STATE_FIX`, `canonicalState`, `canonicalModel`, `atherMonthOrder`, `normalizeAtherMonth`, `parseAtherDate`, `DATA_CUTOFF`, `ATHER_BUILD_TS`
7. **Lead parser** (lines 450–617): `parseAtherLeadRows` — parses Lead Master CSV rows
8. **Retail parser** (lines 619–726): `parseAtherRetailRows` — parses Retail Master CSV rows
9. **Join logic** (lines 728–815): `joinREData` — joins leads with retails by `opty_id = sourceLeadId`
10. **Aggregation** (lines 817–1029): `buildPayload` — creates all pre-aggregated data matrices
11. **UI Components** (lines 1030–3529): React components for all tabs and shared UI
12. **App Root** (lines 3530–3916): `App` component, `TABS` array, filter state
13. **Firebase** (lines 3990–4050): `FIREBASE_CONFIG`, `ADMIN_EMAILS`, Firebase service getters
14. **Auth Components** (lines 4060–4198): `LoginPage`, `PendingPage`, `PresenceStrip`, `AdminPanel`
15. **AuthGate** (lines 4200–4295): Top-level auth state machine
16. **Mount** (line 4297): `ReactDOM.createRoot().render()`

---

## Data Flow

```
Google Sheets (CSV)
    ↓ fetchSheetCsv() [GViz CSV export]
    ↓ parseCsvToRows()
    ↓
parseAtherLeadRows()   parseAtherRetailRows()
    ↓                         ↓
    └──────── joinREData() ───┘
                  ↓
            joinedRows[]
                  ↓
           buildPayload()
                  ↓
        Pre-aggregated matrices
    (sm, mm, stm, ltm, mxst, etc.)
                  ↓
         React Tab Components
         (read matrices, render tables)
```

---

## Data Model: Key Facts

### Lead Master (primary)
- **Primary key:** `opty_id`
- **Deduplication:** Rows where `duplicate check` / `duplicity check` column != 'Unique' are excluded
- **Data cutoff:** `DATA_CUTOFF = new Date(2026, 4, 1)` — leads before 01-May-2026 excluded
- **Month field:** `lead_month` (normalized to `"Mon'YYYY"` format)
- **Brand filter:** NOT applied on lead side — all brands included

### Retail Master (secondary)
- **Join key:** `sourceLeadId` (aliases: `sourcelead id`, `lead id`, `source_lead_id`, etc.)
- **Brand filter:** Only `empty`, `ather*`, or `hero*` brands included
- **Scope filter:** Only `isRetailed(r) = true` rows count as retails:

```js
function isRetailed(r) {
  if (!r.isBooked || !r.booking_month || !r.lead_month) return false;
  const d = atherMonthOrder(r.booking_month) - atherMonthOrder(r.lead_month);
  if (d < 0 || d > 2) return false;
  return ATHER_SCOPE_MODELS.has(canonPurMdl(r.purchasedModel || ''));
}
```

### Retail Attribution Rules
- `d = booking_month_order − lead_month_order`
- **In-scope:** d = 0, 1, 2 (same month, or 1–2 months after the lead)
- **Excluded:** d < 0 (booking before lead) or d ≥ 3 (3+ months gap)
- **Model scope:** Only `Ather Rizta`, `Ather 450X`, `Ather 450S`, `Ather 450 Apex`
- **Out-of-scope:** KONARC SR2/SR3 and all other models are excluded from retail attribution

---

## Pre-Aggregated Matrices

`buildPayload()` returns these data structures:

**On Create matrices** (lead_month dimension):
- `monthly`: [li, L, R_all, R_dms, R_co]
- `sm`: [si, li, L, R_all, R_dms, R_co] — Source × Month
- `mm`: [mi, si, li, L, R, Rd, Rc] — Model × Source × Month
- `stm`: [sti, si, li, L, R, Rd, Rc] — State × Source × Month
- `ltm`: [lti, si, li, L, R, Rd, Rc] — LeadType × Source × Month
- `mxst`: [mi, sti, li, L, R, Rd, Rc] — Model × State × Month
- `cm`: [ci, li, L, R, Rd, Rc] — City × Month
- `csm`: [ci, si, li, L, R, Rd, Rc] — City × Source × Month
- `cxm`: [ci, mi, li, L, R, Rd, Rc] — City × Model × Month
- `univ`: [mi, si, sti, lti, li, L, R, Rd, Rc] — Universal (all dims)

**On Update matrices** (booking_month for booked leads, lead_month otherwise):
- Same set with `bm_` prefix: `bm_sm`, `bm_mm`, `bm_stm`, etc.

**maps** object: `{ lm, src, mdl, st, lt, city, city_state, purMdl, webId }` — index arrays for each dimension

**rt_cols flag:** Always `1` in v1.0 — enables `[L, R_all, R_dms, R_co]` format for RT filter support

---

## RT Toggle (Call Type Filter)

```js
function makeLR(rtCols, RT) {
  if (!rtCols) return row => [row[row.length-2], row[row.length-1]];
  // RT = 'dms' → use R_dms (index from end = 2)
  // RT = 'co' → use R_co (index from end = 1)
  // RT = 'all' → use R_all (index from end = 3)
  const ri = RT === 'dms' ? 2 : RT === 'co' ? 1 : 3;
  return row => [row[row.length-4], row[row.length-ri]];
}
```

---

## Source Classification

```js
function classifySrc(src) {
  const s = (src || '').toLowerCase();
  if (s.includes('adword') || s.includes('google') || s.includes('sem') || s.includes('ppc'))
    return { grp: 'PAID', sub: 'ADWORDS' };
  if (s.includes('facebook') || s.includes('fb') || s.includes('meta') || s.includes('msfb'))
    return { grp: 'PAID', sub: 'MS FB' };
  if (s.includes('whatsapp'))
    return { grp: 'PAID', sub: 'WHATSAPP' };
  if (s.includes('organic'))
    return { grp: 'ORG+NON MS', sub: 'ORGANIC' };
  return { grp: 'ORG+NON MS', sub: 'NON MS' };
}
```

---

## GitHub Pages Deployment

No GitHub Actions deploy workflow exists. Deployment is done by pushing files directly:

```
repository root/
├── index.html          ← meta-refresh redirect to dashboard
├── .nojekyll           ← prevents Jekyll processing
└── ATHER_LDR/
    └── ATHER_LDR_Dashboard_v1.0.html  ← the dashboard
```

GitHub Pages serves from the `main` branch root. The only workflow is a daily availability check
(`.github/workflows/daily-refresh-check.yml`).

---

## Browser Compatibility

Requires modern browsers with:
- ES2020+ (optional chaining, nullish coalescing)
- CSS Grid and Flexbox
- `fetch()` API
- `URL.createObjectURL()` (for CSV export)
- Firebase SDK compatibility (Chrome, Firefox, Safari, Edge — all recent versions)
