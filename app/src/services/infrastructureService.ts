import { delay } from './api';
import { MOCK_INFRASTRUCTURE } from '../data/mockInfrastructure';
import type { InfrastructureAsset } from '../types';

export const infrastructureService = {
  async getInfrastructure(): Promise<InfrastructureAsset[]> {
    await delay();
    return MOCK_INFRASTRUCTURE;
  },

  async getAsset(id: string): Promise<InfrastructureAsset> {
    await delay(400);
    const asset = MOCK_INFRASTRUCTURE.find((a) => a.id === id);
    if (!asset) throw new Error(`Asset ${id} not found`);
    return asset;
  },

  async getAtRiskAssets(): Promise<InfrastructureAsset[]> {
    await delay(300);
    return MOCK_INFRASTRUCTURE.filter(
      (a) => a.riskLevel === 'critical' || a.riskLevel === 'high'
    );
  },
};
