# Data Source Configuration

## How Sheet URLs Are Stored

The dashboard stores sheet URLs in two JavaScript objects in the source file:

### ATHER_LEAD_MASTER_BY_MONTH

Located at lines ~232–244 of `ATHER_LDR_Dashboard_v1.0.html`:

```js
const ATHER_LEAD_MASTER_BY_MONTH = {
  "May'2026": "https://docs.google.com/spreadsheets/d/1jnhdvPUEefW7HrD44ffvH2k3v0eUe2JGolXkX6EIKbQ/edit?gid=2013005874#gid=2013005874",
  "Jun'2026": "https://docs.google.com/spreadsheets/d/1qAvzs6ucsPtk3joTsYeHijk2Tx_JRcCBsXzKDbnEOPc/edit?gid=2013005874#gid=2013005874",
  "Jul'2026": "https://docs.google.com/spreadsheets/d/1t29vI-JdKu7HDaaLX33N3wFnhylFLbOkwPhyWc6ZKiA/edit?gid=2013005874#gid=2013005874",
  "Aug'2026": "https://docs.google.com/spreadsheets/d/1WgyRvNW02UxCYyhQDLfaFa86RciciSeGXeQmBF7ymIg/edit?gid=2013005874#gid=2013005874",
  "Sep'2026": "https://docs.google.com/spreadsheets/d/1MdlYzXsJ1rAZ1PfVDNXE7n8IGaHQuoW25QHh3tq6XRc/edit?gid=2013005874#gid=2013005874",
};
```

Keys MUST be in `"Mon'YYYY"` format (e.g., `"Oct'2026"`).

### ATHER_SHEETS_CONFIG

```js
const ATHER_SHEETS_CONFIG = Object.freeze({
  RETAIL_URL: "https://docs.google.com/spreadsheets/d/1gnVRakNMws0OjshRTVYTeSFQkJlnt4IvDMEAzuakl4M/edit?gid=0#gid=0",
  AUTO_SYNC_ON_LOAD: true,
});
```

`AUTO_SYNC_ON_LOAD: true` — dashboard auto-syncs when the page loads (after auth).
Set to `false` to require manual "Sync Sheets" button click.

## How URLs Are Converted

The `sheetUrlToCsvUrl()` function converts edit URLs to GViz CSV export format:

```js
// Input:  https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=12345#gid=12345
// Output: https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&gid=12345
```

The GViz export provides CSV without requiring Google authentication.
The sheet must be shared as "Anyone with the link → Viewer" for this to work.

## Adding/Updating a Month

To add `Oct'2026`:
1. Create or obtain the October Lead Master spreadsheet
2. Share it: "Anyone with the link → Viewer"
3. Get the spreadsheet ID from the URL
4. Add to `ATHER_LEAD_MASTER_BY_MONTH`:
   ```js
   "Oct'2026": "https://docs.google.com/spreadsheets/d/YOUR_NEW_ID/edit?gid=2013005874#gid=2013005874",
   ```
5. Commit and push to `main` — GitHub Pages auto-deploys

## Removing an Old Month

Simply delete the entry from `ATHER_LEAD_MASTER_BY_MONTH`. The dashboard will only show months
that have entries in this object.

## Updating Retail Master

Replace the `RETAIL_URL` in `ATHER_SHEETS_CONFIG` with the new URL. The Retail Master is a single
sheet covering all months.
