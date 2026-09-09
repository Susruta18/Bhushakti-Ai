import { config } from '../config';

export interface RiskPredictionInput {
    rainfall24h: number;
    elevation: number;
    slope: number;
    soilMoisture: number;
}

export interface RiskPredictionResponse {
    success: boolean;
    prediction: {
        risk_probability: number;
        risk_percentage: number;
        risk_level: string;
        warning: boolean;
        recommended_action: string;
    };
    input: RiskPredictionInput;
    model: {
        name: string;
        warning_threshold: number;
    };
}

export const predictLandslideRisk = async (
    input: RiskPredictionInput
): Promise<RiskPredictionResponse> => {
    const response = await fetch(
        `${config.mlApiUrl}/api/predict-risk`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(input),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `ML API error (${response.status}): ${errorText}`
        );
    }

    const result =
        (await response.json()) as RiskPredictionResponse;

    return result;
};