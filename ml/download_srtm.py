from pathlib import Path
import pandas as pd
import numpy as np
import requests
import os
import time

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "data" / "gpm_training_rainfall.csv"
OUT_DIR = BASE_DIR / "data" / "srtm"

OUT_DIR.mkdir(parents=True, exist_ok=True)

TOKEN = os.environ.get("EARTHDATA_TOKEN")

if not TOKEN:
    print("ERROR: EARTHDATA_TOKEN is not set.")
    print("Run: set EARTHDATA_TOKEN=YOUR_TOKEN")
    raise SystemExit(1)


# ---------------------------------------------------------
# 1. Load sample coordinates
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
    subset=["latitude", "longitude"]
)


# ---------------------------------------------------------
# 2. Determine required 1-degree SRTM tiles
# ---------------------------------------------------------

tiles = set()

for _, row in df.iterrows():

    lat = float(row["latitude"])
    lon = float(row["longitude"])

    lat_degree = int(np.floor(lat))
    lon_degree = int(np.floor(lon))

    if lat_degree >= 0:
        lat_part = f"N{lat_degree:02d}"
    else:
        lat_part = f"S{abs(lat_degree):02d}"

    if lon_degree >= 0:
        lon_part = f"E{lon_degree:03d}"
    else:
        lon_part = f"W{abs(lon_degree):03d}"

    tiles.add(
        f"{lat_part}{lon_part}"
    )


tiles = sorted(tiles)

print("=" * 70)
print("BHUSHAKTI AI - SRTM DEM DOWNLOADER")
print("=" * 70)

print(f"Sample coordinates : {len(df)}")
print(f"Required SRTM tiles: {len(tiles)}")
print()

print("Tiles:")

for tile in tiles:
    print(" ", tile)

print()


# ---------------------------------------------------------
# 3. Download tiles
# ---------------------------------------------------------

session = requests.Session()

session.headers.update({
    "Authorization": f"Bearer {TOKEN}",
    "User-Agent": "BhushaktiAI-SRTM-Downloader/1.0"
})

downloaded = 0
skipped = 0
failed = []


for i, tile in enumerate(tiles, 1):

    filename = f"{tile}.SRTMGL1.hgt.zip"

    output_file = OUT_DIR / filename

    print(
        f"[{i}/{len(tiles)}] {filename}"
    )


    # -----------------------------------------------------
    # Skip existing files
    # -----------------------------------------------------

    if (
        output_file.exists()
        and output_file.stat().st_size > 0
    ):

        print("  -> Already exists. Skipping.")

        skipped += 1

        continue


    # -----------------------------------------------------
    # NASA LP DAAC URL
    # -----------------------------------------------------

    url = (
        "https://data.lpdaac.earthdatacloud.nasa.gov/"
        "lp-prod-protected/"
        f"SRTMGL1.003/"
        f"{tile}.SRTMGL1.hgt/"
        f"{filename}"
    )


    try:

        response = session.get(
            url,
            stream=True,
            timeout=180
        )

        print(
            f"  -> HTTP {response.status_code}"
        )

        response.raise_for_status()


        temp_file = output_file.with_suffix(
            output_file.suffix + ".part"
        )


        with open(
            temp_file,
            "wb"
        ) as f:

            for chunk in response.iter_content(
                chunk_size=1024 * 1024
            ):

                if chunk:
                    f.write(chunk)


        temp_file.replace(
            output_file
        )


        size_mb = (
            output_file.stat().st_size
            / (1024 * 1024)
        )

        print(
            f"  -> Downloaded: "
            f"{size_mb:.2f} MB"
        )

        downloaded += 1


    except Exception as e:

        print(
            f"  -> FAILED: {e}"
        )

        failed.append(
            (
                tile,
                url,
                str(e)
            )
        )


    time.sleep(0.3)


# ---------------------------------------------------------
# 4. Save failed links
# ---------------------------------------------------------

if failed:

    failed_file = (
        BASE_DIR
        / "data"
        / "srtm_failed_links.txt"
    )

    failed_file.write_text(
        "\n".join(
            item[1]
            for item in failed
        ),
        encoding="utf-8"
    )


# ---------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------

print()
print("=" * 70)
print("SRTM DOWNLOAD SUMMARY")
print("=" * 70)

print(
    f"Required tiles : {len(tiles)}"
)

print(
    f"Downloaded     : {downloaded}"
)

print(
    f"Skipped        : {skipped}"
)

print(
    f"Failed         : {len(failed)}"
)

print()

if failed:

    print(
        "Failed tiles:"
    )

    for tile, url, error in failed:

        print(
            f"  {tile}: {error}"
        )

    print()

    print(
        f"Failed links saved to:"
    )

    print(
        BASE_DIR
        / "data"
        / "srtm_failed_links.txt"
    )

else:

    print(
        "All required SRTM tiles downloaded successfully."
    )


print()
print("Output folder:")
print(OUT_DIR)

print()
print("Finished.")