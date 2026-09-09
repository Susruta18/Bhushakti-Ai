import { getDatabase } from '../config/database';
import { AlertDocument, EnvironmentalDataDocument, RiskPredictionDocument, RiskZoneDocument } from '../models/types';

export const getOverviewMetrics = async () => {
  const db = getDatabase();
  
  // Active Alerts
  const activeAlerts = await db.collection<AlertDocument>('alerts').countDocuments({ status: 'ACTIVE' });

  // Highest Risk
  const zones = await db.collection<RiskZoneDocument>('risk_zones').find({ isActive: true }).toArray();
  let highestRisk = 0;
  if (zones.length > 0) {
    highestRisk = Math.max(...zones.map(z => z.currentProbability));
  }

  // Max Rainfall 24h
  // The environmental_data pipeline records 'rainfall' periodically. For a true 24h maximum, 
  // we would query the last 24h. We assume 'rainfall' stores 24h cumulative or equivalent.
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const recentEnvData = await db.collection<EnvironmentalDataDocument>('environmental_data')
    .find({ recordedAt: { $gte: oneDayAgo } })
    .toArray();
  
  let maxRainfall24h = null;
  if (recentEnvData.length > 0) {
    const validRainfall = recentEnvData.map(d => d.rainfall).filter((r): r is number => r !== undefined && r !== null);
    if (validRainfall.length > 0) {
      maxRainfall24h = Math.max(...validRainfall);
    }
  }

  return {
    activeAlerts,
    highestRisk,
    maxRainfall24h,
    reportsFiled: 'N/A'
  };
};

export const getRiskDistribution = async () => {
  const db = getDatabase();
  const zones = await db.collection<RiskZoneDocument>('risk_zones').find({ isActive: true }).toArray();
  
  if (zones.length === 0) return [];

  const counts: Record<string, number> = {
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    CRITICAL: 0
  };

  zones.forEach(z => {
    if (counts[z.riskLevel] !== undefined) {
      counts[z.riskLevel]++;
    }
  });

  const total = zones.length;
  
  return Object.keys(counts).map(level => ({
    level,
    count: counts[level],
    percentage: Math.round((counts[level] / total) * 100)
  }));
};

export const getRiskTrend = async (days: number = 7) => {
  const db = getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const predictions = await db.collection<RiskPredictionDocument>('risk_predictions')
    .find({ predictedAt: { $gte: startDate } })
    .sort({ predictedAt: 1 })
    .toArray();

  if (predictions.length === 0) return [];

  // Group by day to create a trend line
  const trendMap = new Map<string, { count: number, totalProb: number }>();
  
  predictions.forEach(p => {
    // Format YYYY-MM-DD
    const dateStr = p.predictedAt.toISOString().split('T')[0];
    const existing = trendMap.get(dateStr) || { count: 0, totalProb: 0 };
    trendMap.set(dateStr, {
      count: existing.count + 1,
      totalProb: existing.totalProb + p.probability
    });
  });

  const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
    date,
    averageProbability: data.totalProb / data.count,
    predictionCount: data.count
  })).sort((a, b) => a.date.localeCompare(b.date));

  return trend;
};

export const getAlertsTrend = async (days: number = 7) => {
  const db = getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const alerts = await db.collection<AlertDocument>('alerts')
    .find({ createdAt: { $gte: startDate } })
    .sort({ createdAt: 1 })
    .toArray();

  if (alerts.length === 0) return [];

  const trendMap = new Map<string, { critical: number, high: number, moderate: number }>();

  alerts.forEach(a => {
    const dateStr = a.createdAt.toISOString().split('T')[0];
    const existing = trendMap.get(dateStr) || { critical: 0, high: 0, moderate: 0 };
    if (a.severity === 'CRITICAL') existing.critical++;
    else if (a.severity === 'HIGH') existing.high++;
    else if (a.severity === 'MODERATE') existing.moderate++;
    trendMap.set(dateStr, existing);
  });

  return Array.from(trendMap.entries()).map(([date, counts]) => ({
    date,
    ...counts
  })).sort((a, b) => a.date.localeCompare(b.date));
};

export const getEnvironmentalTrend = async (days: number = 7) => {
  const db = getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await db.collection<EnvironmentalDataDocument>('environmental_data')
    .find({ recordedAt: { $gte: startDate } })
    .sort({ recordedAt: 1 })
    .toArray();

  if (data.length === 0) return [];

  const trendMap = new Map<string, { count: number, totalRainfall: number, totalMoisture: number }>();

  data.forEach(d => {
    const dateStr = d.recordedAt.toISOString().split('T')[0];
    const existing = trendMap.get(dateStr) || { count: 0, totalRainfall: 0, totalMoisture: 0 };
    
    // Only aggregate if values exist
    if (d.rainfall !== undefined && d.rainfall !== null) {
      existing.totalRainfall += d.rainfall;
    }
    if (d.soilMoisture !== undefined && d.soilMoisture !== null) {
      existing.totalMoisture += d.soilMoisture;
    }
    existing.count++;
    
    trendMap.set(dateStr, existing);
  });

  return Array.from(trendMap.entries()).map(([date, counts]) => ({
    date,
    averageRainfall: counts.count > 0 ? counts.totalRainfall / counts.count : null,
    averageSoilMoisture: counts.count > 0 ? counts.totalMoisture / counts.count : null,
  })).sort((a, b) => a.date.localeCompare(b.date));
};
