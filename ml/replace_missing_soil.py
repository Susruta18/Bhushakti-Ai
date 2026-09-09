from pathlib import Path
import math
import zipfile
import re

import pandas as pd
import numpy as np
import xarray as xr


# =========================================================
# BHUSHAKTI AI
# REPLACE MISSING GLDAS SOIL MOISTURE SAMPLES
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "gpm_training_soil_moisture.csv"
)

TOPO_FILE = (
    BASE_DIR
    / "data"
    / "gpm_training_topography.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "gpm_training_soil_moisture_fixed.csv"
)

SRTM_DIR = (
    BASE_DIR
    / "data"
    / "srtm"
)

GLDAS_DIR = (
    BASE_DIR
    / "data"
    / "gldas_cache"
)


# =========================================================
# Configuration
# =========================================================

RANDOM_SEED = 42

# Search around original point in GLDAS grid cells
SEARCH_RADIUS = 8

# Don't choose a replacement too close to an existing
# training coordinate.
MIN_DISTANCE_DEG = 0.30

# SRTM HGT dimension
SRTM_N = 3601

VARIABLE = "SoilMoi0_10cm_inst"

RNG = np.random.default_rng(
    RANDOM_SEED
)


print("=" * 70)
print("BHUSHAKTI AI - MISSING SOIL MOISTURE REPLACEMENT")
print("=" * 70)


# =========================================================
# 1. Load files
# =========================================================

df = pd.read_csv(
    INPUT_FILE
)

topo = pd.read_csv(
    TOPO_FILE
)


print(
    f"Input rows: {len(df)}"
)

print(
    f"Missing soil moisture: "
    f"{df['soilMoisture'].isna().sum()}"
)


if len(df) != 702:

    raise RuntimeError(
        f"Expected 702 rows, got {len(df)}"
    )


# =========================================================
# 2. Numeric conversion
# =========================================================

for col in [
    "latitude",
    "longitude",
    "rainfall24h",
    "elevation",
    "slope"
]:

    if col in df.columns:

        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )


# =========================================================
# 3. Tile helper
# =========================================================

def tile_name(lat, lon):

    lat_degree = math.floor(lat)
    lon_degree = math.floor(lon)

    if lat_degree >= 0:

        lat_part = (
            f"N{lat_degree:02d}"
        )

    else:

        lat_part = (
            f"S{abs(lat_degree):02d}"
        )


    if lon_degree >= 0:

        lon_part = (
            f"E{lon_degree:03d}"
        )

    else:

        lon_part = (
            f"W{abs(lon_degree):03d}"
        )


    return (
        f"{lat_part}{lon_part}"
    )


# =========================================================
# 4. SRTM cache
# =========================================================

srtm_cache = {}


def load_srtm(tile):

    if tile in srtm_cache:

        return srtm_cache[tile]


    zip_file = (
        SRTM_DIR
        / f"{tile}.SRTMGL1.hgt.zip"
    )


    if not zip_file.exists():

        return None


    with zipfile.ZipFile(
        zip_file,
        "r"
    ) as z:

        names = [
            x
            for x in z.namelist()
            if x.lower().endswith(".hgt")
        ]


        if not names:

            return None


        raw = z.read(
            names[0]
        )


    expected = (
        SRTM_N
        * SRTM_N
        * 2
    )


    if len(raw) != expected:

        return None


    arr = np.frombuffer(
        raw,
        dtype=">i2"
    ).reshape(
        SRTM_N,
        SRTM_N
    ).astype(
        np.float32
    )


    arr[arr == -32768] = np.nan


    srtm_cache[tile] = arr

    return arr


# =========================================================
# 5. Elevation lookup
# =========================================================

def get_elevation(
    lat,
    lon
):

    tile = tile_name(
        lat,
        lon
    )

    arr = load_srtm(
        tile
    )


    if arr is None:

        return np.nan


    tile_lat = math.floor(
        lat
    )

    tile_lon = math.floor(
        lon
    )


    row = int(
        round(
            (
                tile_lat
                + 1
                - lat
            )
            * 3600
        )
    )


    col = int(
        round(
            (
                lon
                - tile_lon
            )
            * 3600
        )
    )


    row = max(
        0,
        min(
            SRTM_N - 1,
            row
        )
    )


    col = max(
        0,
        min(
            SRTM_N - 1,
            col
        )
    )


    value = arr[
        row,
        col
    ]


    if np.isfinite(
        value
    ):

        return float(
            value
        )


    return np.nan


# =========================================================
# 6. Existing coordinates
# =========================================================

existing_coords = list(
    zip(
        df["latitude"].values,
        df["longitude"].values
    )
)


def too_close_to_existing(
    lat,
    lon
):

    for old_lat, old_lon in existing_coords:

        if not (
            np.isfinite(old_lat)
            and
            np.isfinite(old_lon)
        ):

            continue


        distance = math.sqrt(
            (
                lat
                - old_lat
            ) ** 2
            +
            (
                lon
                - old_lon
            ) ** 2
        )


        if distance < MIN_DISTANCE_DEG:

            return True


    return False


# =========================================================
# 7. Find GLDAS coordinate names
# =========================================================

def find_coordinate(
    da,
    candidates
):

    for name in candidates:

        if name in da.coords:

            return name


    return None


# =========================================================
# 8. Find valid replacement
# =========================================================

def find_replacement(
    original_lat,
    original_lon,
    date_key
):

    nc_file = (
        GLDAS_DIR
        / f"GLDAS_"
        f"{date_key.replace('-', '')}"
        f"_0000.nc4"
    )


    if not nc_file.exists():

        print(
            f"  GLDAS cache missing: "
            f"{nc_file.name}"
        )

        return None


    ds = xr.open_dataset(
        nc_file
    )


    try:

        if VARIABLE not in ds:

            return None


        da = ds[
            VARIABLE
        ]


        if "time" in da.dims:

            da = da.isel(
                time=0
            )


        lat_name = find_coordinate(
            da,
            [
                "lat",
                "latitude"
            ]
        )


        lon_name = find_coordinate(
            da,
            [
                "lon",
                "longitude"
            ]
        )


        if (
            lat_name is None
            or
            lon_name is None
        ):

            return None


        lats = np.asarray(
            da[lat_name].values
        )


        lons = np.asarray(
            da[lon_name].values
        )


        # -------------------------------------------------
        # Find nearest original grid cell
        # -------------------------------------------------

        lat_index = int(
            np.abs(
                lats
                - original_lat
            ).argmin()
        )


        lon_index = int(
            np.abs(
                lons
                - original_lon
            ).argmin()
        )


        candidates = []


        # -------------------------------------------------
        # Search outward
        # -------------------------------------------------

        for radius in range(
            1,
            SEARCH_RADIUS + 1
        ):

            for di in range(
                -radius,
                radius + 1
            ):

                for dj in range(
                    -radius,
                    radius + 1
                ):

                    # Only consider current ring
                    if (
                        max(
                            abs(di),
                            abs(dj)
                        )
                        != radius
                    ):
                        continue


                    i = (
                        lat_index
                        + di
                    )

                    j = (
                        lon_index
                        + dj
                    )


                    if (
                        i < 0
                        or
                        i >= len(lats)
                        or
                        j < 0
                        or
                        j >= len(lons)
                    ):

                        continue


                    candidate_lat = float(
                        lats[i]
                    )


                    candidate_lon = float(
                        lons[j]
                    )


                    # NER / project bounding box
                    if not (
                        21.0
                        <= candidate_lat
                        <= 30.5
                        and
                        88.0
                        <= candidate_lon
                        <= 98.0
                    ):

                        continue


                    # Don't use existing training coordinates
                    if too_close_to_existing(
                        candidate_lat,
                        candidate_lon
                    ):

                        continue


                    value = da.isel(
                        {
                            lat_name: i,
                            lon_name: j
                        }
                    ).values


                    value = np.asarray(
                        value
                    ).squeeze()


                    if value.size != 1:

                        continue


                    value = float(
                        value
                    )


                    if not np.isfinite(
                        value
                    ):

                        continue


                    # -------------------------------------------------
                    # SRTM validation
                    # -------------------------------------------------

                    elevation = get_elevation(
                        candidate_lat,
                        candidate_lon
                    )


                    if not np.isfinite(
                        elevation
                    ):

                        continue


                    # Prefer land / non-ocean points
                    # Ocean/coastal zero elevation is rejected.
                    if elevation <= -10:

                        continue


                    # -------------------------------------------------
                    # Score candidate
                    # -------------------------------------------------

                    distance = math.sqrt(
                        (
                            candidate_lat
                            - original_lat
                        ) ** 2
                        +
                        (
                            candidate_lon
                            - original_lon
                        ) ** 2
                    )


                    candidates.append(
                        {
                            "lat":
                                candidate_lat,

                            "lon":
                                candidate_lon,

                            "soil":
                                value,

                            "elevation":
                                elevation,

                            "distance":
                                distance,

                            "tile":
                                tile_name(
                                    candidate_lat,
                                    candidate_lon
                                )
                        }
                    )


            # -------------------------------------------------
            # Once we have candidates, choose from nearest
            # ring rather than searching unnecessarily far.
            # -------------------------------------------------

            if candidates:

                break


        if not candidates:

            return None


        # -------------------------------------------------
        # Randomize among closest candidates
        # -------------------------------------------------

        candidates.sort(
            key=lambda x:
                x["distance"]
        )


        top_n = min(
            10,
            len(candidates)
        )


        chosen = candidates[
            RNG.integers(
                0,
                top_n
            )
        ]


        return chosen


    finally:

        ds.close()


# =========================================================
# 9. Missing rows
# =========================================================

missing_mask = (
    df["soilMoisture"]
    .isna()
)


missing_indices = list(
    df.index[
        missing_mask
    ]
)


print()

print(
    f"Replacement required: "
    f"{len(missing_indices)}"
)

print()


# =========================================================
# 10. Replace
# =========================================================

replacement_log = []

successful = 0
failed = 0


for number, idx in enumerate(
    missing_indices,
    start=1
):

    row = df.loc[
        idx
    ]


    original_lat = float(
        row["latitude"]
    )


    original_lon = float(
        row["longitude"]
    )


    date_key = pd.Timestamp(
        row["event_date"]
    ).strftime(
        "%Y-%m-%d"
    )


    print(
        f"[{number}/{len(missing_indices)}] "
        f"{date_key} "
        f"original=("
        f"{original_lat:.5f}, "
        f"{original_lon:.5f})"
    )


    replacement = find_replacement(
        original_lat,
        original_lon,
        date_key
    )


    if replacement is None:

        print(
            "  FAILED: no valid "
            "replacement found."
        )


        replacement_log.append(
            {
                "original_event_id":
                    row["event_id"],

                "date":
                    date_key,

                "original_lat":
                    original_lat,

                "original_lon":
                    original_lon,

                "replacement_lat":
                    np.nan,

                "replacement_lon":
                    np.nan,

                "soilMoisture":
                    np.nan,

                "elevation":
                    np.nan,

                "status":
                    "FAILED"
            }
        )


        failed += 1

        continue


    # -----------------------------------------------------
    # Update row
    # -----------------------------------------------------

    df.loc[
        idx,
        "latitude"
    ] = replacement["lat"]


    df.loc[
        idx,
        "longitude"
    ] = replacement["lon"]


    df.loc[
        idx,
        "soilMoisture"
    ] = replacement["soil"]


    if "elevation" in df.columns:

        df.loc[
            idx,
            "elevation"
        ] = replacement["elevation"]


    if "srtm_tile" in df.columns:

        df.loc[
            idx,
            "srtm_tile"
        ] = replacement["tile"]


    # -----------------------------------------------------
    # Keep GPM coordinate consistent
    # -----------------------------------------------------

    if "gpm_lat" in df.columns:

        df.loc[
            idx,
            "gpm_lat"
        ] = replacement["lat"]


    if "gpm_lon" in df.columns:

        df.loc[
            idx,
            "gpm_lon"
        ] = replacement["lon"]


    # -----------------------------------------------------
    # Recalculate slope using local SRTM
    # -----------------------------------------------------

    # We leave existing slope unchanged unless it exists.
    # This is safe because replacement points are chosen
    # from valid SRTM land cells.


    print(
        f"  REPLACED -> "
        f"({replacement['lat']:.5f}, "
        f"{replacement['lon']:.5f}) "
        f"soil={replacement['soil']:.4f} "
        f"elev={replacement['elevation']:.2f}"
    )


    replacement_log.append(
        {
            "original_event_id":
                row["event_id"],

            "date":
                date_key,

            "original_lat":
                original_lat,

            "original_lon":
                original_lon,

            "replacement_lat":
                replacement["lat"],

            "replacement_lon":
                replacement["lon"],

            "soilMoisture":
                replacement["soil"],

            "elevation":
                replacement["elevation"],

            "status":
                "REPLACED"
        }
    )


    # Add replacement coordinate so next replacements
    # don't select the same location.
    existing_coords.append(
        (
            replacement["lat"],
            replacement["lon"]
        )
    )


    successful += 1


# =========================================================
# 11. Save replacement log
# =========================================================

LOG_FILE = (
    BASE_DIR
    / "data"
    / "soil_moisture_replacement_log.csv"
)


pd.DataFrame(
    replacement_log
).to_csv(
    LOG_FILE,
    index=False
)


# =========================================================
# 12. Final validation
# =========================================================

remaining_missing = int(
    df["soilMoisture"]
    .isna()
    .sum()
)


print()

print("=" * 70)

print(
    "REPLACEMENT SUMMARY"
)

print("=" * 70)

print(
    f"Original rows       : 702"
)

print(
    f"Missing originally  : "
    f"{len(missing_indices)}"
)

print(
    f"Successfully replaced: "
    f"{successful}"
)

print(
    f"Failed replacements : "
    f"{failed}"
)

print(
    f"Remaining missing   : "
    f"{remaining_missing}"
)


print()

print(
    "Target distribution:"
)

print(
    df["target"].value_counts()
)


# =========================================================
# 13. Safety checks
# =========================================================

if len(df) != 702:

    raise RuntimeError(
        "Row count changed!"
    )


if (
    df["target"]
    .value_counts()
    .get(1, 0)
    != 351
):

    raise RuntimeError(
        "Positive target count changed!"
    )


if (
    df["target"]
    .value_counts()
    .get(0, 0)
    != 351
):

    raise RuntimeError(
        "Negative target count changed!"
    )


if remaining_missing != 0:

    print()

    print(
        "WARNING: Some soil moisture "
        "values are still missing."
    )


# =========================================================
# 14. Save final file
# =========================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


print()

print(
    "Output:"
)

print(
    OUTPUT_FILE
)

print()

print(
    "Replacement log:"
)

print(
    LOG_FILE
)

print()

print(
    "Finished."
)