from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
)

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
# BHUSHAKTI AI - PHASE 8
# MODEL TRAINING + VALIDATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

TRAIN_FILE = BASE_DIR / "data" / "splits" / "train.csv"
VAL_FILE = BASE_DIR / "data" / "splits" / "validation.csv"
TEST_FILE = BASE_DIR / "data" / "splits" / "test.csv"

MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)


FEATURES = [
    "rainfall24h",
    "elevation",
    "slope",
    "soilMoisture",
]

TARGET = "target"


print("=" * 70)
print("BHUSHAKTI AI - PHASE 8 MODEL TRAINING")
print("=" * 70)


# ---------------------------------------------------------
# 1. Load datasets
# ---------------------------------------------------------

train = pd.read_csv(TRAIN_FILE)
validation = pd.read_csv(VAL_FILE)
test = pd.read_csv(TEST_FILE)


print()
print("Dataset sizes:")
print(f"Train      : {len(train)}")
print(f"Validation : {len(validation)}")
print(f"Test       : {len(test)}")


# ---------------------------------------------------------
# 2. Validate datasets
# ---------------------------------------------------------

for name, data in [
    ("Train", train),
    ("Validation", validation),
    ("Test", test),
]:

    missing_features = [
        col
        for col in FEATURES
        if col not in data.columns
    ]

    if missing_features:
        raise RuntimeError(
            f"{name}: missing features "
            f"{missing_features}"
        )

    if TARGET not in data.columns:
        raise RuntimeError(
            f"{name}: missing target column"
        )


# ---------------------------------------------------------
# 3. Prepare X / y
# ---------------------------------------------------------

X_train = train[FEATURES]
y_train = train[TARGET].astype(int)

X_val = validation[FEATURES]
y_val = validation[TARGET].astype(int)

X_test = test[FEATURES]
y_test = test[TARGET].astype(int)


print()
print("Training target:")
print(y_train.value_counts())

print()
print("Validation target:")
print(y_val.value_counts())

print()
print("Test target:")
print(y_test.value_counts())


# ---------------------------------------------------------
# 4. Models
# ---------------------------------------------------------

models = {

    "logistic_regression":
        Pipeline([
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),

            (
                "scaler",
                StandardScaler()
            ),

            (
                "model",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42
                )
            )
        ]),


    "random_forest":
        Pipeline([
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),

            (
                "model",
                RandomForestClassifier(
                    n_estimators=500,
                    max_depth=10,
                    min_samples_leaf=3,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1
                )
            )
        ]),


    "gradient_boosting":
        Pipeline([
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),

            (
                "model",
                GradientBoostingClassifier(
                    n_estimators=300,
                    learning_rate=0.03,
                    max_depth=3,
                    min_samples_leaf=5,
                    random_state=42
                )
            )
        ]),
}


# ---------------------------------------------------------
# 5. Evaluation helper
# ---------------------------------------------------------

def evaluate_model(
    model,
    X,
    y,
):

    probabilities = model.predict_proba(
        X
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)


    accuracy = accuracy_score(
        y,
        predictions
    )

    precision = precision_score(
        y,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y,
        predictions,
        zero_division=0
    )

    roc_auc = roc_auc_score(
        y,
        probabilities
    )

    pr_auc = average_precision_score(
        y,
        probabilities
    )

    cm = confusion_matrix(
        y,
        predictions
    )


    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "tn": int(cm[0, 0]),
        "fp": int(cm[0, 1]),
        "fn": int(cm[1, 0]),
        "tp": int(cm[1, 1]),
    }


# ---------------------------------------------------------
# 6. Train + validation
# ---------------------------------------------------------

results = []

trained_models = {}


print()
print("=" * 70)
print("TRAINING MODELS")
print("=" * 70)


for name, model in models.items():

    print()
    print("-" * 70)
    print(f"Model: {name}")
    print("-" * 70)


    model.fit(
        X_train,
        y_train
    )


    trained_models[name] = model


    metrics = evaluate_model(
        model,
        X_val,
        y_val
    )


    metrics["model"] = name

    results.append(
        metrics
    )


    print(
        f"Accuracy : {metrics['accuracy']:.4f}"
    )

    print(
        f"Precision: {metrics['precision']:.4f}"
    )

    print(
        f"Recall   : {metrics['recall']:.4f}"
    )

    print(
        f"F1       : {metrics['f1']:.4f}"
    )

    print(
        f"ROC-AUC  : {metrics['roc_auc']:.4f}"
    )

    print(
        f"PR-AUC   : {metrics['pr_auc']:.4f}"
    )

    print()
    print("Confusion Matrix:")
    print(
        np.array([
            [metrics["tn"], metrics["fp"]],
            [metrics["fn"], metrics["tp"]],
        ])
    )


# ---------------------------------------------------------
# 7. Validation comparison
# ---------------------------------------------------------

results_df = pd.DataFrame(
    results
)

results_df = results_df[
    [
        "model",
        "accuracy",
        "precision",
        "recall",
        "f1",
        "roc_auc",
        "pr_auc",
        "tn",
        "fp",
        "fn",
        "tp",
    ]
]


results_df = results_df.sort_values(
    "f1",
    ascending=False
).reset_index(
    drop=True
)


print()
print("=" * 70)
print("VALIDATION MODEL COMPARISON")
print("=" * 70)

print(
    results_df.to_string(
        index=False,
        float_format=lambda x:
            f"{x:.4f}"
    )
)


# ---------------------------------------------------------
# 8. Select best model
# ---------------------------------------------------------

best_model_name = (
    results_df.iloc[0]["model"]
)

best_model = trained_models[
    best_model_name
]


print()
print(
    f"Selected model: "
    f"{best_model_name}"
)

print(
    "Selection metric: Validation F1"
)


# ---------------------------------------------------------
# 9. Save validation report
# ---------------------------------------------------------

validation_report = (
    REPORT_DIR
    / "model_validation_results.csv"
)

results_df.to_csv(
    validation_report,
    index=False
)


# ---------------------------------------------------------
# 10. Save best model
# ---------------------------------------------------------

best_model_file = (
    MODEL_DIR
    / f"{best_model_name}_validation_selected.joblib"
)

joblib.dump(
    best_model,
    best_model_file
)


# ---------------------------------------------------------
# 11. Final test evaluation
# ---------------------------------------------------------

print()
print("=" * 70)
print("FINAL TEST EVALUATION")
print("=" * 70)

test_metrics = evaluate_model(
    best_model,
    X_test,
    y_test
)


print(
    f"Model    : {best_model_name}"
)

print(
    f"Accuracy : {test_metrics['accuracy']:.4f}"
)

print(
    f"Precision: {test_metrics['precision']:.4f}"
)

print(
    f"Recall   : {test_metrics['recall']:.4f}"
)

print(
    f"F1       : {test_metrics['f1']:.4f}"
)

print(
    f"ROC-AUC  : {test_metrics['roc_auc']:.4f}"
)

print(
    f"PR-AUC   : {test_metrics['pr_auc']:.4f}"
)

print()
print("Test Confusion Matrix:")

print(
    np.array([
        [
            test_metrics["tn"],
            test_metrics["fp"]
        ],
        [
            test_metrics["fn"],
            test_metrics["tp"]
        ],
    ])
)


# ---------------------------------------------------------
# 12. Save test report
# ---------------------------------------------------------

test_report = (
    REPORT_DIR
    / "final_test_results.csv"
)

pd.DataFrame(
    [test_metrics]
).to_csv(
    test_report,
    index=False
)


# ---------------------------------------------------------
# 13. Save final model
# ---------------------------------------------------------

final_model_file = (
    MODEL_DIR
    / "bhushakti_landslide_risk_model.joblib"
)

joblib.dump(
    best_model,
    final_model_file
)


# ---------------------------------------------------------
# 14. Save feature information
# ---------------------------------------------------------

feature_file = (
    MODEL_DIR
    / "feature_columns.txt"
)

feature_file.write_text(
    "\n".join(FEATURES),
    encoding="utf-8"
)


# ---------------------------------------------------------
# 15. Final summary
# ---------------------------------------------------------

print()
print("=" * 70)
print("PHASE 8 COMPLETE")
print("=" * 70)

print(
    f"Best model: {best_model_name}"
)

print()
print("Model:")
print(
    final_model_file
)

print()
print("Validation report:")
print(
    validation_report
)

print()
print("Test report:")
print(
    test_report
)

print()
print("Finished.")