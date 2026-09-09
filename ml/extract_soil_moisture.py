from pathlib import Path
import os
import time

import pandas as pd
import numpy as np
import requests
import xarray as xr


# =========================================================
# BHUSHAKTI AI
# HISTORICAL GLDAS SOIL MOISTURE EXTRACTION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "gpm_training_topography.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "gpm_training_soil_moisture.csv"
)

CACHE_DIR = (
    BASE_DIR
    / "data"
    / "gldas_cache"
)

CACHE_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# Configuration
# =========================================================

TOKEN = os.environ.get(
    "EARTHDATA_TOKEN"
)

if not TOKEN:

    print(
        "ERROR: EARTHDATA_TOKEN is not set."
    )

    raise SystemExit(1)


GLDAS_BASE = (
    "https://hydro1.gesdisc.eosdis.nasa.gov"
    "/data/GLDAS/"
    "GLDAS_NOAH025_3H.2.1"
)

VARIABLE = "SoilMoi0_10cm_inst"

# Use 00:00 UTC consistently
GLDAS_TIME = "0000"


# =========================================================
# HTTP Session
# =========================================================

session = requests.Session()

session.headers.update({
    "Authorization":
        f"Bearer {TOKEN}",

    "User-Agent":
        "BhushaktiAI/1.0"
})


# =========================================================
# Build GLDAS URL
# =========================================================

def build_gldas_url(date):

    year = date.year

    day_of_year = int(
        date.strftime("%j")
    )

    date_string = date.strftime(
        "%Y%m%d"
    )

    filename = (
        f"GLDAS_NOAH025_3H."
        f"A{date_string}."
        f"{GLDAS_TIME}."
        f"021.nc4"
    )

    url = (
        f"{GLDAS_BASE}/"
        f"{year}/"
        f"{day_of_year:03d}/"
        f"{filename}"
    )

    return url


# =========================================================
# Download GLDAS file
# =========================================================

def download_gldas(date):

    date_string = date.strftime(
        "%Y%m%d"
    )

    output_file = (
        CACHE_DIR
        / f"GLDAS_{date_string}_{GLDAS_TIME}.nc4"
    )


    # -----------------------------------------------------
    # Reuse cached file
    # -----------------------------------------------------

    if (
        output_file.exists()
        and
        output_file.stat().st_size > 100000
    ):

        print(
            "  Using cached file."
        )

        return output_file


    url = build_gldas_url(
        date
    )


    print(
        "  Downloading GLDAS..."
    )

    print(
        f"  URL: {url}"
    )


    temp_file = output_file.with_suffix(
        ".nc4.part"
    )


    try:

        response = session.get(
            url,
            stream=True,
            timeout=180
        )


        print(
            f"  HTTP: {response.status_code}"
        )


        if response.status_code != 200:

            raise RuntimeError(
                f"HTTP {response.status_code}"
            )


        total_size = (
            response.headers.get(
                "content-length"
            )
        )


        if total_size:

            total_size = int(
                total_size
            )


        downloaded = 0


        with open(
            temp_file,
            "wb"
        ) as f:

            for chunk in response.iter_content(
                chunk_size=1024 * 1024
            ):

                if not chunk:
                    continue


                f.write(
                    chunk
                )


                downloaded += len(
                    chunk
                )


                if total_size:

                    percent = (
                        downloaded
                        /
                        total_size
                        *
                        100
                    )

                    print(
                        f"\r  Progress: "
                        f"{percent:6.2f}%",
                        end=""
                    )

                else:

                    print(
                        f"\r  Downloaded: "
                        f"{downloaded / 1024 / 1024:.1f} MB",
                        end=""
                    )


        print()


        # -------------------------------------------------
        # Validate file
        # -------------------------------------------------

        if (
            not temp_file.exists()
            or
            temp_file.stat().st_size < 100000
        ):

            raise RuntimeError(
                "Downloaded file is too small."
            )


        # -------------------------------------------------
        # Rename safely
        # -------------------------------------------------

        temp_file.replace(
            output_file
        )


        print(
            f"  Saved: "
            f"{output_file.name}"
        )


        return output_file


    except Exception:

        if temp_file.exists():

            try:
                temp_file.unlink()
            except Exception:
                pass

        raise


# =========================================================
# Extract soil moisture from one file
# =========================================================

def extract_soil_moisture(
    nc_file,
    latitude,
    longitude
):

    ds = xr.open_dataset(
        nc_file
    )


    try:

        if VARIABLE not in ds:

            raise RuntimeError(
                f"Variable {VARIABLE} "
                f"not found. "
                f"Available: "
                f"{list(ds.data_vars)}"
            )


        da = ds[
            VARIABLE
        ]


        # -------------------------------------------------
        # Remove time dimension
        # -------------------------------------------------

        if "time" in da.dims:

            da = da.isel(
                time=0
            )


        # -------------------------------------------------
        # Find latitude coordinate
        # -------------------------------------------------

        lat_name = None

        for name in [
            "lat",
            "latitude"
        ]:

            if name in da.coords:

                lat_name = name

                break


        # -------------------------------------------------
        # Find longitude coordinate
        # -------------------------------------------------

        lon_name = None

        for name in [
            "lon",
            "longitude"
        ]:

            if name in da.coords:

                lon_name = name

                break


        if (
            lat_name is None
            or
            lon_name is None
        ):

            raise RuntimeError(
                "Latitude/longitude "
                "coordinates not found."
            )


        # -------------------------------------------------
        # Nearest GLDAS grid cell
        # -------------------------------------------------

        selected = da.sel(
            {
                lat_name:
                    latitude,

                lon_name:
                    longitude
            },
            method="nearest"
        )


        value = np.asarray(
            selected.values
        ).squeeze()


        if value.size != 1:

            raise RuntimeError(
                f"Unexpected value shape: "
                f"{value.shape}"
            )


        value = float(
            value
        )


        if not np.isfinite(
            value
        ):

            return np.nan


        return value


    finally:

        ds.close()


# =========================================================
# START
# =========================================================

print("=" * 70)

print(
    "BHUSHAKTI AI - GLDAS SOIL MOISTURE EXTRACTION"
)

print("=" * 70)


# =========================================================
# 1. Load dataset
# =========================================================

df = pd.read_csv(
    INPUT_FILE
)


RAW_ROWS = len(
    df
)


print(
    f"Raw input rows: {RAW_ROWS}"
)


# ---------------------------------------------------------
# IMPORTANT
# ---------------------------------------------------------

if RAW_ROWS != 702:

    raise RuntimeError(
        f"Expected 702 rows, "
        f"but found {RAW_ROWS}."
    )


# =========================================================
# 2. Parse columns
# =========================================================

# IMPORTANT FIX:
# format="mixed" prevents valid positive dates
# such as "2012-06-10 00:00:00" from becoming NaT.

df["event_date"] = pd.to_datetime(
    df["event_date"],
    format="mixed",
    errors="coerce"
)


df["latitude"] = pd.to_numeric(
    df["latitude"],
    errors="coerce"
)


df["longitude"] = pd.to_numeric(
    df["longitude"],
    errors="coerce"
)


# =========================================================
# 3. Validate WITHOUT dropping rows
# =========================================================

invalid_mask = (
    df["event_date"].isna()
    |
    df["latitude"].isna()
    |
    df["longitude"].isna()
)


invalid_count = int(
    invalid_mask.sum()
)


print(
    f"Invalid coordinate/date rows: "
    f"{invalid_count}"
)


if invalid_count != 0:

    print()

    print(
        "Invalid rows:"
    )

    print(
        df.loc[
            invalid_mask,
            [
                "event_id",
                "event_date",
                "latitude",
                "longitude"
            ]
        ]
    )

    raise RuntimeError(
        "Input contains invalid rows. "
        "No rows were dropped."
    )


# =========================================================
# 4. Confirm row count
# =========================================================

if len(df) != 702:

    raise RuntimeError(
        f"Row count changed unexpectedly: "
        f"{len(df)}"
    )


print()

print(
    "Target distribution:"
)

print(
    df["target"].value_counts()
)


# =========================================================
# 5. Create date key
# =========================================================

df["_date_key"] = (
    df["event_date"]
    .dt.strftime(
        "%Y-%m-%d"
    )
)


unique_dates = sorted(
    df["_date_key"].unique()
)


print()

print(
    f"Training samples: {len(df)}"
)

print(
    f"Unique dates: {len(unique_dates)}"
)

print(
    f"Date range: "
    f"{df['event_date'].min().date()} "
    f"to "
    f"{df['event_date'].max().date()}"
)

print()


# =========================================================
# 6. Storage
# =========================================================

soil_values = {}

failed_dates = []


# =========================================================
# 7. Process every unique date
# =========================================================

for count, date_key in enumerate(
    unique_dates,
    start=1
):

    date = pd.Timestamp(
        date_key
    )


    print(
        "=" * 70
    )

    print(
        f"[{count}/{len(unique_dates)}] "
        f"{date_key}"
    )


    try:

        # -------------------------------------------------
        # Download / reuse GLDAS file
        # -------------------------------------------------

        nc_file = download_gldas(
            date
        )


        # -------------------------------------------------
        # Find samples on this date
        # -------------------------------------------------

        date_mask = (
            df["_date_key"]
            ==
            date_key
        )


        date_indices = df.index[
            date_mask
        ]


        print(
            f"  Samples on date: "
            f"{len(date_indices)}"
        )


        # -------------------------------------------------
        # Open file ONCE
        # -------------------------------------------------

        ds = xr.open_dataset(
            nc_file
        )


        try:

            if VARIABLE not in ds:

                raise RuntimeError(
                    f"{VARIABLE} not found. "
                    f"Available: "
                    f"{list(ds.data_vars)}"
                )


            da = ds[
                VARIABLE
            ]


            # -------------------------------------------------
            # Remove time dimension
            # -------------------------------------------------

            if "time" in da.dims:

                da = da.isel(
                    time=0
                )


            # -------------------------------------------------
            # Detect coordinates
            # -------------------------------------------------

            lat_name = None
            lon_name = None


            for name in [
                "lat",
                "latitude"
            ]:

                if name in da.coords:

                    lat_name = name

                    break


            for name in [
                "lon",
                "longitude"
            ]:

                if name in da.coords:

                    lon_name = name

                    break


            if (
                lat_name is None
                or
                lon_name is None
            ):

                raise RuntimeError(
                    "Could not identify "
                    "GLDAS coordinates."
                )


            # -------------------------------------------------
            # Extract all samples for date
            # -------------------------------------------------

            for idx in date_indices:

                latitude = float(
                    df.loc[
                        idx,
                        "latitude"
                    ]
                )


                longitude = float(
                    df.loc[
                        idx,
                        "longitude"
                    ]
                )


                selected = da.sel(
                    {
                        lat_name:
                            latitude,

                        lon_name:
                            longitude
                    },
                    method="nearest"
                )


                value = np.asarray(
                    selected.values
                ).squeeze()


                if value.size != 1:

                    raise RuntimeError(
                        f"Unexpected shape "
                        f"for row {idx}: "
                        f"{value.shape}"
                    )


                value = float(
                    value
                )


                if np.isfinite(
                    value
                ):

                    soil_values[
                        idx
                    ] = value

                else:

                    soil_values[
                        idx
                    ] = np.nan


        finally:

            ds.close()


        # -------------------------------------------------
        # Date summary
        # -------------------------------------------------

        valid_count = sum(

            1

            for idx in date_indices

            if (
                idx in soil_values
                and
                np.isfinite(
                    soil_values[idx]
                )
            )
        )


        print(
            f"  Valid soil moisture: "
            f"{valid_count}/"
            f"{len(date_indices)}"
        )


    except Exception as e:

        print(
            f"  ERROR: {e}"
        )


        failed_dates.append(
            (
                date_key,
                str(e)
            )
        )


    time.sleep(
        0.2
    )


# =========================================================
# 8. Add soil moisture column
# =========================================================

df["soilMoisture"] = np.nan


for idx, value in soil_values.items():

    df.loc[
        idx,
        "soilMoisture"
    ] = value


# =========================================================
# 9. Remove helper column
# =========================================================

df.drop(
    columns=[
        "_date_key"
    ],
    inplace=True
)


# =========================================================
# 10. Final validation
# =========================================================

if len(df) != 702:

    raise RuntimeError(
        "FINAL DATASET ROW COUNT ERROR."
    )


# =========================================================
# 11. Save
# =========================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# =========================================================
# 12. Save failed dates
# =========================================================

if failed_dates:

    failed_file = (
        BASE_DIR
        / "data"
        / "gldas_failed_dates.txt"
    )


    failed_file.write_text(
        "\n".join(
            f"{date}: {error}"
            for date, error
            in failed_dates
        ),
        encoding="utf-8"
    )


# =========================================================
# 13. Final summary
# =========================================================

print()

print("=" * 70)

print(
    "SOIL MOISTURE EXTRACTION SUMMARY"
)

print("=" * 70)


print(
    f"Input samples        : {RAW_ROWS}"
)

print(
    f"Final samples        : {len(df)}"
)

print(
    f"Valid soil moisture  : "
    f"{df['soilMoisture'].notna().sum()}"
)

print(
    f"Missing soil moisture: "
    f"{df['soilMoisture'].isna().sum()}"
)

print(
    f"Failed dates         : "
    f"{len(failed_dates)}"
)


if df[
    "soilMoisture"
].notna().any():

    print(
        f"Soil moisture min  : "
        f"{df['soilMoisture'].min():.4f}"
    )

    print(
        f"Soil moisture max  : "
        f"{df['soilMoisture'].max():.4f}"
    )

    print(
        f"Soil moisture mean : "
        f"{df['soilMoisture'].mean():.4f}"
    )


print()

print(
    "Output:"
)

print(
    OUTPUT_FILE
)


if failed_dates:

    print()

    print(
        "Failed dates saved to:"
    )

    print(
        BASE_DIR
        / "data"
        / "gldas_failed_dates.txt"
    )


print()

print(
    "Finished."
)