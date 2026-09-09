from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)


# =========================================================
# BHUSHAKTI AI - PHASE 9
# FEATURE IMPORTANCE + THRESHOLD ANALYSIS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

TRAIN_FILE = BASE_DIR / "data" / "splits" / "train.csv"
VAL_FILE = BASE_DIR / "data" / "splits" / "validation.csv"
TEST_FILE = BASE_DIR / "data" / "splits" / "test.csv"

MODEL_FILE = (
    BASE_DIR
    / "models"
    / "bhushakti_landslide_risk_model.joblib"
)

REPORT_DIR = BASE_DIR / "reports"

REPORT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


FEATURES = [
    "rainfall24h",
    "elevation",
    "slope",
    "soilMoisture",
]


print("=" * 70)
print("BHUSHAKTI AI - PHASE 9 ANALYSIS")
print("=" * 70)


# =========================================================
# 1. Load data
# =========================================================

train = pd.read_csv(TRAIN_FILE)
validation = pd.read_csv(VAL_FILE)
test = pd.read_csv(TEST_FILE)

model = joblib.load(MODEL_FILE)


X_train = train[FEATURES]
y_train = train["target"].astype(int)

X_val = validation[FEATURES]
y_val = validation["target"].astype(int)

X_test = test[FEATURES]
y_test = test["target"].astype(int)


print()
print("Loaded:")
print(f"Train      : {len(train)}")
print(f"Validation : {len(validation)}")
print(f"Test       : {len(test)}")


# =========================================================
# 2. Feature importance
# =========================================================

print()
print("=" * 70)
print("FEATURE IMPORTANCE")
print("=" * 70)


# Pipeline -> final estimator
rf = model.named_steps["model"]


if not hasattr(
    rf,
    "feature_importances_"
):

    print(
        "Model does not provide "
        "feature_importances_."
    )

else:

    importance = pd.DataFrame(
        {
            "feature": FEATURES,
            "importance":
                rf.feature_importances_,
        }
    )

    importance = importance.sort_values(
        "importance",
        ascending=False
    ).reset_index(
        drop=True
    )


    print(
        importance.to_string(
            index=False,
            float_format=lambda x:
                f"{x:.4f}"
        )
    )


    importance_file = (
        REPORT_DIR
        / "feature_importance.csv"
    )

    importance.to_csv(
        importance_file,
        index=False
    )

    print()
    print(
        "Saved:",
        importance_file
    )


# =========================================================
# 3. Validation probabilities
# =========================================================

val_prob = model.predict_proba(
    X_val
)[:, 1]


test_prob = model.predict_proba(
    X_test
)[:, 1]


# =========================================================
# 4. Threshold analysis
# =========================================================

print()
print("=" * 70)
print("VALIDATION THRESHOLD ANALYSIS")
print("=" * 70)


thresholds = np.arange(
    0.20,
    0.81,
    0.05
)


threshold_results = []


for threshold in thresholds:

    pred = (
        val_prob >= threshold
    ).astype(int)


    accuracy = accuracy_score(
        y_val,
        pred
    )

    precision = precision_score(
        y_val,
        pred,
        zero_division=0
    )

    recall = recall_score(
        y_val,
        pred,
        zero_division=0
    )

    f1 = f1_score(
        y_val,
        pred,
        zero_division=0
    )


    cm = confusion_matrix(
        y_val,
        pred
    )


    threshold_results.append(
        {
            "threshold": threshold,
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "tn": int(cm[0, 0]),
            "fp": int(cm[0, 1]),
            "fn": int(cm[1, 0]),
            "tp": int(cm[1, 1]),
        }
    )


threshold_df = pd.DataFrame(
    threshold_results
)


print(
    threshold_df.to_string(
        index=False,
        float_format=lambda x:
            f"{x:.4f}"
    )
)


# =========================================================
# 5. Select threshold
# =========================================================

# For early warning, prioritize recall,
# but require reasonable precision.
#
# First find thresholds with recall >= 0.90.
# Among those, select the one with highest F1.
#
# If none reaches 0.90 recall,
# select highest F1 overall.

high_recall = threshold_df[
    threshold_df["recall"] >= 0.90
].copy()


if not high_recall.empty:

    selected_row = (
        high_recall
        .sort_values(
            [
                "f1",
                "precision"
            ],
            ascending=False
        )
        .iloc[0]
    )

    selection_reason = (
        "Recall >= 0.90, "
        "highest F1 among qualifying thresholds"
    )

else:

    selected_row = (
        threshold_df
        .sort_values(
            [
                "f1",
                "recall"
            ],
            ascending=False
        )
        .iloc[0]
    )

    selection_reason = (
        "No threshold reached 0.90 recall; "
        "selected highest validation F1"
    )


selected_threshold = float(
    selected_row["threshold"]
)


print()
print("=" * 70)
print("SELECTED THRESHOLD")
print("=" * 70)

print(
    f"Threshold : {selected_threshold:.2f}"
)

print(
    f"Accuracy  : "
    f"{selected_row['accuracy']:.4f}"
)

print(
    f"Precision : "
    f"{selected_row['precision']:.4f}"
)

print(
    f"Recall    : "
    f"{selected_row['recall']:.4f}"
)

print(
    f"F1        : "
    f"{selected_row['f1']:.4f}"
)

print(
    f"Reason    : {selection_reason}"
)


# =========================================================
# 6. Save threshold report
# =========================================================

threshold_file = (
    REPORT_DIR
    / "validation_threshold_analysis.csv"
)

threshold_df.to_csv(
    threshold_file,
    index=False
)


# =========================================================
# 7. Final test evaluation at selected threshold
# =========================================================

test_pred = (
    test_prob >= selected_threshold
).astype(int)


test_accuracy = accuracy_score(
    y_test,
    test_pred
)

test_precision = precision_score(
    y_test,
    test_pred,
    zero_division=0
)

test_recall = recall_score(
    y_test,
    test_pred,
    zero_division=0
)

test_f1 = f1_score(
    y_test,
    test_pred,
    zero_division=0
)

test_roc_auc = roc_auc_score(
    y_test,
    test_prob
)

test_pr_auc = average_precision_score(
    y_test,
    test_prob
)

test_cm = confusion_matrix(
    y_test,
    test_pred
)


print()
print("=" * 70)
print("FINAL TEST - SELECTED THRESHOLD")
print("=" * 70)

print(
    f"Threshold : {selected_threshold:.2f}"
)

print(
    f"Accuracy  : {test_accuracy:.4f}"
)

print(
    f"Precision : {test_precision:.4f}"
)

print(
    f"Recall    : {test_recall:.4f}"
)

print(
    f"F1        : {test_f1:.4f}"
)

print(
    f"ROC-AUC   : {test_roc_auc:.4f}"
)

print(
    f"PR-AUC    : {test_pr_auc:.4f}"
)

print()
print("Confusion Matrix:")
print(test_cm)


# =========================================================
# 8. Save final threshold results
# =========================================================

final_result = pd.DataFrame(
    [
        {
            "model":
                "random_forest",

            "threshold":
                selected_threshold,

            "accuracy":
                test_accuracy,

            "precision":
                test_precision,

            "recall":
                test_recall,

            "f1":
                test_f1,

            "roc_auc":
                test_roc_auc,

            "pr_auc":
                test_pr_auc,

            "tn":
                int(test_cm[0, 0]),

            "fp":
                int(test_cm[0, 1]),

            "fn":
                int(test_cm[1, 0]),

            "tp":
                int(test_cm[1, 1]),
        }
    ]
)


final_file = (
    REPORT_DIR
    / "phase9_final_threshold_results.csv"
)


final_result.to_csv(
    final_file,
    index=False
)


# =========================================================
# 9. Save threshold configuration
# =========================================================

threshold_config = (
    BASE_DIR
    / "models"
    / "risk_threshold.txt"
)


threshold_config.write_text(
    f"{selected_threshold:.2f}",
    encoding="utf-8"
)


# =========================================================
# 10. Summary
# =========================================================

print()
print("=" * 70)
print("PHASE 9 ANALYSIS COMPLETE")
print("=" * 70)

print()
print("Reports:")
print(importance_file)
print(threshold_file)
print(final_file)

print()
print("Selected threshold:")
print(selected_threshold)

print()
print("Threshold configuration:")
print(threshold_config)

print()
print("Finished.")