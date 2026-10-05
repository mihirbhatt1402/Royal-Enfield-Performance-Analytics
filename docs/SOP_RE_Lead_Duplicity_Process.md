# SOP: Royal Enfield Lead Duplicity & Booking Mapping

| | |
|---|---|
| **Process** | RE Lead Duplicity Status & Mobile Number Encryption |
| **Output** | Backend Google Sheet that feeds the RE LDR Dashboard |
| **Frequency** | Each time a fresh Lead Duplicity Report or client booking file is received (at least once a month) |
| **Owner** | _<Analyst name>_ |
| **Reviewer** | _<Team lead name>_ |
| **Version** | 1.0 |

---

## 1. Purpose

This SOP explains how to build the Royal Enfield (RE) lead master. Each lead in the master carries:

- its **Unique / Duplicate** status,
- an **encrypted mobile number** (EMN),
- campaign attributes (LT, Source, State, City, UTM, Model),
- its **booking status**, mapped from the client's booking data,
- its **Lead Month** and **Booking Month**.

The finished data goes into the **backend Google Sheet**. The nightly job `.github/workflows/refresh-data.yml` reads that sheet, and the RE LDR Dashboard (`RE_LDR/`) is built from it.

## 2. Inputs

| # | Input | Source | Used in step |
|---|---|---|---|
| 1 | **Lead Duplicity Report (RE)** with lead data and Unique/Duplicate status | Lead Duplicity Report download | Step 1 |
| 2 | **Encryption tool** | Internal encryption tool | Step 2 |
| 3 | **MS Source LT-wise (Lead level) report** | LD data | Step 3 |
| 4 | **Booking data** | Client, sent by email | Step 4 |
| 5 | **Backend Google Sheet** | Google Drive (sheet that the refresh workflow reads) | Step 6 |

## 3. Output: backend sheet layout

The data pipeline (`.github/scripts/process_leads.py`) reads columns **by position**. The backend sheet must therefore keep **exactly these 15 columns, in this order, with this header row**. Do not insert, delete or reorder columns.

| Col | Header | Filled in step | Format / allowed values | Example |
|---|---|---|---|---|
| A | Lead Date | 1 | Date, shown as `dddd, mmmm dd, yyyy` | `Saturday, March 07, 2026` |
| B | Lead Number | 1 | Text | `LEAD042461954` |
| C | Mobile Phone | 1 | Raw mobile number. **Not** published to the dashboard | — |
| D | EMN | 2 | Encrypted mobile number | — |
| E | Model | 3 | Full model name | `Royal Enfield Classic 350` |
| F | City | 3 | Text | `Bangalore` |
| G | State | 3 | Text | `Karnataka` |
| H | LT | 3 | LT code | `1105` |
| I | Source | 3 | `Organic`, `MS FB`, `Adwords`, `Whatsapp_Mkt`, `Non MS` | `MS FB` |
| J | UTM | 3 | **Plain text** (see section 6) or `0` / blank | `6847199870545` |
| K | Duplicate Check | 1 | `Unique` or `Duplicate` | `Unique` |
| L | Lead Month | 5 | `Mmm'YYYY` | `Mar'2026` |
| M | Booking Status | 4 | `Booked` or `Not Booked` | `Booked` |
| N | Booking Date | 4 | Date (blank if not booked) | — |
| O | Booking Month | 5 | `Mmm'YYYY`, or `-` if not booked | `Apr'2026` |

> The pipeline drops columns C, D and N before publishing. Mobile numbers never reach the dashboard. Rows with no valid Lead Month are skipped.

## 4. Procedure

### Step 1: Download the Lead Duplicity Report

1. Open the **Lead Duplicity Report (RE)**.
2. Set the date range for the period you are processing.
3. Download the lead data **with the Unique and Duplicate status** included.
4. Save the raw file without changes as `RE_Lead_Duplicity_<Mon>_<YYYY>_raw.xlsx`.
5. Check the following:
   - Every row has a **Lead Number** and a **Lead Date**.
   - Duplicate Check contains only `Unique` or `Duplicate`. Fix spelling and case if needed.
   - The row count matches the count shown in the report.

### Step 2: Encrypt the mobile numbers

1. Copy the **Mobile Phone** column from the Step 1 file.
2. Run the numbers through the **encryption tool**.
3. Paste the encrypted values into the **EMN** column. Keep the row order unchanged so each EMN stays next to its own lead.
4. Spot-check 5–10 rows to confirm that each EMN belongs to the correct mobile number and Lead Number.
5. Do not share or email the raw-mobile file outside the team. Share only the encrypted version.

### Step 3: Map LT, Source, State, City, UTM and Model

1. Open the **MS Source LT-wise (Lead level) report** from the LD data.
2. Use **Lead Number** as the lookup key. Map these fields into the lead file:
   - **LT**
   - **Source**
   - **State**
   - **City**
   - **UTM**
   - **Model**

   Example (Google Sheets / Excel), where the LD report is on a sheet called `LD`:

   ```
   =IFERROR(VLOOKUP($B2, LD!$A:$Z, <col_index>, FALSE), "")
   ```

   You can use `XLOOKUP` or `INDEX/MATCH` instead.
3. After mapping, paste the results back **as values** to remove the formulas.
4. Check the following:
   - Count the leads that did not match (blank LT or Source). Note the count, and send it to the LD data owner if it is large.
   - Source values must come from the allowed list in section 3. Standardise any variants.
   - The UTM column must be formatted as **Plain text** (see section 6).

### Step 4: Map bookings using the Lead Number

1. Download the **booking data** that the client sent by email. Save it as `RE_Bookings_<Mon>_<YYYY>.xlsx`.
2. Look up each lead's **Lead Number** in the booking data:
   - **Booking Status** = `Booked` if the Lead Number is in the booking data. Otherwise `Not Booked`.
   - **Booking Date** = the booking date from the client file. Leave it blank if the lead is not booked.

   ```
   M2: =IF(COUNTIF(Bookings!$A:$A, $B2) > 0, "Booked", "Not Booked")
   N2: =IFERROR(VLOOKUP($B2, Bookings!$A:$Z, <date_col>, FALSE), "")
   ```
3. Map the booking to **every row** with that Lead Number, including Duplicate rows. The dashboard counts each booking once against the lead's Unique row.
4. Check the following:
   - Total `Booked` rows should be close to the booking count in the client email. If the numbers do not match, list the booking Lead Numbers that are not in the lead data and report them.
   - No Booking Date should be earlier than its Lead Date. Check any rows where it is.

### Step 5: Create the Lead Month and Booking Month columns

1. **Lead Month** (column L), from Lead Date:
   ```
   =TEXT(A2,"mmm")&"'"&TEXT(A2,"yyyy")        → Mar'2026
   ```
2. **Booking Month** (column O), from Booking Date:
   ```
   =IF(N2="", "-", TEXT(N2,"mmm")&"'"&TEXT(N2,"yyyy"))   → Apr'2026 or -
   ```
3. Paste both columns **as values**.
4. The format must be exactly `Mmm'YYYY`: a three-letter month, a straight apostrophe `'`, and a four-digit year. Rows with any other format are dropped by the pipeline.

### Step 6: Update the backend Google Sheet

1. Open the **backend Google Sheet** that feeds the dashboard. Do not rename the sheet or its tab.
2. Check that the header row matches section 3 exactly.
3. Paste the new period's rows **as values**:
   - **Refresh of an existing month:** delete that month's old rows first, then paste the new rows. This prevents double counting.
   - **New month:** add the rows below the existing data.
4. Delete blank rows and stray totals or notes at the bottom of the sheet.
5. Wait for the nightly refresh at **02:00 UTC (07:30 IST)**. To update the dashboard sooner, go to the repository **Actions** tab and run **Refresh Lead Data** with *Run workflow*.
6. After the refresh, open the dashboard and check that Total Leads, Duplicity % and Bookings for the period match your working file.

## 5. Quality-control checklist (complete before Step 6)

- [ ] The row count matches the Lead Duplicity Report.
- [ ] No blank Lead Number, Lead Date or Duplicate Check.
- [ ] Duplicate Check contains only `Unique` or `Duplicate`.
- [ ] Every row has an EMN, and spot checks matched the correct rows.
- [ ] The unmapped LT/Source count is noted, and it is acceptable or has been escalated.
- [ ] Source values are from the allowed list.
- [ ] UTM is plain text, with no `E+` scientific notation.
- [ ] The Booked count matches the client email within the agreed tolerance.
- [ ] Lead Month and Booking Month use the `Mmm'YYYY` format. Booking Month is `-` when the lead is not booked.
- [ ] The 15 columns are in the order shown in section 3.
- [ ] All formulas are pasted as values.

## 6. Common issues

| Issue | Cause | Fix |
|---|---|---|
| UTM shows as `1.20237E+17` | Excel turned a long numeric ID into scientific notation, and the original digits are lost | Format the UTM column as **Plain text** *before* you paste or map. Then map UTM again from the LD report. |
| A month is missing on the dashboard | Lead Month is in the wrong format (for example `Mar-26`, `March 2026` or a curly `’`) | Rebuild the column with the Step 5 formula. |
| Bookings are lower on the dashboard than in the client email | The booking was more than 2 months after the lead month, or the Lead Number is not in the lead data | Expected behaviour: the dashboard counts a booking only if it falls in the lead month or the next 2 months. List any unmatched Lead Numbers for the client. |
| The refresh job fails with "suspiciously few rows" | The backend sheet was cleared, or the paste was cut short | Restore the sheet from its version history, paste again, and re-run **Refresh Lead Data**. |
| The dashboard shows wrong values in every column | A column was inserted or reordered in the backend sheet | Put the columns back in the section 3 order. |

## 7. Data privacy

- Raw mobile numbers (column C) are PII. Keep raw files in the team's restricted Drive folder only.
- Share data outside the team only with EMN and with Mobile Phone removed.
- Delete local raw downloads after the backend sheet has been updated.

## 8. Revision history

| Version | Date | Change | By |
|---|---|---|---|
| 1.0 | 2026-10-05 | First version, based on the handwritten process notes | — |
