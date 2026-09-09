from pathlib import Path
import pandas as pd
import numpy as np


BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "gpm_training_soil_moisture_fixed.csv"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "splits"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


RANDOM_SEED = 42

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15


print("=" * 70)
print("BHUSHAKTI AI - SPATIAL DATASET SPLIT")
print("=" * 70)


# ---------------------------------------------------------
# 1. Load
# ---------------------------------------------------------

df = pd.read_csv(
    INPUT_FILE
)

print(
    f"Total samples: {len(df)}"
)


if len(df) != 702:

    raise RuntimeError(
        f"Expected 702 rows, got {len(df)}"
    )


# ---------------------------------------------------------
# 2. Validate
# ---------------------------------------------------------

required = [
    "latitude",
    "longitude",
    "target",
    "rainfall24h",
    "elevation",
    "slope",
    "soilMoisture"
]

missing_columns = [
    c
    for c in required
    if c not in df.columns
]

if missing_columns:

    raise RuntimeError(
        f"Missing columns: {missing_columns}"
    )


if df[required].isna().any().any():

    raise RuntimeError(
        "Missing values detected."
    )


# ---------------------------------------------------------
# 3. Create spatial cell
# ---------------------------------------------------------

df["lat_cell"] = (
    np.floor(
        df["latitude"]
    ).astype(int)
)

df["lon_cell"] = (
    np.floor(
        df["longitude"]
    ).astype(int)
)


df["spatial_cell"] = (
    df["lat_cell"].astype(str)
    + "_"
    + df["lon_cell"].astype(str)
)


# ---------------------------------------------------------
# 4. Examine cells
# ---------------------------------------------------------

cell_stats = (
    df.groupby(
        "spatial_cell"
    )
    .agg(
        samples=("target", "count"),
        positives=("target", "sum")
    )
)


cell_stats["negatives"] = (
    cell_stats["samples"]
    -
    cell_stats["positives"]
)


print(
    f"Spatial cells: {len(cell_stats)}"
)

print(
    f"Cells with positives: "
    f"{(cell_stats['positives'] > 0).sum()}"
)


# ---------------------------------------------------------
# 5. Separate positive-containing cells
# ---------------------------------------------------------

positive_cells = list(
    cell_stats.index[
        cell_stats["positives"] > 0
    ]
)


negative_only_cells = list(
    cell_stats.index[
        cell_stats["positives"] == 0
    ]
)


print(
    f"Positive-containing cells: "
    f"{len(positive_cells)}"
)

print(
    f"Negative-only cells: "
    f"{len(negative_only_cells)}"
)


# ---------------------------------------------------------
# 6. Randomized spatial assignment
# ---------------------------------------------------------

rng = np.random.default_rng(
    RANDOM_SEED
)


positive_cells = np.array(
    positive_cells
)

negative_only_cells = np.array(
    negative_only_cells
)


rng.shuffle(
    positive_cells
)

rng.shuffle(
    negative_only_cells
)


# ---------------------------------------------------------
# 7. Assign positive cells
# ---------------------------------------------------------

n_positive_cells = len(
    positive_cells
)


n_train_pos = round(
    n_positive_cells
    *
    TRAIN_RATIO
)

n_val_pos = round(
    n_positive_cells
    *
    VAL_RATIO
)


train_positive_cells = set(
    positive_cells[
        :n_train_pos
    ]
)

val_positive_cells = set(
    positive_cells[
        n_train_pos:
        n_train_pos + n_val_pos
    ]
)

test_positive_cells = set(
    positive_cells[
        n_train_pos + n_val_pos:
    ]
)


# ---------------------------------------------------------
# 8. Assign negative-only cells
# ---------------------------------------------------------

n_negative_cells = len(
    negative_only_cells
)


n_train_neg = round(
    n_negative_cells
    *
    TRAIN_RATIO
)

n_val_neg = round(
    n_negative_cells
    *
    VAL_RATIO
)


train_negative_cells = set(
    negative_only_cells[
        :n_train_neg
    ]
)

val_negative_cells = set(
    negative_only_cells[
        n_train_neg:
        n_train_neg + n_val_neg
    ]
)

test_negative_cells = set(
    negative_only_cells[
        n_train_neg + n_val_neg:
    ]
)


# ---------------------------------------------------------
# 9. Combine assignments
# ---------------------------------------------------------

train_cells = (
    train_positive_cells
    |
    train_negative_cells
)

val_cells = (
    val_positive_cells
    |
    val_negative_cells
)

test_cells = (
    test_positive_cells
    |
    test_negative_cells
)


# ---------------------------------------------------------
# 10. Verify no overlap
# ---------------------------------------------------------

if train_cells & val_cells:

    raise RuntimeError(
        "Train/validation spatial overlap!"
    )


if train_cells & test_cells:

    raise RuntimeError(
        "Train/test spatial overlap!"
    )


if val_cells & test_cells:

    raise RuntimeError(
        "Validation/test spatial overlap!"
    )


# ---------------------------------------------------------
# 11. Assign split
# ---------------------------------------------------------

def assign_split(cell):

    if cell in train_cells:
        return "train"

    if cell in val_cells:
        return "validation"

    if cell in test_cells:
        return "test"

    raise RuntimeError(
        f"Unassigned cell: {cell}"
    )


df["split"] = (
    df["spatial_cell"]
    .apply(assign_split)
)


# ---------------------------------------------------------
# 12. Save splits
# ---------------------------------------------------------

train = df[
    df["split"] == "train"
].copy()

validation = df[
    df["split"] == "validation"
].copy()

test = df[
    df["split"] == "test"
].copy()


# Remove helper columns from ML files
helper_columns = [
    "lat_cell",
    "lon_cell",
    "spatial_cell",
    "split"
]


for dataset in [
    train,
    validation,
    test
]:

    dataset.drop(
        columns=helper_columns,
        inplace=True
    )


# ---------------------------------------------------------
# 13. Save
# ---------------------------------------------------------

train_file = (
    OUTPUT_DIR
    / "train.csv"
)

val_file = (
    OUTPUT_DIR
    / "validation.csv"
)

test_file = (
    OUTPUT_DIR
    / "test.csv"
)


train.to_csv(
    train_file,
    index=False
)

validation.to_csv(
    val_file,
    index=False
)

test.to_csv(
    test_file,
    index=False
)


# ---------------------------------------------------------
# 14. Summary
# ---------------------------------------------------------

print()

print("=" * 70)
print("SPATIAL SPLIT SUMMARY")
print("=" * 70)

print(
    f"Train      : {len(train)}"
)

print(
    f"Validation : {len(validation)}"
)

print(
    f"Test       : {len(test)}"
)

print()

print("Train target:")
print(
    train["target"].value_counts()
)

print()

print("Validation target:")
print(
    validation["target"].value_counts()
)

print()

print("Test target:")
print(
    test["target"].value_counts()
)

print()

print(
    f"Train spatial cells: "
    f"{len(train_cells)}"
)

print(
    f"Validation spatial cells: "
    f"{len(val_cells)}"
)

print(
    f"Test spatial cells: "
    f"{len(test_cells)}"
)

print()

print(
    "Output files:"
)

print(
    train_file
)

print(
    val_file
)

print(
    test_file
)

print()

print("Finished.")