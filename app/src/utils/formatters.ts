// =========================================================
// BHUSHAKTI AI — Formatter Utilities
// =========================================================

import type { HazardType, AssetType } from '../types';

export const formatProbability = (value: number): string => `${value}%`;

export const formatRainfall = (mm: number): string => `${mm} mm`;

export const formatMoisture = (pct: number): string => `${pct}%`;

export const formatSlope = (deg: number): string => `${deg}°`;

export const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)} km`;

export const formatPopulation = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

export const hazardTypeLabel: Record<HazardType, string> = {
  ground_crack: 'Ground Crack',
  soil_movement: 'Soil Movement',
  rockfall: 'Rockfall',
  road_damage: 'Road Damage',
  landslide: 'Landslide',
  drainage_blockage: 'Drainage Blockage',
};

export const assetTypeLabel: Record<AssetType, string> = {
  road: 'Road',
  bridge: 'Bridge',
  hospital: 'Hospital',
  school: 'School',
  emergency_shelter: 'Emergency Shelter',
  government_facility: 'Government Facility',
};

export const formatHazardType = (type: HazardType): string => hazardTypeLabel[type] || type;

export const formatAssetType = (type: AssetType): string => assetTypeLabel[type] || type;
