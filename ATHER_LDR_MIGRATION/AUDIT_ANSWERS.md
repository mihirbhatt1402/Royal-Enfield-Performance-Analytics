# Audit Answers

Explicit answers to 19 technical audit questions about the Ather LDR Dashboard.

---

**Q1: What is the primary key for the Lead Master?**

`opty_id` — Column aliases tried in order:
`opty_id`, `opty id`, `lead id`, `leadid`, `lead_id`, `opportunity id`, `opportunity_id`

---

**Q2: What is the join key on the Retail Master side?**

`sourceLeadId` — Column aliases tried:
`sourcelead id`, `sourcelead_id`, `source lead id`, `source_lead_id`, `sourceleadid`, `lead id`, `leadid`, `optyid`, `opty id`, `opty_id`

The join is: `Lead.opty_id = Retail.sourceLeadId`

---

**Q3: What is the retail attribution window (d values)?**

`d = atherMonthOrder(booking_month) - atherMonthOrder(lead_month)`

- **In-scope:** `d ∈ {0, 1, 2}` (same month, +1 month, +2 months)
- **Out-of-scope:** `d < 0` (retail before lead, which is logically impossible data) or `d > 2` (too late)

Defined in `isRetailed()` function at line ~860:
```js
function isRetailed(r) {
  if (!r.isBooked || !r.booking_month || !r.lead_month) return false;
  const d = atherMonthOrder(r.booking_month) - atherMonthOrder(r.lead_month);
  if (d < 0 || d > 2) return false;
  return ATHER_SCOPE_MODELS.has(canonPurMdl(r.purchasedModel || ''));
}
```

---

**Q4: What are the 4 in-scope canonical model names?**

```js
const ATHER_SCOPE_MODELS = new Set([
  'Ather Rizta',
  'Ather 450X',
  'Ather 450S',
  'Ather 450 Apex'
]);
```

KONARC SR2 and SR3 are explicitly out-of-scope. Any model not in the canonical map is returned as-is (not mapped to an in-scope model).

---

**Q5: What is the data cutoff date?**

**01-May-2026.** Hardcoded as:
```js
const DATA_CUTOFF = new Date(2026, 4, 1); // May 1, 2026
```

Leads with a parsed lead date before this date are excluded from all processing.

---

**Q6: How is deduplication handled in the Lead Master?**

The `duplicate check` column (aliases: `duplicity check`, `duplicate_check`, `duplicity_check`) is checked:
- If the value is `"Unique"` (case-insensitive) → row is included
- If the column exists with any other value → row is excluded
- If the column is absent entirely → row is included (treated as unique)

---

**Q7: How is the source/medium classified?**

The `Medium` column value is classified via `classifySrc()`:

```js
function classifySrc(s) {
  const n = (s || '').toLowerCase();
  if (['adword','google','sem','ppc'].some(p => n.includes(p))) return 'adwords';
  if (['whatsapp'].some(p => n.includes(p)))                     return 'whatsapp';
  if (['facebook','fb','meta','msfb'].some(p => n.includes(p))) return 'msfb';
  if (['organic'].some(p => n.includes(p)))                      return 'organic';
  return 'nonms';
}
```

Source groups: PAID (adwords + msfb + whatsapp) and ORG+NON MS (organic + nonms).

---

**Q8: What are the admin email addresses?**

Source file currently has only one:
```js
var ADMIN_EMAILS = ['mihir.bhatt@girnarsoft.com'];
```

**Required update before deployment:**
```js
var ADMIN_EMAILS = [
  'mihir.bhatt@girnarsoft.com',
  'pooja.chowdhury@girnarsoft.com',
  'aditya.kumar@girnarsoft.com'
];
```

This is Change 2 in the required source edits.

---

**Q9: What are the allowed domains?**

```js
var ALLOWED_DOMAINS = ['@girnarsoft.com', '@girnarcare.com'];
```

**Important:** This is defined but NOT enforced in the JavaScript. The variable exists as documentation but no code checks it. Any Google account can sign in. Domains can only be restricted at the Firebase Console level (Authorized Domains) — which limits which *origins* can initiate auth, not which email domains can sign in.

---

**Q10: What is the security bug and how should it be fixed?**

**Bug location:** `AuthGate` component, inside `handleUser` fallback path (lines ~4245-4247).

**Bug:** When Firestore is unreachable (network error), the fallback role is `'full'` instead of a least-privileged role:
```js
var fallbackRole = isAdminEmail(user.email) ? 'admin' : 'full';
```

**Fix:**
```js
var fallbackRole = isAdminEmail(user.email) ? 'admin' : 'viewer';
```

**Impact:** Without the fix, a transient Firestore error grants any signed-in user full dashboard access. With the fix, they get read-only viewer access instead.

---

**Q11: What is the `FILTER_CLEARED` sentinel?**

```js
const FILTER_CLEARED = Object.freeze(new Set(['\x00']));
```

A frozen Set containing a null character (`\x00`) that no real data value can match.

- When a filter is set to `FILTER_CLEARED`: aggregation code sees `size > 0` (active filter) but `has()` returns `false` for every real value → zero records shown
- Distinguishes "no filter applied" (empty Set) from "filter explicitly cleared to show nothing"

---

**Q12: How many tabs does the production dashboard have?**

**7 tabs.** The source file has 8 entries in `TABS`, but `dispersion` (Retail Dispersion) is excluded by `visibleTabs` for all production roles.

Production tabs:
1. Overview
2. Source Analysis
3. LT × Source
4. Model Performance
5. State Performance
6. Geo & Dealer
7. Pivot Table

---

**Q13: What columns does the Geo & Dealer tab show?**

As specified in the requirements:
- Dealer Code
- Dealer
- State
- Region
- City
- Leads
- Retail
- Conv%

The tab does NOT show: AO, WIP, Direct Push, L1 Nurtured. State is the top-level grouping.

---

**Q14: What is `leadsMode` and how does it affect the data?**

`leadsMode` is a toggle in the App component (default: `'update'`).

- **`'create'` (On Create):** All matrices use `lead_month` as the time dimension
- **`'update'` (On Update):** Booked leads use `booking_month`; unbooked leads use `lead_month`

The `effectiveData` object in `App` switches between the base matrices (`sm`, `stm`, etc.) and their `bm_` prefixed variants (`bm_sm`, `bm_stm`, etc.) based on `leadsMode`.

---

**Q15: What does the RT toggle do?**

The `RT` state variable (default: `'all'`) selects which retail count is displayed:

- `'all'` → total retail count (index 3 in `[L, R_all, R_dms, R_co]`)
- `'dms'` → DMS-only retail (index 2)
- `'co'` → Call Out retail (index 1)

The `makeLR(rt_cols, RT)` function returns an accessor that picks the right retail index.

---

**Q16: What CDNs are used?**

| Library | CDN | Version |
|---------|-----|---------|
| React 18 | unpkg.com | 18.x production min |
| React DOM 18 | unpkg.com | 18.x production min |
| Chart.js | cdn.jsdelivr.net | 4.x |
| SheetJS (xlsx) | cdn.sheetjs.com | 0.20.3 |
| Firebase App | gstatic.com | 10.12.2 compat |
| Firebase Auth | gstatic.com | 10.12.2 compat |
| Firebase Firestore | gstatic.com | 10.12.2 compat |
| Firebase Database | gstatic.com | 10.12.2 compat |
| Google Fonts | fonts.googleapis.com | DM Mono + Inter |

---

**Q17: What is the brand/color theme?**

Ather uses teal/cyan (distinct from Hero's orange/brown):
- `--red: #0891B2` (actually teal — this variable name is inherited from Hero)
- `--navy: #164E63`
- `--blue-m: #0891B2`
- Accent: `#D97706` (amber/gold for L2R%)
- Purple: `#7C3AED` (PAID source group)

---

**Q18: How is `Non-Scope Retail` computed?**

`parseAtherNonScopeRetailRows()` parses Retail Master rows where the retail event falls outside the attribution window (`d < 0 || d > 2`) OR the purchased model is not in `ATHER_SCOPE_MODELS`.

These rows are stored as `nsRetailRows` in App state and displayed as the "Non-Scope R" column in the Source Analysis tab.

---

**Q19: What happens if a lead's state is unknown or invalid?**

1. `canonicalState()` is called on the raw state value
2. Known misspellings are corrected via `STATE_FIX` map (e.g., `"Orissa"` → `"Odisha"`)
3. Values in `STATE_GARBAGE` Set (`"#N/A"`, `"N/A"`, `"NA"`, etc.) become empty string
4. Empty/null → `"Unknown"`

In the Geo & Dealer tab, leads with `state = "Unknown"` should not appear (0 unknown states in the validation reference values).

---

## Summary of Required Changes

| # | Change | File | Location | Action |
|---|--------|------|----------|--------|
| 1 | Firebase API Key | source HTML | Line ~4008 | Replace placeholder |
| 1 | Messaging Sender ID | source HTML | Line ~4013 | Replace placeholder |
| 1 | App ID | source HTML | Line ~4014 | Replace placeholder |
| 2 | Admin Emails | source HTML | Line ~4016 | Add 2 more emails |
| 3 | Auth fallback role | source HTML | Line ~4246 | Change `'full'` to `'viewer'` |
