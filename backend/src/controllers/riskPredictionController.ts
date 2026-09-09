import { Request, Response } from 'express';

import {
    predictLandslideRisk,
    RiskPredictionInput,
} from '../services/riskPredictionService';


export const predictRisk = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const {
            rainfall24h,
            elevation,
            slope,
            soilMoisture,
        } = req.body;


        // -----------------------------------------------------
        // Validate required fields
        // -----------------------------------------------------

        const values = {
            rainfall24h,
            elevation,
            slope,
            soilMoisture,
        };


        for (const [field, value] of Object.entries(values)) {

            if (
                value === undefined ||
                value === null ||
                value === ''
            ) {

                res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`,
                });

                return;
            }


            if (
                typeof value !== 'number' ||
                !Number.isFinite(value)
            ) {

                res.status(400).json({
                    success: false,
                    message: `${field} must be a valid number`,
                });

                return;
            }
        }


        // -----------------------------------------------------
        // Validate non-negative values
        // -----------------------------------------------------

        if (rainfall24h < 0) {

            res.status(400).json({
                success: false,
                message: 'rainfall24h cannot be negative',
            });

            return;
        }


        if (slope < 0) {

            res.status(400).json({
                success: false,
                message: 'slope cannot be negative',
            });

            return;
        }


        if (soilMoisture < 0) {

            res.status(400).json({
                success: false,
                message: 'soilMoisture cannot be negative',
            });

            return;
        }


        // -----------------------------------------------------
        // Build ML input
        // -----------------------------------------------------

        const input: RiskPredictionInput = {

            rainfall24h:
                Number(rainfall24h),

            elevation:
                Number(elevation),

            slope:
                Number(slope),

            soilMoisture:
                Number(soilMoisture),
        };


        // -----------------------------------------------------
        // Call ML service
        // -----------------------------------------------------

        const prediction =
            await predictLandslideRisk(input);


        // -----------------------------------------------------
        // Return response
        // -----------------------------------------------------

        res.status(200).json({
            success: true,
            data: prediction.prediction,
            input: prediction.input,
            model: prediction.model,
        });

    } catch (error) {

        console.error(
            'Risk prediction error:',
            error
        );


        res.status(502).json({
            success: false,
            message:
                'Unable to reach the BHUSHAKTI AI ML service',
            error:
                error instanceof Error
                    ? error.message
                    : 'Unknown error',
        });
    }
};