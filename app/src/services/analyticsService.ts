import { apiFetch } from './api';
import type { AnalyticsOverview, RiskDistribution, AnalyticsRiskTrendPoint, AlertTrendPoint, EnvironmentalTrendPoint } from '../types';

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await apiFetch('/analytics/overview') as any;
    return response.data;
  },

  async getRiskDistribution(): Promise<RiskDistribution[]> {
    const response = await apiFetch('/analytics/risk-distribution') as any;
    return response.data;
  },

  async getRiskTrend(days: number = 7): Promise<AnalyticsRiskTrendPoint[]> {
    const response = await apiFetch(`/analytics/risk-trend?days=${days}`) as any;
    return response.data;
  },

  async getAlertsTrend(days: number = 7): Promise<AlertTrendPoint[]> {
    const response = await apiFetch(`/analytics/alerts-trend?days=${days}`) as any;
    return response.data;
  },

  async getEnvironmentalTrend(days: number = 7): Promise<EnvironmentalTrendPoint[]> {
    const response = await apiFetch(`/analytics/environmental-trend?days=${days}`) as any;
    return response.data;
  }
};
