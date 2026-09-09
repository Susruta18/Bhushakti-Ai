from pathlib import Path
import pandas as pd
import xarray as xr
import numpy as np
import re

BASE_DIR = Path(__file__).resolve().parent

GLC_FILE = BASE_DIR / "data" / "Global_Landslide_Catalog_Export_rows.csv"
GPM_DIR = BASE_DIR / "data" / "gpm_positive"
POSITIVE_FILE = BASE_DIR / "data" / "gpm_event_rainfall.csv"
OUTPUT_FILE = BASE_DIR / "data" / "gpm_training_rainfall.csv"

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

# Fixed seed = reproducible negative sampling
RNG = np.random.default_rng(42)

# Minimum separation from known landslide grid cells.
# 3 grid cells ~= 0.3 degrees (~30 km).
MIN_GRID_DISTANCE = 3


print("=" * 70)
print("BHUSHAKTI AI - NEGATIVE/BACKGROUND SAMPLE GENERATION")
print("=" * 70)


# ---------------------------------------------------------
# 1. Load positive rainfall data
# ---------------------------------------------------------

positive = pd.read_csv(POSITIVE_FILE)

positive["event_date"] = pd.to_datetime(
    positive["event_date"],
    errors="coerce"
)

positive["target"] = 1

print(f"Positive samples: {len(positive)}")


# ---------------------------------------------------------
# 2. Load GLC events
# ---------------------------------------------------------

glc = pd.read_csv(GLC_FILE)

glc["event_date"] = pd.to_datetime(
    glc["event_date"],
    errors="coerce"
)

events = glc[
    (glc["country_name"] == "India")
    & (glc["admin_division_name"].isin(NER_STATES))
    & (glc["event_date"].dt.year.between(2007, 2017))
].copy()

events = events.dropna(
    subset=[
        "event_date",
        "latitude",
        "longitude"
    ]
)

events["date_key"] = events["event_date"].dt.strftime("%Y-%m-%d")


# ---------------------------------------------------------
# 3. Prepare GPM file lookup by date
# ---------------------------------------------------------

gpm_files = {}

for file_path in GPM_DIR.glob("*.nc4"):

    match = re.search(
        r"\.(\d{8})-S",
        file_path.name
    )

    if match:

        date_key = pd.to_datetime(
            match.group(1),
            format="%Y%m%d"
        ).strftime("%Y-%m-%d")

        gpm_files[date_key] = file_path


print(f"GPM daily files: {len(gpm_files)}")


# ---------------------------------------------------------
# 4. Generate matched negative samples
# ---------------------------------------------------------

negative_rows = []

unique_dates = (
    positive["event_date"]
    .dt.strftime("%Y-%m-%d")
    .unique()
)

print(f"Dates requiring negatives: {len(unique_dates)}")
print()


for date_key in sorted(unique_dates):

    date_positive = positive[
        positive["event_date"].dt.strftime("%Y-%m-%d")
        == date_key
    ]

    required = len(date_positive)

    if date_key not in gpm_files:

        print(
            f"{date_key}: GPM file missing - skipped"
        )

        continue

    gpm_file = gpm_files[date_key]

    # Events recorded on this date
    date_events = events[
        events["date_key"] == date_key
    ]

    try:

        # -------------------------------------------------
        # Open GPM dataset
        # -------------------------------------------------

        ds = xr.open_dataset(
            gpm_file,
            engine="netcdf4"
        )

        precipitation = ds["precipitation"].isel(
            time=0
        )

        lats = ds["lat"].values
        lons = ds["lon"].values


        # -------------------------------------------------
        # Candidate grid cells
        # -------------------------------------------------

        candidates = []

        for lat_index, lat in enumerate(lats):

            for lon_index, lon in enumerate(lons):

                # Keep strictly inside NER GPM grid
                if not (
                    21 <= lat <= 30.5
                    and 88 <= lon <= 98
                ):
                    continue


                # -----------------------------------------
                # Exclude cells close to known events
                # -----------------------------------------

                too_close = False

                for _, event in date_events.iterrows():

                    event_lat = float(
                        event["latitude"]
                    )

                    event_lon = float(
                        event["longitude"]
                    )


                    event_lat_idx = np.abs(
                        lats - event_lat
                    ).argmin()

                    event_lon_idx = np.abs(
                        lons - event_lon
                    ).argmin()


                    lat_distance = abs(
                        lat_index - event_lat_idx
                    )

                    lon_distance = abs(
                        lon_index - event_lon_idx
                    )


                    if (
                        lat_distance <= MIN_GRID_DISTANCE
                        and
                        lon_distance <= MIN_GRID_DISTANCE
                    ):

                        too_close = True
                        break


                if too_close:
                    continue


                # -----------------------------------------
                # SAFE precipitation extraction
                # -----------------------------------------

                try:

                    raw_value = precipitation.isel(
                        lat=lat_index,
                        lon=lon_index
                    ).values

                    raw_value = np.asarray(
                        raw_value
                    ).squeeze()


                    # Must contain exactly one value
                    if raw_value.size != 1:
                        continue


                    value = float(raw_value)


                    # Skip NaN
                    if np.isnan(value):
                        continue


                    # Skip infinite values
                    if not np.isfinite(value):
                        continue


                except Exception:

                    # If one grid cell is problematic,
                    # skip only that cell.
                    continue


                # -----------------------------------------
                # Store candidate
                # -----------------------------------------

                candidates.append({

                    "lat": float(lat),

                    "lon": float(lon),

                    "lat_index": int(lat_index),

                    "lon_index": int(lon_index),

                    "rainfall24h": value,

                })


        # Close dataset
        ds.close()


        # -------------------------------------------------
        # Make sure enough candidates exist
        # -------------------------------------------------

        if len(candidates) < required:

            print(
                f"{date_key}: only "
                f"{len(candidates)} "
                f"safe candidates for "
                f"{required} required"
            )

            # Don't fabricate samples
            continue


        # -------------------------------------------------
        # Randomly select exactly required negatives
        # -------------------------------------------------

        selected_indices = RNG.choice(
            len(candidates),
            size=required,
            replace=False
        )


        for idx in selected_indices:

            candidate = candidates[idx]

            negative_rows.append({

                "event_id": (
                    f"NEG_"
                    f"{date_key.replace('-', '')}_"
                    f"{len(negative_rows) + 1:04d}"
                ),

                "event_date": date_key,

                "latitude": candidate["lat"],

                "longitude": candidate["lon"],

                "admin_division_name":
                    "NER_BACKGROUND",

                "rainfall24h":
                    candidate["rainfall24h"],

                "gpm_lat":
                    candidate["lat"],

                "gpm_lon":
                    candidate["lon"],

                "target": 0,

                "sample_type":
                    "BACKGROUND_NO_RECORDED_LANDSLIDE",

            })


        print(
            f"{date_key}: generated "
            f"{required} negative samples"
        )


    except Exception as e:

        print(
            f"{date_key}: ERROR -> {e}"
        )


# ---------------------------------------------------------
# 5. Build final rainfall training table
# ---------------------------------------------------------

negative = pd.DataFrame(
    negative_rows
)


print()
print("=" * 70)
print("NEGATIVE SAMPLE SUMMARY")
print("=" * 70)

print(
    f"Positive samples : "
    f"{len(positive)}"
)

print(
    f"Negative samples : "
    f"{len(negative)}"
)


if negative.empty:

    print(
        "ERROR: No negative samples generated."
    )

    raise SystemExit(1)


# ---------------------------------------------------------
# Prepare positive dataset
# ---------------------------------------------------------

positive["sample_type"] = (
    "RECORDED_LANDSLIDE"
)

positive["target"] = 1


# ---------------------------------------------------------
# Keep common columns
# ---------------------------------------------------------

columns = [

    "event_id",

    "event_date",

    "latitude",

    "longitude",

    "admin_division_name",

    "rainfall24h",

    "gpm_lat",

    "gpm_lon",

    "target",

    "sample_type",

]


positive = positive[columns]

negative = negative[columns]


# ---------------------------------------------------------
# Combine positive + negative
# ---------------------------------------------------------

combined = pd.concat(

    [
        positive,
        negative
    ],

    ignore_index=True

)


# ---------------------------------------------------------
# Shuffle reproducibly
# ---------------------------------------------------------

combined = combined.sample(

    frac=1,

    random_state=42

).reset_index(drop=True)


# ---------------------------------------------------------
# 6. Save final dataset
# ---------------------------------------------------------

combined.to_csv(

    OUTPUT_FILE,

    index=False

)


# ---------------------------------------------------------
# 7. Final summary
# ---------------------------------------------------------

print()
print("=" * 70)
print("FINAL DATASET")
print("=" * 70)

print(
    f"Total rows      : "
    f"{len(combined)}"
)

print(
    f"Landslide (1)   : "
    f"{(combined['target'] == 1).sum()}"
)

print(
    f"Background (0)  : "
    f"{(combined['target'] == 0).sum()}"
)

print(
    f"Missing rainfall: "
    f"{combined['rainfall24h'].isna().sum()}"
)


print()
print("Target distribution:")

print(
    combined["target"].value_counts()
)


print()
print("Output:")

print(
    OUTPUT_FILE
)


print()
print("Finished.")