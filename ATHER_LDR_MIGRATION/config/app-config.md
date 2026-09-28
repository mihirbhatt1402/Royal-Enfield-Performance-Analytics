# Application Config Reference

All hardcoded configuration values in `source/ATHER_LDR_Dashboard_v1.0.html`.

---

## Firebase Config (lines ~4007–4014)

```js
var FIREBASE_CONFIG = {
  apiKey:            'REPLACE_WITH_ATHER_API_KEY',   // ← MUST EDIT
  authDomain:        'ather-ldr-dashboard.firebaseapp.com',
  databaseURL:       'https://ather-ldr-dashboard-default-rtdb.firebaseio.com',
  projectId:         'ather-ldr-dashboard',
  storageBucket:     'ather-ldr-dashboard.firebasestorage.app',
  messagingSenderId: 'REPLACE_WITH_MESSAGING_SENDER_ID',  // ← MUST EDIT
  appId:             'REPLACE_WITH_APP_ID',          // ← MUST EDIT
};
```

---

## Access Control (lines ~4016–4019)

```js
var ADMIN_EMAILS = ['mihir.bhatt@girnarsoft.com'];  // ← MUST ADD 2 MORE EMAILS
var ALLOWED_DOMAINS = ['@girnarsoft.com', '@girnarcare.com'];  // informational only
var USERS_COL = 'ather_users';     // Firestore collection name
var PRESENCE_PATH = 'ather_presence';  // RTDB path prefix
```

---

## Data Sources (lines ~232–243)

```js
const ATHER_LEAD_MASTER_BY_MONTH = {
  "May'2026": "https://docs.google.com/spreadsheets/d/1jnhdvPUEefW7HrD44ffvH2k3v0eUe2JGolXkX6EIKbQ/edit?gid=2013005874#gid=2013005874",
  "Jun'2026": "https://docs.google.com/spreadsheets/d/1qAvzs6ucsPtk3joTsYeHijk2Tx_JRcCBsXzKDbnEOPc/edit?gid=2013005874#gid=2013005874",
  "Jul'2026": "https://docs.google.com/spreadsheets/d/1t29vI-JdKu7HDaaLX33N3wFnhylFLbOkwPhyWc6ZKiA/edit?gid=2013005874#gid=2013005874",
  "Aug'2026": "https://docs.google.com/spreadsheets/d/1WgyRvNW02UxCYyhQDLfaFa86RciciSeGXeQmBF7ymIg/edit?gid=2013005874#gid=2013005874",
  "Sep'2026": "https://docs.google.com/spreadsheets/d/1MdlYzXsJ1rAZ1PfVDNXE7n8IGaHQuoW25QHh3tq6XRc/edit?gid=2013005874#gid=2013005874",
};

const ATHER_SHEETS_CONFIG = Object.freeze({
  RETAIL_URL: "https://docs.google.com/spreadsheets/d/1gnVRakNMws0OjshRTVYTeSFQkJlnt4IvDMEAzuakl4M/edit?gid=0#gid=0",
  AUTO_SYNC_ON_LOAD: true,
});
```

---

## Data Processing Config

### Data Cutoff (line ~445)
```js
const DATA_CUTOFF = new Date(2026, 4, 1);  // 01-May-2026
```

### Build Metadata (line ~447–448)
```js
const ATHER_BUILD_TS = '2026-09-23T00:00Z';
const ATHER_BUILD_FEATURES = ['canonPurMdl', 'ATHER_SCOPE_MODELS', 'window.atherRetailDiag', 'joined-fix', 'pipeline-diag', 'auto-qa'];
```

---

## Retail Attribution Config

### Scope Models (line ~1490)
```js
const ATHER_SCOPE_MODELS = new Set([
  'Ather Rizta',
  'Ather 450X',
  'Ather 450S',
  'Ather 450 Apex'
]);
```

### Attribution Window
- `d = atherMonthOrder(booking_month) - atherMonthOrder(lead_month)`
- In-scope: `d ∈ {0, 1, 2}` (hardcoded in `isRetailed()`)

---

## UI Config

### Font Scale Steps (line ~3528)
```js
const FONT_STEPS = [0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25];
```

Range: 85% to 125% of base font size, in 5% increments.

### Tabs (lines ~3530–3539)
```js
const TABS = [
  { id:'overview',   label:'Overview' },
  { id:'source',     label:'Source Analysis' },
  { id:'ltxsrc',     label:'LT × Source' },
  { id:'modelxsrc',  label:'Model Performance' },
  { id:'statexsrc',  label:'State Performance' },
  { id:'geodealer',  label:'Geo & Dealer' },
  { id:'dispersion', label:'Retail Dispersion' },  // excluded in visibleTabs
  { id:'pivot',      label:'Pivot Table' },
];
```

### Default State
```js
const [leadsMode, setLeadsMode] = useState('update');  // 'create' or 'update'
const [RT, setRT] = useState('all');                   // 'all', 'dms', or 'co'
const [tab, setTab] = useState('overview');            // default tab
```

---

## Source Classification Config

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

Source groups displayed in UI:
- **PAID**: ADWORDS + MS FB + WHATSAPP
- **ORG+NON MS**: ORGANIC + NON MS

---

## India Zone Config

```js
const INDIA_ZONE_STATES = {
  'North':     ['Delhi','Haryana','Himachal Pradesh','Jammu & Kashmir',...],
  'West':      ['Goa','Gujarat','Maharashtra',...],
  'South':     ['Andhra Pradesh','Karnataka','Kerala','Tamil Nadu','Telangana',...],
  'East':      ['Bihar','Jharkhand','Odisha','West Bengal','Sikkim'],
  'Central':   ['Chhattisgarh','Madhya Pradesh'],
  'Northeast': ['Assam','Meghalaya','Manipur','Mizoram','Nagaland','Tripura','Arunachal Pradesh'],
};
```

States not in any zone → `'Other'`.

---

## Enquiry Category Config

```js
const ENQUIRY_CAT = new Set(['Direct Push', 'L1 Nurtured']);
```

Used to count leads in the "Enquiries" column of the Source Analysis tab.
These are leads where `webId` (the "Direct Push / L1 Nurtured" column from Lead Master) matches.

---

## Retail Day-Bucket Config (Legacy)

```js
const BD_BUCKETS = ['0–7','8–14','15–30','31–60','61–90','90+'];
```

Used for Retail Dispersion (excluded from production tabs).
