from pathlib import Path
import zipfile
import math
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "data" / "gpm_training_rainfall.csv"
SRTM_DIR = BASE_DIR / "data" / "srtm"
OUTPUT_FILE = BASE_DIR / "data" / "gpm_training_topography.csv"

# ---------------------------------------------------------
# SRTMGL1 configuration
# ---------------------------------------------------------
# SRTMGL1 uses 1 arc-second spacing.
# Standard HGT tile size = 3601 x 3601 samples.
N = 3601
ARCSEC_METERS = 1.0 / 3600.0

print("=" * 70)
print("BHUSHAKTI AI - ELEVATION + SLOPE EXTRACTION")
print("=" * 70)


# ---------------------------------------------------------
# 1. Load training coordinates
# ---------------------------------------------------------

df = pd.read_csv(INPUT_FILE)

df["latitude"] = pd.to_numeric(
    df["latitude"],
    errors="coerce"
)

df["longitude"] = pd.to_numeric(
    df["longitude"],
    errors="coerce"
)

df = df.dropna(
    subset=[
        "latitude",
        "longitude"
    ]
).copy()

print(
    f"Training samples: {len(df)}"
)


# ---------------------------------------------------------
# 2. Find SRTM tile name
# ---------------------------------------------------------

def tile_name(lat, lon):

    lat_degree = math.floor(lat)
    lon_degree = math.floor(lon)

    if lat_degree >= 0:
        lat_part = f"N{lat_degree:02d}"
    else:
        lat_part = f"S{abs(lat_degree):02d}"

    if lon_degree >= 0:
        lon_part = f"E{lon_degree:03d}"
    else:
        lon_part = f"W{abs(lon_degree):03d}"

    return f"{lat_part}{lon_part}"


# ---------------------------------------------------------
# 3. Cache loaded tiles
# ---------------------------------------------------------

tile_cache = {}


# ---------------------------------------------------------
# 4. Load HGT data from ZIP
# ---------------------------------------------------------

def load_tile(tile):

    if tile in tile_cache:
        return tile_cache[tile]

    zip_file = (
        SRTM_DIR
        / f"{tile}.SRTMGL1.hgt.zip"
    )

    if not zip_file.exists():

        raise FileNotFoundError(
            f"Missing SRTM tile: {zip_file}"
        )

    with zipfile.ZipFile(
        zip_file,
        "r"
    ) as z:

        hgt_names = [
            name
            for name in z.namelist()
            if name.lower().endswith(".hgt")
        ]

        if not hgt_names:

            raise RuntimeError(
                f"No HGT file inside {zip_file}"
            )

        hgt_name = hgt_names[0]

        raw = z.read(hgt_name)


    # -----------------------------------------------------
    # Validate HGT size
    # -----------------------------------------------------

    expected_bytes = N * N * 2

    if len(raw) != expected_bytes:

        raise RuntimeError(
            f"Unexpected HGT size for {tile}: "
            f"{len(raw)} bytes; "
            f"expected {expected_bytes}"
        )


    # -----------------------------------------------------
    # SRTM HGT format:
    # signed 16-bit big-endian integer
    # -----------------------------------------------------

    elevation = np.frombuffer(
        raw,
        dtype=">i2"
    ).reshape(
        (N, N)
    )


    # Convert to float
    elevation = elevation.astype(
        np.float32
    )


    # SRTM void value
    elevation[
        elevation == -32768
    ] = np.nan


    # Cache tile
    tile_cache[tile] = elevation

    print(
        f"Loaded tile {tile}"
    )

    return elevation


# ---------------------------------------------------------
# 5. Convert geographic coordinate to HGT row/column
# ---------------------------------------------------------

def get_row_col(
    lat,
    lon
):

    tile_lat = math.floor(lat)
    tile_lon = math.floor(lon)

    # HGT rows run from north to south.
    row = int(
        round(
            (tile_lat + 1.0 - lat)
            * 3600.0
        )
    )

    # HGT columns run from west to east.
    col = int(
        round(
            (lon - tile_lon)
            * 3600.0
        )
    )

    row = max(
        0,
        min(
            N - 1,
            row
        )
    )

    col = max(
        0,
        min(
            N - 1,
            col
        )
    )

    return row, col


# ---------------------------------------------------------
# 6. Get elevation
# ---------------------------------------------------------

def get_elevation(
    lat,
    lon
):

    tile = tile_name(
        lat,
        lon
    )

    arr = load_tile(
        tile
    )

    row, col = get_row_col(
        lat,
        lon
    )

    value = arr[
        row,
        col
    ]

    if np.isfinite(value):
        return float(value)

    return np.nan


# ---------------------------------------------------------
# 7. Calculate slope
# ---------------------------------------------------------

def get_slope(
    lat,
    lon
):

    tile = tile_name(
        lat,
        lon
    )

    arr = load_tile(
        tile
    )

    row, col = get_row_col(
        lat,
        lon
    )


    # -----------------------------------------------------
    # Need neighbouring pixels
    # -----------------------------------------------------

    # Avoid edge cells.
    row = max(
        1,
        min(
            N - 2,
            row
        )
    )

    col = max(
        1,
        min(
            N - 2,
            col
        )
    )


    # -----------------------------------------------------
    # Elevation neighbours
    # -----------------------------------------------------

    z_left = arr[
        row,
        col - 1
    ]

    z_right = arr[
        row,
        col + 1
    ]

    z_up = arr[
        row - 1,
        col
    ]

    z_down = arr[
        row + 1,
        col
    ]


    # -----------------------------------------------------
    # Check for void/missing values
    # -----------------------------------------------------

    values = np.array(
        [
            z_left,
            z_right,
            z_up,
            z_down
        ],
        dtype=np.float32
    )

    if not np.all(
        np.isfinite(values)
    ):
        return np.nan


    # -----------------------------------------------------
    # Pixel size in metres
    # -----------------------------------------------------

    # One arc-second latitude distance.
    dy = 111320.0 / 3600.0


    # Longitude distance changes with latitude.
    dx = (
        111320.0
        * math.cos(
            math.radians(lat)
        )
        / 3600.0
    )


    # Avoid impossible zero spacing.
    if dx <= 0 or dy <= 0:
        return np.nan


    # -----------------------------------------------------
    # Central difference
    # -----------------------------------------------------

    dz_dx = (
        float(z_right)
        - float(z_left)
    ) / (
        2.0 * dx
    )


    dz_dy = (
        float(z_down)
        - float(z_up)
    ) / (
        2.0 * dy
    )


    # -----------------------------------------------------
    # Slope in degrees
    # -----------------------------------------------------

    gradient = math.sqrt(
        dz_dx ** 2
        +
        dz_dy ** 2
    )

    slope_degrees = math.degrees(
        math.atan(
            gradient
        )
    )

    return float(
        slope_degrees
    )


# ---------------------------------------------------------
# 8. Extract elevation + slope
# ---------------------------------------------------------

elevations = []
slopes = []
tiles_used = []


for count, (_, row_data) in enumerate(
    df.iterrows(),
    start=1
):

    lat = float(
        row_data["latitude"]
    )

    lon = float(
        row_data["longitude"]
    )


    print(
        f"[{count}/{len(df)}] "
        f"lat={lat:.5f}, "
        f"lon={lon:.5f}"
    )


    try:

        tile = tile_name(
            lat,
            lon
        )


        elevation = get_elevation(
            lat,
            lon
        )


        slope = get_slope(
            lat,
            lon
        )


        elevations.append(
            elevation
        )

        slopes.append(
            slope
        )

        tiles_used.append(
            tile
        )


    except Exception as e:

        print(
            f"  ERROR: {e}"
        )


        elevations.append(
            np.nan
        )

        slopes.append(
            np.nan
        )

        tiles_used.append(
            None
        )


# ---------------------------------------------------------
# 9. Add topographic features
# ---------------------------------------------------------

df["elevation"] = elevations

df["slope"] = slopes

df["srtm_tile"] = tiles_used


# ---------------------------------------------------------
# 10. Save output
# ---------------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# 11. Summary
# ---------------------------------------------------------

print()

print("=" * 70)
print("TOPOGRAPHY EXTRACTION SUMMARY")
print("=" * 70)


print(
    f"Total samples       : "
    f"{len(df)}"
)


print(
    f"Elevation available : "
    f"{df['elevation'].notna().sum()}"
)


print(
    f"Elevation missing   : "
    f"{df['elevation'].isna().sum()}"
)


print(
    f"Slope available     : "
    f"{df['slope'].notna().sum()}"
)


print(
    f"Slope missing       : "
    f"{df['slope'].isna().sum()}"
)


# ---------------------------------------------------------
# Elevation statistics
# ---------------------------------------------------------

if df["elevation"].notna().any():

    print(
        f"Elevation min      : "
        f"{df['elevation'].min():.2f} m"
    )

    print(
        f"Elevation max      : "
        f"{df['elevation'].max():.2f} m"
    )

    print(
        f"Elevation mean     : "
        f"{df['elevation'].mean():.2f} m"
    )


# ---------------------------------------------------------
# Slope statistics
# ---------------------------------------------------------

if df["slope"].notna().any():

    print(
        f"Slope min          : "
        f"{df['slope'].min():.2f}°"
    )

    print(
        f"Slope max          : "
        f"{df['slope'].max():.2f}°"
    )

    print(
        f"Slope mean         : "
        f"{df['slope'].mean():.2f}°"
    )


# ---------------------------------------------------------
# Tile statistics
# ---------------------------------------------------------

print()

print(
    f"Unique SRTM tiles used: "
    f"{df['srtm_tile'].nunique()}"
)


# ---------------------------------------------------------
# Output
# ---------------------------------------------------------

print()

print(
    "Output:"
)

print(
    OUTPUT_FILE
)

print()

print(
    "Finished."
)