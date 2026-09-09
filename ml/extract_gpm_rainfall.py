from pathlib import Path
import pandas as pd
import xarray as xr
import numpy as np

BASE_DIR = Path(__file__).resolve().parent

GLC_FILE = BASE_DIR / "data" / "Global_Landslide_Catalog_Export_rows.csv"
GPM_DIR = BASE_DIR / "data" / "gpm_positive"
OUTPUT_FILE = BASE_DIR / "data" / "gpm_event_rainfall.csv"

NER_STATES = [
    "Assam",
    "Arunachal Pradesh",
    "Arunāchal Pradesh",
    "Manipur",
    "Meghalaya",
    "Meghālaya",
    "Mizoram",
    "Nagaland",
    "Nāgāland",
    "Sikkim",
    "Tripura",
]

print("=" * 70)
print("BHUSHAKTI AI - GPM RAINFALL EXTRACTION")
print("=" * 70)

# ---------------------------------------------------------
# 1. Load GLC
# ---------------------------------------------------------

glc = pd.read_csv(GLC_FILE)

glc["event_date"] = pd.to_datetime(
    glc["event_date"],
    errors="coerce"
)

# NER + 2007-2017
events = glc[
    (glc["country_name"] == "India")
    & (glc["admin_division_name"].isin(NER_STATES))
    & (glc["event_date"].dt.year.between(2007, 2017))
].copy()

events = events.dropna(
    subset=["event_date", "latitude", "longitude"]
)

print(f"NER events with coordinates: {len(events)}")

# ---------------------------------------------------------
# 2. Create date lookup
# ---------------------------------------------------------

events["date_key"] = events["event_date"].dt.strftime("%Y%m%d")

# ---------------------------------------------------------
# 3. Process GPM files
# ---------------------------------------------------------

gpm_files = sorted(GPM_DIR.glob("*.nc4"))

print(f"GPM files available: {len(gpm_files)}")
print()

results = []

for index, file_path in enumerate(gpm_files, 1):

    # Extract YYYYMMDD from filename
    name = file_path.name

    date_part = None

    for token in name.split("."):
        if len(token) >= 8 and token[:8].isdigit():
            date_part = token[:8]
            break

    if date_part is None:
        print(f"[{index}] Could not determine date: {name}")
        continue

    daily_events = events[
        events["date_key"] == date_part
    ]

    if daily_events.empty:
        continue

    print(
        f"[{index}/{len(gpm_files)}] "
        f"{date_part} -> {len(daily_events)} event(s)"
    )

    try:

        ds = xr.open_dataset(file_path)

        precipitation = ds["precipitation"].isel(time=0)

        # Check coordinates
        lats = ds["lat"].values
        lons = ds["lon"].values

        for _, event in daily_events.iterrows():

            event_lat = float(event["latitude"])
            event_lon = float(event["longitude"])

            # NER boundary check
            if not (21 <= event_lat <= 30.5):
                continue

            if not (88 <= event_lon <= 98):
                continue

            # Nearest grid point
            lat_index = np.abs(
                lats - event_lat
            ).argmin()

            lon_index = np.abs(
                lons - event_lon
            ).argmin()

            rainfall = precipitation.isel(
                lat=lat_index,
                lon=lon_index
            ).values.item()

            if np.isnan(rainfall):
                rainfall_value = None
            else:
                rainfall_value = float(rainfall)

            results.append({
                "event_id": event["event_id"],
                "event_date": event["event_date"].strftime("%Y-%m-%d"),
                "latitude": event_lat,
                "longitude": event_lon,
                "admin_division_name": event[
                    "admin_division_name"
                ],
                "rainfall24h": rainfall_value,
                "gpm_lat": float(lats[lat_index]),
                "gpm_lon": float(lons[lon_index]),
            })

        ds.close()

    except Exception as e:

        print(f"  ERROR: {e}")

# ---------------------------------------------------------
# 4. Save result
# ---------------------------------------------------------

result_df = pd.DataFrame(results)

if result_df.empty:
    print()
    print("ERROR: No rainfall observations were extracted.")
    raise SystemExit(1)

result_df.to_csv(
    OUTPUT_FILE,
    index=False
)

# ---------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------

print()
print("=" * 70)
print("EXTRACTION SUMMARY")
print("=" * 70)

print(f"Rows extracted : {len(result_df)}")
print(
    f"Unique events  : "
    f"{result_df['event_id'].nunique()}"
)

print(
    f"Missing rainfall: "
    f"{result_df['rainfall24h'].isna().sum()}"
)

print(
    f"Rainfall min   : "
    f"{result_df['rainfall24h'].min()}"
)

print(
    f"Rainfall max   : "
    f"{result_df['rainfall24h'].max()}"
)

print(
    f"Rainfall mean  : "
    f"{result_df['rainfall24h'].mean()}"
)

print()
print(f"Output saved to:")
print(OUTPUT_FILE)

print()
print("Finished.")
