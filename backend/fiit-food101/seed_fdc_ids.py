import csv, os, time, requests, sys

IN = "food101_to_fdc.csv"
OUT = "food101_to_fdc_ids.csv"
API_KEY = os.getenv("FDC_API_KEY")

if not API_KEY:
    print("FDC_API_KEY not set. Exiting without generating IDs.")
    sys.exit(0)

def search_fdc(q: str):
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {"api_key": API_KEY, "query": q, "pageSize": 1}
    r = requests.get(url, params=params, timeout=5)
    r.raise_for_status()
    js = r.json()
    if js.get("foods"):
        f = js["foods"][0]
        return {
            "fdcId": f.get("fdcId"),
            "description": f.get("description"),
            "dataType": f.get("dataType"),
        }
    return None

rows = []
with open(IN, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        label = row["label"].strip()
        q = row["fdcQuery"].strip()
        portion_g = row.get("portion_g","")
        notes = row.get("notes","")
        try:
            res = search_fdc(q)
            time.sleep(0.2)  # be polite
            if res:
                rows.append({
                    "label": label,
                    "fdcQuery": q,
                    "fdcId": res["fdcId"],
                    "fdcDescription": res["description"],
                    "dataType": res.get("dataType",""),
                    "portion_g": portion_g,
                    "notes": notes
                })
            else:
                rows.append({
                    "label": label,
                    "fdcQuery": q,
                    "fdcId": "",
                    "fdcDescription": "",
                    "dataType": "",
                    "portion_g": portion_g,
                    "notes": notes
                })
        except Exception as e:
            rows.append({
                "label": label,
                "fdcQuery": q,
                "fdcId": "",
                "fdcDescription": f"lookup_error: {e}",
                "dataType": "",
                "portion_g": portion_g,
                "notes": notes
            })

with open(OUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "label","fdcQuery","fdcId","fdcDescription","dataType","portion_g","notes"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"Wrote {len(rows)} rows to {OUT}")
