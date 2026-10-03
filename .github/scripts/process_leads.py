"""
process_leads.py — Royal Enfield LDR data pipeline
Called by .github/workflows/refresh-data.yml after downloading the raw CSV.

Reads /tmp/leads_raw.csv, strips unused columns, splits by year into
compact JSON files at RE_LDR/data/leads_<year>.json, and writes a
manifest at RE_LDR/data/manifest.json.
"""
import csv
import json
import os
import re
from datetime import datetime, timezone

# Original sheet columns (0-based):
# 0  Lead Date        → keep (used as Create Date)
# 1  Lead Number      → keep
# 2  Mobile Phone     → DROP (PII, not used by dashboard)
# 3  EMN              → DROP (encrypted PII, not used)
# 4  Model            → keep
# 5  City             → keep
# 6  State            → keep
# 7  LT               → keep
# 8  Source           → keep
# 9  UTM              → keep (maps to utm_campaign)
# 10 Duplicate Check  → keep
# 11 Lead Month       → keep
# 12 Booking Status   → keep
# 13 Booking Date     → DROP (not used; Booking Month is sufficient)
# 14 Booking Month    → keep

KEEP_INDICES = [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14]
OUT_HEADERS = [
    "Lead Date", "Lead Number", "Model", "City", "State",
    "LT", "Source", "UTM", "Duplicate Check",
    "Lead Month", "Booking Status", "Booking Month",
]

# After column selection, Lead Month is at index 9
LEAD_MONTH_IDX = 9


def get_year(lead_month_str):
    """'Mar'2026' → 2026,  'Mar'26' → 2026,  anything else → None"""
    m = re.search(r"'(\d+)$", lead_month_str or "")
    if not m:
        return None
    yr = int(m.group(1))
    return yr + 2000 if yr < 100 else yr


def main():
    rows_by_year = {}
    total = 0

    with open("/tmp/leads_raw.csv", newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        _original_headers = next(reader)   # discard original header row
        for row in reader:
            if len(row) < 15:
                continue
            selected = [row[i] for i in KEEP_INDICES]
            yr = get_year(selected[LEAD_MONTH_IDX])
            if yr is None:
                continue
            rows_by_year.setdefault(yr, []).append(selected)
            total += 1

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    os.makedirs("RE_LDR/data", exist_ok=True)

    manifest_files = []
    for yr, rows in sorted(rows_by_year.items()):
        fname = f"RE_LDR/data/leads_{yr}.json"
        payload = {
            "generated": generated,
            "headers": OUT_HEADERS,
            "rows": rows,
        }
        with open(fname, "w", encoding="utf-8") as f:
            json.dump(payload, f, separators=(",", ":"), ensure_ascii=False)
        size_mb = os.path.getsize(fname) / 1024 / 1024
        print(f"  {fname}: {len(rows):,} rows, {size_mb:.1f} MB")
        manifest_files.append(f"./data/leads_{yr}.json")

    manifest = {
        "generated": generated,
        "files": manifest_files,
        "total_rows": total,
    }
    with open("RE_LDR/data/manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))

    print(f"\nTotal: {total:,} rows across {len(rows_by_year)} year(s)")
    print(f"Manifest files: {manifest_files}")


if __name__ == "__main__":
    main()
