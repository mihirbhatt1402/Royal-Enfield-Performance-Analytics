# Data Sources

## Lead Master Sheets (per month)

Each month's data is in a separate Google Sheet. The dashboard fetches all configured months on sync.

### Currently Configured Months

| Month | Spreadsheet URL |
|-------|----------------|
| May'2026 | `https://docs.google.com/spreadsheets/d/1jnhdvPUEefW7HrD44ffvH2k3v0eUe2JGolXkX6EIKbQ/edit?gid=2013005874#gid=2013005874` |
| Jun'2026 | `https://docs.google.com/spreadsheets/d/1qAvzs6ucsPtk3joTsYeHijk2Tx_JRcCBsXzKDbnEOPc/edit?gid=2013005874#gid=2013005874` |
| Jul'2026 | `https://docs.google.com/spreadsheets/d/1t29vI-JdKu7HDaaLX33N3wFnhylFLbOkwPhyWc6ZKiA/edit?gid=2013005874#gid=2013005874` |
| Aug'2026 | `https://docs.google.com/spreadsheets/d/1WgyRvNW02UxCYyhQDLfaFa86RciciSeGXeQmBF7ymIg/edit?gid=2013005874#gid=2013005874` |
| Sep'2026 | `https://docs.google.com/spreadsheets/d/1MdlYzXsJ1rAZ1PfVDNXE7n8IGaHQuoW25QHh3tq6XRc/edit?gid=2013005874#gid=2013005874` |

### URL Format for GViz Export

The dashboard converts edit URLs to GViz CSV export URLs:
```
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid={GID}
```

For GID `2013005874`, the export URL pattern is:
```
https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&gid=2013005874
```

---

## Retail Master Sheet

One sheet covering all months.

| Sheet | URL |
|-------|-----|
| Retail Master | `https://docs.google.com/spreadsheets/d/1gnVRakNMws0OjshRTVYTeSFQkJlnt4IvDMEAzuakl4M/edit?gid=0#gid=0` |

GViz export URL: `https://docs.google.com/spreadsheets/d/1gnVRakNMws0OjshRTVYTeSFQkJlnt4IvDMEAzuakl4M/gviz/tq?tqx=out:csv&gid=0`

---

## Adding a New Month

To add a new month's sheet to the dashboard:

1. Open `dashboard/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html`
2. Find `ATHER_LEAD_MASTER_BY_MONTH` (lines ~232–244)
3. Add a new entry:
   ```js
   "Oct'2026": "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?gid=2013005874#gid=2013005874",
   ```
4. Ensure the sheet is shared as "Anyone with link → Viewer"
5. Commit and push

---

## Auto-Sync

`AUTO_SYNC_ON_LOAD: true` in `ATHER_SHEETS_CONFIG` means the dashboard automatically syncs all sheets
when the page loads (after authentication). The user does not need to click "Sync Sheets" manually.

---

## Data Cutoff

Leads before `01-May-2026` are excluded regardless of their `lead_month` field:
```js
const DATA_CUTOFF = new Date(2026, 4, 1);  // May 1, 2026
```

This is hardcoded and cannot be changed without modifying the source file.

---

## Sheet Access Requirements

All sheets must be configured as "Anyone with the link → Viewer" in Google Drive sharing settings.
The dashboard accesses them via unauthenticated GViz CSV export URLs (no Google OAuth required for sheet access).

If a sheet is private or access is revoked, the sync will fail with a network/CORS error.
