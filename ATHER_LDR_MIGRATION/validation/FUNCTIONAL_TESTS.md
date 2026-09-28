# Functional Test Suite

25 functional tests to verify correct dashboard behavior after deployment.

---

## Auth Tests

### FT-01: Login Page Loads
- **Action:** Navigate to dashboard URL
- **Expected:** Login page with "Continue with Google" button
- **Pass if:** No JavaScript errors, page renders within 5 seconds

### FT-02: Google Sign-In Works
- **Action:** Click "Continue with Google" and sign in with `mihir.bhatt@girnarsoft.com`
- **Expected:** Redirect to dashboard (not pending page)
- **Pass if:** Dashboard header visible with "Sync Sheets" button

### FT-03: Non-Admin Gets Pending
- **Action:** Sign in with a new non-admin `@girnarsoft.com` email
- **Expected:** "Access Pending" page
- **Pass if:** No crash, page shows contact email

### FT-04: Pending User Can Be Upgraded
- **Action:** Admin upgrades a pending user to `full` role via Admin panel
- **Expected:** User can now access all tabs
- **Pass if:** After role change, user sees all 7 tabs

### FT-05: Sign Out Works
- **Action:** Click sign out from user avatar
- **Expected:** Redirect back to login page
- **Pass if:** Login page visible, no lingering user state

---

## Sync Tests

### FT-06: Initial Data Sync
- **Action:** Click "Sync Sheets" button
- **Expected:** Sync completes (spinner stops, "✓ Synced" banner appears)
- **Pass if:** No error message, header shows Leads and Bookings counts

### FT-07: Lead Count Approximate
- **Action:** After sync, check header
- **Expected:** Leads count is approximately 60,504
- **Pass if:** Leads count is > 50,000 and < 75,000 (tolerance for data changes)

### FT-08: Retail Count Approximate
- **Action:** After sync, check header
- **Expected:** Retail count is approximately 1,531
- **Pass if:** Retail count is > 1,000 and < 3,000

### FT-09: All 5 Months Present
- **Action:** Open Month filter
- **Expected:** Filter shows May'2026, Jun'2026, Jul'2026, Aug'2026, Sep'2026
- **Pass if:** All 5 months are listed

### FT-10: Auto-Sync on Page Load
- **Action:** Reload the page (already authenticated)
- **Expected:** Dashboard syncs automatically without clicking "Sync Sheets"
- **Pass if:** Data loads without manual interaction (AUTO_SYNC_ON_LOAD = true)

---

## Filter Tests

### FT-11: Month Filter — Single Month
- **Action:** Select only "May'2026" in Month filter
- **Expected:** All tabs show only May data
- **Pass if:** Numbers decrease (reflect single month instead of all months)

### FT-12: Month Filter — All
- **Action:** Select all months (or clear month filter)
- **Expected:** Numbers return to full totals
- **Pass if:** Total lead count matches pre-filter value

### FT-13: Source Filter Works
- **Action:** Select only "ADWORDS" sources
- **Expected:** Only ADWORDS leads visible
- **Pass if:** Source Analysis shows only ADWORDS rows with correct totals

### FT-14: State Filter Works
- **Action:** Select "Maharashtra" in State filter
- **Expected:** Data filtered to Maharashtra only
- **Pass if:** State Performance tab shows only Maharashtra

### FT-15: FILTER_CLEARED Sentinel
- **Action:** Select a filter, then click "Clear" on that filter
- **Expected:** Data shows 0 records for that dimension (not "all records")
- **Pass if:** Zero results visible (cleared ≠ no filter)

---

## Tab Tests

### FT-16: Overview Tab — KPI Cards
- **Action:** Click Overview tab
- **Expected:** KPI cards show Leads, Retail, L2R%, States
- **Pass if:** All KPI cards have non-zero values

### FT-17: Source Analysis Tab — Non-Scope R Column
- **Action:** Click Source Analysis tab
- **Expected:** Table has columns: Source, Leads, Enquiries, L.Contrib%, Retail, R.Contrib%, L2R%, Non-Scope R
- **Pass if:** All 8 columns present

### FT-18: Geo & Dealer Tab — Correct Columns
- **Action:** Click Geo & Dealer tab
- **Expected:** Columns: Dealer Code, Dealer, State, Region, City, Leads, Retail, Conv%
- **Pass if:** Exact column set present, no AO/WIP/Direct Push/L1 Nurtured columns

### FT-19: Pivot Table — Configurable
- **Action:** Click Pivot Table tab, change row dimension from "Model" to "State"
- **Expected:** Table rebuilds with State as row key
- **Pass if:** State names appear as row labels

### FT-20: Retail Dispersion Tab Not Visible
- **Action:** Check tab list for admin user
- **Expected:** No "Retail Dispersion" tab
- **Pass if:** Tab bar shows exactly 7 tabs (no dispersion tab)

---

## Export Tests

### FT-21: CSV Export — Source Analysis
- **Action:** Click CSV export button on Source Analysis tab (any month)
- **Expected:** CSV file downloads
- **Pass if:** File opens in Excel/text editor with correct columns

### FT-22: Detailed CSV Export
- **Action:** Click "Detailed CSV" button on Source Analysis tab (admin/full role)
- **Expected:** Detailed CSV with lead-level data
- **Pass if:** File has more rows than the aggregated CSV

### FT-23: Excel Export
- **Action:** Click Excel export button on any tab with one
- **Expected:** .xlsx file downloads
- **Pass if:** File opens in Excel without error

---

## Role Tests

### FT-24: Viewer Role — Limited Tabs
- **Action:** Set a user to `viewer` role, sign in as that user
- **Expected:** Only Model Performance, State Performance, Geo & Dealer tabs visible
- **Pass if:** Exactly 3 tabs in the tab bar

### FT-25: Client Role — Limited Tabs
- **Action:** Set a user to `client` role, sign in as that user
- **Expected:** Only Model Performance and Geo & Dealer tabs visible
- **Pass if:** Exactly 2 tabs in the tab bar

---

## Test Results Template

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| FT-01 | | | |
| FT-02 | | | |
| FT-03 | | | |
| FT-04 | | | |
| FT-05 | | | |
| FT-06 | | | |
| FT-07 | | | |
| FT-08 | | | |
| FT-09 | | | |
| FT-10 | | | |
| FT-11 | | | |
| FT-12 | | | |
| FT-13 | | | |
| FT-14 | | | |
| FT-15 | | | |
| FT-16 | | | |
| FT-17 | | | |
| FT-18 | | | |
| FT-19 | | | |
| FT-20 | | | |
| FT-21 | | | |
| FT-22 | | | |
| FT-23 | | | |
| FT-24 | | | |
| FT-25 | | | |
