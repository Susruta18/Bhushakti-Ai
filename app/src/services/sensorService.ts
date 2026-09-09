import { apiFetch } from './api';
import type { SensorReading } from '../types'; // I need to add SensorReading to frontend types

export const sensorService = {
  async getLatestReadingByZone(zoneId: string): Promise<SensorReading | null> {
    try {
      const response = await apiFetch(`/sensor-readings/latest/${zoneId}`) as any;
      return response.data || null;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },
};
