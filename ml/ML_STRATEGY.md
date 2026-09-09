# BHUSHAKTI AI — ML Landslide Prediction Strategy

This document outlines the strategic approach for implementing the Machine Learning landslide prediction pipeline for BHUSHAKTI AI (Phase 7.1). The strategy explicitly favors explainability, dataset feasibility, and SIH-ready constraints over black-box complexity.

## 1. Recommended ML Model
**Recommendation: Random Forest (or XGBoost)**
- **Why it was selected:**
  - **Explainability:** Tree-based models allow for straightforward extraction of feature importance and integration with SHAP (SHapley Additive exPlanations) for human-readable insights.
  - **Tabular Data Mastery:** Random Forest generally outperforms Deep Learning on small-to-medium tabular datasets with mixed numerical and categorical features.
  - **Robustness:** Tree ensembles handle non-linear relationships without requiring intense feature scaling or outlier pruning.
  - **Imbalance Resistance:** Easy to implement class weights to offset heavy disaster-event class imbalances.

## 2. Required Dataset Structure
To train this model, an explicit historical dataset must be constructed (or curated) containing past dates/zones that suffered landslides alongside zones that did not.

- **Target Definition:** Supervised Binary Classification
  - `0` = No Landslide occurred
  - `1` = Landslide occurred
- **Data Availability:** We cannot fabricate this dataset. Real-world labels mapping historical events to past environmental observations are strictly required.

## 3. Feature Vector
The model operates on a unified feature set built directly by the Node.js `EnvironmentalFeatureService`.

**Primary Features:**
- `rainfall24h` (Numeric, millimeters)
- `rainfallDuration24h` (Numeric, hours)
- `soilMoisture` (Numeric, percentage 0-100)
- `slope` (Numeric, degrees 0-90)
- `elevation` (Numeric, meters)
- `historicalSusceptibility` (Numeric, decimal 0.0 - 1.0)
- `landUse` (Categorical: FOREST, AGRICULTURE, URBAN, BARREN, GRASSLAND, MIXED)

*(Note: `location` and `featureTimestamp` are kept strictly as metadata for database lookups and routing, and must NOT be fed to the ML algorithm blindly to avoid spatial/temporal overfitting bias).*

## 4. Preprocessing Strategy
The ML pipeline must guarantee strict reproducibility (the exact same transformer objects must be used at training and inference).
- **Missing Values:** Imputation strategies must be defined. (e.g., median imputation for numeric features, or explicit handling of missing nodes in XGBoost).
- **Categorical Encoding:** `landUse` requires One-Hot Encoding (OHE).
- **Feature Scaling:** Tree-based models do not strictly require StandardScaler or MinMaxScaler, though doing so helps with certain explainability visuals. No scaling required for baseline.
- **Outliers:** Left largely intact as Random Forest splits are inherently robust to extreme numeric values (like massive rainfall).

## 5. Evaluation Strategy
- **Data Split:** A strict Temporal or Spatial split is recommended to avoid data leakage (e.g. Training on 2018-2022, Testing on 2023). A standard 80/20 train/test split is acceptable if random stratification is carefully managed.
- **Cross Validation:** 5-Fold Stratified Cross Validation during hyperparameter tuning.

## 6. Class Imbalance Strategy
Landslides are rare events. A dataset might contain 99% `0` labels and 1% `1` labels.
- **Tactic 1:** Apply `class_weight='balanced'` in the algorithm to aggressively penalize missing a landslide.
- **Tactic 2:** Ignore standard Accuracy, which is dangerously misleading in imbalanced scenarios.
- **Recommended Metrics:**
  - **Recall (Sensitivity):** The absolute most critical metric. We want to identify as many real landslides as possible (minimize False Negatives).
  - **Precision:** Represents how many predictions of "Landslide" actually occurred.
  - **F1-Score / PR-AUC:** Balanced evaluation of Precision and Recall.

## 7. Risk-Level Strategy
The ML output will be a raw probability (`0.0` to `1.0`). This will be mapped to user-facing severity levels using configurable thresholds.
- `0.00 – 0.30` → **LOW**
- `0.31 – 0.60` → **MODERATE**
- `0.61 – 0.85` → **HIGH**
- `0.86 – 1.00` → **CRITICAL**
*(These thresholds are illustrative and must be configured post-evaluation based on the model's actual calibration curve).*

## 8. Confidence Strategy
- **Prediction Probability ≠ Scientific Confidence.**
- Tree-based models output a ratio of voting trees. While this serves as our raw "Risk Probability", it is often poorly calibrated.
- **Strategy:** If explicit statistical "Confidence" is required by the UI, we must implement Platt Scaling or Isotonic Regression on the model output to calibrate the probabilities to real-world likelihoods.

## 9. Explainability Strategy
A black box stating "HIGH RISK" is useless to disaster responders.
- The Python ML service will integrate the `SHAP` (SHapley Additive exPlanations) library.
- For every prediction made, SHAP will compute the localized contribution of each feature to that specific prediction.
- The API payload will return human-readable metadata, e.g.:
  `"primaryRiskFactors": ["Excessive rainfall24h (+0.35)", "Steep slope (+0.12)"]`

## 10. Recommended Deployment Architecture
**Architecture A: Node.js Backend ↔ Python FastApi Microservice**
- **Why:** Python is the undisputed champion of ML ecosystems (scikit-learn, xgboost, shap). Trying to run Python ML models natively in Node.js (via ONNX or tensorflow.js) often completely severs compatibility with advanced explainability libraries like SHAP.
- **Flow:** Node.js gathers environmental features → Node.js fires internal HTTP POST to Python service → Python executes preprocessors, model, and SHAP explainer → Python returns JSON risk + explanations → Node updates MongoDB and alerts.

## 11. Model Versioning
Every deployed model must have an explicit string identifier (e.g., `bhushakti-rf-v1.0.0`). The Node.js database schema must store `modelVersion` alongside every prediction made in production. This allows complete rollback and historical auditing if a model goes rogue.

## 12. Future ML Directory Structure
```text
ml/
├── data/           # Raw and processed CSV datasets
├── notebooks/      # Jupyter notebooks for EDA and prototyping
├── training/       # Training scripts (train.py)
├── models/         # Serialized models (.pkl, .joblib)
├── preprocessing/  # Reusable Scikit-learn pipelines
├── evaluation/     # Metrics scripts and test results
└── inference/      # FastAPI server or inference scripts
```

## 13. Model Card (Template)
- **Model Name:** BHUSHAKTI-RF-V1
- **Model Type:** Random Forest Classifier
- **Input Features:** rainfall24h, rainfallDuration24h, soilMoisture, slope, elevation, historicalSusceptibility, landUse
- **Target:** 1 (Landslide), 0 (No Landslide)
- **Known Limitations:** The model assumes uniform geotechnical soil properties across identical land uses, which may miss hyper-local vulnerabilities. Subject to concept drift if climate significantly alters normal baseline rainfalls.
