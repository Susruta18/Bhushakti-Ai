from pathlib import Path

import joblib
import numpy as np
import pandas as pd


# =========================================================
# BHUSHAKTI AI - PHASE 10
# RISK LEVEL ENGINE
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_FILE = (
    BASE_DIR
    / "models"
    / "bhushakti_landslide_risk_model.joblib"
)

THRESHOLD_FILE = (
    BASE_DIR
    / "models"
    / "risk_threshold.txt"
)

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "gpm_training_soil_moisture_fixed.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "bhushakti_risk_predictions.csv"
)


FEATURES = [
    "rainfall24h",
    "elevation",
    "slope",
    "soilMoisture",
]


print("=" * 70)
print("BHUSHAKTI AI - PHASE 10 RISK LEVEL ENGINE")
print("=" * 70)


# ---------------------------------------------------------
# 1. Load model
# ---------------------------------------------------------

model = joblib.load(
    MODEL_FILE
)

threshold = float(
    THRESHOLD_FILE.read_text(
        encoding="utf-8"
    ).strip()
)


print()
print(
    f"Warning threshold: {threshold:.2f}"
)


# ---------------------------------------------------------
# 2. Risk classification
# ---------------------------------------------------------

def get_risk_level(probability):

    if probability < 0.25:

        return "LOW"

    elif probability < 0.40:

        return "MODERATE"

    elif probability < 0.70:

        return "HIGH"

    else:

        return "CRITICAL"


# ---------------------------------------------------------
# 3. Recommended action
# ---------------------------------------------------------

def get_action(risk):

    actions = {

        "LOW":
            "Routine monitoring",

        "MODERATE":
            "Increase monitoring",

        "HIGH":
            "Issue warning and prepare response",

        "CRITICAL":
            "Immediate warning and emergency response",
    }

    return actions[risk]


# ---------------------------------------------------------
# 4. Load sample data
# ---------------------------------------------------------

df = pd.read_csv(
    INPUT_FILE
)


missing = [
    col
    for col in FEATURES
    if col not in df.columns
]


if missing:

    raise RuntimeError(
        f"Missing features: {missing}"
    )


if df[FEATURES].isna().any().any():

    raise RuntimeError(
        "Input contains missing feature values."
    )


print(
    f"Samples: {len(df)}"
)


# ---------------------------------------------------------
# 5. Predict probability
# ---------------------------------------------------------

probabilities = model.predict_proba(
    df[FEATURES]
)[:, 1]


df["risk_probability"] = (
    probabilities
)


# ---------------------------------------------------------
# 6. Binary warning
# ---------------------------------------------------------

df["warning"] = np.where(
    df["risk_probability"]
    >= threshold,
    "WARNING",
    "NO_WARNING"
)


# ---------------------------------------------------------
# 7. Risk level
# ---------------------------------------------------------

df["risk_level"] = (
    df["risk_probability"]
    .apply(get_risk_level)
)


# ---------------------------------------------------------
# 8. Recommended action
# ---------------------------------------------------------

df["recommended_action"] = (
    df["risk_level"]
    .apply(get_action)
)


# ---------------------------------------------------------
# 9. Risk summary
# ---------------------------------------------------------

print()
print("=" * 70)
print("RISK LEVEL DISTRIBUTION")
print("=" * 70)

print(
    df["risk_level"]
    .value_counts()
    .reindex(
        [
            "LOW",
            "MODERATE",
            "HIGH",
            "CRITICAL"
        ],
        fill_value=0
    )
)


print()
print("=" * 70)
print("WARNING DISTRIBUTION")
print("=" * 70)

print(
    df["warning"]
    .value_counts()
)


# ---------------------------------------------------------
# 10. Probability statistics
# ---------------------------------------------------------

print()
print("=" * 70)
print("PROBABILITY STATISTICS")
print("=" * 70)

print(
    df["risk_probability"]
    .describe()
    .round(4)
)


# ---------------------------------------------------------
# 11. Positive vs negative risk
# ---------------------------------------------------------

print()
print("=" * 70)
print("AVERAGE RISK PROBABILITY BY TARGET")
print("=" * 70)

print(
    df.groupby("target")[
        "risk_probability"
    ]
    .mean()
    .round(4)
)


# ---------------------------------------------------------
# 12. Show highest-risk samples
# ---------------------------------------------------------

print()
print("=" * 70)
print("TOP 10 HIGHEST-RISK SAMPLES")
print("=" * 70)

display_columns = [
    "event_id",
    "event_date",
    "latitude",
    "longitude",
    "rainfall24h",
    "elevation",
    "slope",
    "soilMoisture",
    "target",
    "risk_probability",
    "risk_level",
    "warning",
]


available_columns = [
    col
    for col in display_columns
    if col in df.columns
]


top10 = (
    df.sort_values(
        "risk_probability",
        ascending=False
    )
    .head(10)
)


print(
    top10[
        available_columns
    ].to_string(
        index=False
    )
)


# ---------------------------------------------------------
# 13. Save
# ---------------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)


print()
print("=" * 70)
print("PHASE 10 COMPLETE")
print("=" * 70)

print()
print(
    "Output:"
)

print(
    OUTPUT_FILE
)

print()
print(
    "Risk levels:"
)

print(
    "LOW      : < 0.25"
)

print(
    "MODERATE : 0.25 - < 0.40"
)

print(
    "HIGH     : 0.40 - < 0.70"
)

print(
    "CRITICAL : >= 0.70"
)

print()
print(
    f"Warning threshold: "
    f"{threshold:.2f}"
)

print()
print("Finished.")