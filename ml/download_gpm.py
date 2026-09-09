from pathlib import Path
import requests
from urllib.parse import urlparse, parse_qs, unquote
import os
import time

BASE_DIR = Path(__file__).resolve().parent
LINK_FILE = BASE_DIR / "data" / "gpm_positive_links.txt"
OUT_DIR = BASE_DIR / "data" / "gpm_positive"

OUT_DIR.mkdir(parents=True, exist_ok=True)

token = os.environ.get("EARTHDATA_TOKEN")

if not token:
    print("ERROR: EARTHDATA_TOKEN is not set.")
    print("Run: set EARTHDATA_TOKEN=YOUR_TOKEN")
    raise SystemExit(1)

links = [
    x.strip()
    for x in LINK_FILE.read_text(encoding="utf-8").splitlines()
    if x.strip()
]

session = requests.Session()

session.headers.update({
    "Authorization": f"Bearer {token}",
    "User-Agent": "BhushaktiAI-GPM-Downloader/1.0"
})

print("=" * 60)
print("BHUSHAKTI AI - NASA GPM DOWNLOADER")
print("=" * 60)
print(f"Total links : {len(links)}")
print(f"Output      : {OUT_DIR}")
print()

success = 0
skipped = 0
failed = []

for i, url in enumerate(links, 1):

    parsed = urlparse(url)
    params = parse_qs(parsed.query)

    if "LABEL" in params:
        filename = unquote(params["LABEL"][0])
    else:
        filename = Path(unquote(parsed.path)).name

    output_file = OUT_DIR / filename

    print(f"[{i}/{len(links)}] {filename}")

    if output_file.exists() and output_file.stat().st_size > 0:
        print("  -> Already exists. Skipping.")
        skipped += 1
        continue

    try:
        response = session.get(
            url,
            stream=True,
            timeout=180,
            allow_redirects=True
        )

        print(f"  -> HTTP {response.status_code}")

        response.raise_for_status()

        temp_file = output_file.with_name(
            output_file.name + ".part"
        )

        with open(temp_file, "wb") as f:
            for chunk in response.iter_content(
                chunk_size=1024 * 1024
            ):
                if chunk:
                    f.write(chunk)

        temp_file.replace(output_file)

        size_mb = output_file.stat().st_size / (1024 * 1024)

        print(f"  -> Downloaded: {size_mb:.2f} MB")

        success += 1

    except Exception as e:

        print(f"  -> FAILED: {e}")

        failed.append((i, filename, url, str(e)))

    time.sleep(0.5)


print()
print("=" * 60)
print("DOWNLOAD SUMMARY")
print("=" * 60)

print(f"Total links : {len(links)}")
print(f"Downloaded  : {success}")
print(f"Skipped     : {skipped}")
print(f"Failed      : {len(failed)}")

if failed:

    failed_file = BASE_DIR / "data" / "gpm_failed_links.txt"

    failed_file.write_text(
        "\n".join(item[2] for item in failed),
        encoding="utf-8"
    )

    print()
    print(f"Failed links saved to:")
    print(failed_file)

print()
print("Finished.")