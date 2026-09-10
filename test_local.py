import joblib
import numpy as np

model = joblib.load('ml/models/bhushakti_landslide_risk_model.joblib')
values = np.array([[85, 500, 25, 40]], dtype=float)
probability = float(model.predict_proba(values)[0][1])
print(f'Probability: {probability}')
