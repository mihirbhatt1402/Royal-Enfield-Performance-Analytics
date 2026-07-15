"""
Reads TVS Leads + Retails XLSX locally, builds aggregated JSON payload,
and POSTs it to the Apps Script web app to store in Script Properties.
"""
import json, sys, urllib.request, urllib.parse
import pandas as pd
from pathlib import Path

LEADS_PATH   = r"C:\Users\mihir.bhatt\Downloads\Leads Data Master_Leads_FY_26_27.xlsx"
RETAILS_PATH = r"C:\Users\mihir.bhatt\Downloads\Retail Data Master_Retails_FY_26_27.xlsx"
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwzgnXPbCbunBblnMUrqdWg3eY9qsIwCrFxuYuvYSpxtH22l4Cs32vdkOkDhUn-qwM64w/exec"
SECRET = "tvs2026push"

def to_id(v):
    if pd.isna(v):
        return ""
    try:
        return str(int(float(v)))
    except Exception:
        return str(v).strip()

def build_payload():
    print("Reading Retails…", flush=True)
    ret = pd.read_excel(RETAILS_PATH, dtype=str)
    ret.columns = [c.strip() for c in ret.columns]

    ret_id_col = next((c for c in ret.columns if c.lower().replace(' ','') in ('sorceleadid','sourceleadid')), None)
    ret_mth_col = next((c for c in ret.columns if c.lower() == 'retail month'), None)
    if not ret_id_col:
        raise ValueError(f"Cannot find SorceLeadId in Retails. Columns: {list(ret.columns)}")

    retail_map = {}
    for _, row in ret.iterrows():
        rid = to_id(row.get(ret_id_col, ''))
        if rid:
            retail_map[rid] = {'rm': str(row.get(ret_mth_col, '') or '')}
    print(f"Retail records: {len(retail_map):,}", flush=True)

    print("Reading Leads…", flush=True)
    leads = pd.read_excel(LEADS_PATH, dtype=str)
    leads.columns = [c.strip() for c in leads.columns]

    def col(candidates):
        for c in candidates:
            match = next((x for x in leads.columns if x.lower().replace(' ','').replace('_','') == c.lower().replace(' ','').replace('_','')), None)
            if match:
                return match
        return None

    id_col   = col(['SorceLeadId', 'SourceLeadId'])
    lm_col   = col(['LeadMonth', 'Lead Month'])
    src_col  = col(['Source'])
    lt_col   = col(['LeadType', 'Lead Type'])
    mdl_col  = col(['ModelName', 'Model Name'])
    st_col   = col(['State'])
    zone_col = col(['Zone'])
    bd_col   = col(['BuyingDays', 'Buying Days'])
    city_col = col(['CityName', 'City Name', 'City'])

    if not id_col:
        raise ValueError(f"Cannot find SorceLeadId in Leads. Columns: {list(leads.columns)}")

    lm_idx,  src_idx, lt_idx, mdl_idx, st_idx, zone_idx, city_idx = {},{},{},{},{},{},{}
    lm_arr,  src_arr, lt_arr, mdl_arr, st_arr, zone_arr, city_arr = [],[],[],[],[],[],[]
    u_lm_idx = {}   # update-month (retail date) index
    u_lm_arr = []

    def ix(d, arr, v):
        if v not in d:
            d[v] = len(arr)
            arr.append(v)
        return d[v]

    monthly, sm, ltm, mm, stm, zm, bdm, cm = {},{},{},{},{},{},{},{}
    u_monthly, u_sm, u_ltm, u_mm, u_stm, u_zm, u_bdm = {},{},{},{},{},{},{}

    def bump(d, k, is_ret):
        if k not in d:
            d[k] = [0, 0]
        d[k][0] += 1
        if is_ret:
            d[k][1] += 1

    total = len(leads)
    print(f"Processing {total:,} lead rows…", flush=True)
    for i, (_, row) in enumerate(leads.iterrows()):
        if i % 100000 == 0 and i > 0:
            print(f"  {i:,} / {total:,} ({100*i//total}%)", flush=True)
        lid  = to_id(row.get(id_col, ''))
        lm   = str(row.get(lm_col,   '') or '').strip()
        src  = str(row.get(src_col,  '') or '').strip() or 'Unknown'
        lt   = str(row.get(lt_col,   '') or '').strip() or 'Unknown'
        mdl  = str(row.get(mdl_col,  '') or '').strip() or 'Unknown'
        st   = str(row.get(st_col,   '') or '').strip() or 'Unknown'
        zone = str(row.get(zone_col, '') or '').strip() or 'Unknown'
        bd   = str(row.get(bd_col,   '') or '0').strip() or '0'
        city = str(row.get(city_col, '') or '').strip() or 'Unknown' if city_col else 'Unknown'

        if not lm or not lid:
            continue

        is_ret = lid in retail_map
        li   = ix(lm_idx,   lm_arr,   lm)
        si   = ix(src_idx,  src_arr,  src)
        tti  = ix(lt_idx,   lt_arr,   lt)
        mi   = ix(mdl_idx,  mdl_arr,  mdl)
        sti  = ix(st_idx,   st_arr,   st)
        zi   = ix(zone_idx, zone_arr, zone)
        cti  = ix(city_idx, city_arr, city)

        bump(monthly, li,                  is_ret)
        bump(sm,      f"{si}|{li}",        is_ret)
        bump(ltm,     f"{tti}|{si}|{li}", is_ret)
        bump(mm,      f"{mi}|{si}|{li}",  is_ret)
        bump(stm,     f"{sti}|{si}|{li}", is_ret)
        bump(zm,      f"{zi}|{li}",        is_ret)
        bump(bdm,     f"{bd}|{si}|{li}",  is_ret)
        bump(cm,      f"{cti}|{li}",       is_ret)

        # On Update: use retail month for retailed leads, else lead month
        rm = retail_map[lid].get('rm', '') if is_ret else ''
        um = rm if rm else lm
        uli = ix(u_lm_idx, u_lm_arr, um)
        bump(u_monthly, uli,                   is_ret)
        bump(u_sm,      f"{si}|{uli}",         is_ret)
        bump(u_ltm,     f"{tti}|{si}|{uli}",  is_ret)
        bump(u_mm,      f"{mi}|{si}|{uli}",   is_ret)
        bump(u_stm,     f"{sti}|{si}|{uli}",  is_ret)
        bump(u_zm,      f"{zi}|{uli}",         is_ret)
        bump(u_bdm,     f"{bd}|{si}|{uli}",   is_ret)

    def to_rows(d, key_fn):
        return [[*key_fn(k), v[0], v[1]] for k, v in d.items()]

    payload = {
        "t": pd.Timestamp.now().isoformat(),
        "maps": {
            "lm":   lm_arr,  "src": src_arr, "lt": lt_arr, "mdl": mdl_arr,
            "st":   st_arr,  "zone": zone_arr, "city": city_arr,
            "u_lm": u_lm_arr,
        },
        "monthly":   to_rows(monthly, lambda k: [int(k)]),
        "sm":        to_rows(sm,  lambda k: list(map(int, k.split("|")))),
        "ltm":       to_rows(ltm, lambda k: list(map(int, k.split("|")))),
        "mm":        to_rows(mm,  lambda k: list(map(int, k.split("|")))),
        "stm":       to_rows(stm, lambda k: list(map(int, k.split("|")))),
        "zm":        to_rows(zm,  lambda k: list(map(int, k.split("|")))),
        "bdm":       to_rows(bdm, lambda k: [int(k.split("|")[0])] + list(map(int, k.split("|")[1:]))),
        "cm":        to_rows(cm,  lambda k: list(map(int, k.split("|")))),
        "u_monthly": to_rows(u_monthly, lambda k: [int(k)]),
        "u_sm":      to_rows(u_sm,  lambda k: list(map(int, k.split("|")))),
        "u_ltm":     to_rows(u_ltm, lambda k: list(map(int, k.split("|")))),
        "u_mm":      to_rows(u_mm,  lambda k: list(map(int, k.split("|")))),
        "u_stm":     to_rows(u_stm, lambda k: list(map(int, k.split("|")))),
        "u_zm":      to_rows(u_zm,  lambda k: list(map(int, k.split("|")))),
        "u_bdm":     to_rows(u_bdm, lambda k: [int(k.split("|")[0])] + list(map(int, k.split("|")[1:]))),
    }
    print(f"Cities: {len(city_arr):,}  City×Month rows: {len(cm):,}  UpdateMonths: {len(u_lm_arr):,}", flush=True)
    print(f"Done — {total:,} leads · {len(retail_map):,} retails", flush=True)
    return payload

print("=" * 60)
payload = build_payload()
json_str = json.dumps(payload, separators=(',', ':'))
print(f"Payload size: {len(json_str)/1024:.1f} KB", flush=True)

print("POSTing to Apps Script…", flush=True)
url = APPS_SCRIPT_URL + "?secret=" + SECRET
data = json_str.encode("utf-8")
req = urllib.request.Request(url, data=data, method="POST",
      headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=30) as resp:
    body = resp.read().decode()
print(f"Response: {body}", flush=True)
print("=" * 60)
