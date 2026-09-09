from pathlib import Path

import joblib
import numpy as np

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# =========================================================
# BHUSHAKTI AI - PHASE 11
# ML INFERENCE API
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


FEATURES = [
    "rainfall24h",
    "elevation",
    "slope",
    "soilMoisture",
]


# ---------------------------------------------------------
# Load model
# ---------------------------------------------------------

if not MODEL_FILE.exists():
    raise RuntimeError(
        f"Model not found: {MODEL_FILE}"
    )

if not THRESHOLD_FILE.exists():
    raise RuntimeError(
        f"Threshold not found: {THRESHOLD_FILE}"
    )


model = joblib.load(
    MODEL_FILE
)

WARNING_THRESHOLD = float(
    THRESHOLD_FILE.read_text(
        encoding="utf-8"
    ).strip()
)


# ---------------------------------------------------------
# FastAPI
# ---------------------------------------------------------

app = FastAPI(
    title="BHUSHAKTI AI",
    description="AI-based landslide risk prediction API",
    version="1.0.0",
)


# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------

class RiskRequest(BaseModel):

    rainfall24h: float = Field(
        ...,
        ge=0,
        description="24-hour rainfall in mm"
    )

    elevation: float = Field(
        ...,
        description="Elevation in metres"
    )

    slope: float = Field(
        ...,
        ge=0,
        description="Slope in degrees"
    )

    soilMoisture: float = Field(
        ...,
        ge=0,
        description="Soil moisture value"
    )


# ---------------------------------------------------------
# Risk level
# ---------------------------------------------------------

def get_risk_level(
    probability: float
) -> str:

    if probability < 0.25:
        return "LOW"

    if probability < 0.40:
        return "MODERATE"

    if probability < 0.70:
        return "HIGH"

    return "CRITICAL"


# ---------------------------------------------------------
# Recommended action
# ---------------------------------------------------------

def get_recommended_action(
    risk_level: str
) -> str:

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

    return actions[risk_level]


# ---------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "service": "BHUSHAKTI AI",
        "status": "online",
        "model": "Random Forest",
        "warning_threshold": WARNING_THRESHOLD,
    }


# ---------------------------------------------------------
# Model information
# ---------------------------------------------------------

@app.get("/api/model/info")
def model_info():

    return {
        "model": "Random Forest",
        "features": FEATURES,
        "warning_threshold": WARNING_THRESHOLD,
        "risk_levels": {
            "LOW": "< 0.25",
            "MODERATE": "0.25 - < 0.40",
            "HIGH": "0.40 - < 0.70",
            "CRITICAL": ">= 0.70",
        },
    }


# ---------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------

@app.post("/api/predict-risk")
def predict_risk(
    request: RiskRequest
):

    try:

        values = np.array(
            [[
                request.rainfall24h,
                request.elevation,
                request.slope,
                request.soilMoisture,
            ]],
            dtype=float
        )


        probability = float(
            model.predict_proba(
                values
            )[0][1]
        )


        risk_level = get_risk_level(
            probability
        )


        warning = (
            probability
            >= WARNING_THRESHOLD
        )


        action = get_recommended_action(
            risk_level
        )


        return {

            "success": True,

            "prediction": {

                "risk_probability":
                    round(
                        probability,
                        4
                    ),

                "risk_percentage":
                    round(
                        probability * 100,
                        2
                    ),

                "risk_level":
                    risk_level,

                "warning":
                    warning,

                "recommended_action":
                    action,
            },

            "input": {

                "rainfall24h":
                    request.rainfall24h,

                "elevation":
                    request.elevation,

                "slope":
                    request.slope,

                "soilMoisture":
                    request.soilMoisture,
            },

            "model": {

                "name":
                    "Random Forest",

                "warning_threshold":
                    WARNING_THRESHOLD,
            },
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )