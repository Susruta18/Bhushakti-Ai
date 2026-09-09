import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Leaf, Mountain, History, Trees, MapPin, AlertTriangle, Users, Building2, ChevronRight } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskGauge } from '../../components/risk/RiskGauge';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { PageLoader } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { riskService } from '../../services/riskService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { buildRoute } from '../../constants/routes';
import type { RiskZone } from '../../types';

export default function RiskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [zone, setZone] = useState<RiskZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { navigate('/risk-map'); return; }
    riskService.getRiskZone(id)
      .then(setZone)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <MobileLayout><PageLoader /></MobileLayout>;
  if (error || !zone) return <MobileLayout><ErrorState message={error || 'Zone not found.'} /></MobileLayout>;

  const FACTORS = [
    { icon: Droplets, label: 'Rainfall (24h)', value: zone.rainfall24h != null ? `${zone.rainfall24h} mm` : 'N/A', level: (zone.rainfall24h || 0) > 70 ? 'critical' : (zone.rainfall24h || 0) > 50 ? 'high' : 'low' },
    { icon: Leaf, label: 'Soil Moisture', value: zone.soilMoisture != null ? `${zone.soilMoisture}%` : 'N/A', level: (zone.soilMoisture || 0) > 70 ? 'high' : (zone.soilMoisture || 0) > 50 ? 'moderate' : 'low' },
    { icon: Mountain, label: 'Slope', value: zone.slope != null ? `${zone.slope}°` : 'N/A', level: (zone.slope || 0) > 35 ? 'high' : (zone.slope || 0) > 25 ? 'moderate' : 'low' },
    { icon: History, label: 'Historical Susceptibility', value: zone.historicalSusceptibility ? zone.historicalSusceptibility.charAt(0).toUpperCase() + zone.historicalSusceptibility.slice(1) : 'Low', level: zone.historicalSusceptibility || 'low' },
    { icon: Trees, label: 'Land Use', value: zone.landUse || 'N/A', level: 'low' },
  ] as const;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Back header */}
        <div className="flex items-center gap-3 -mt-2">
          <button onClick={() => navigate('/risk-map')} className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div>
            <h2 className="text-headline-sm text-on-surface">{zone.name}</h2>
            <p className="text-label-sm text-on-surface-variant">Risk Zone Details</p>
          </div>
          <div className="ml-auto">
            <RiskBadge level={zone.riskLevel} />
          </div>
        </div>

        {/* Gauge */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col items-center gap-4">
          <RiskGauge probability={zone.probability} riskLevel={zone.riskLevel} size="md" />
          <div className="text-center">
            <p className="text-body-md text-on-surface-variant">Estimated Landslide Probability</p>
            <p className="text-label-sm text-on-surface-variant mt-1">
              Updated {formatTimeAgo(zone.lastUpdated)} · {zone.region}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'Population Exposure', value: zone.populationExposure != null ? zone.populationExposure.toLocaleString() : 'N/A' },
            { icon: Building2, label: 'Critical Assets', value: zone.criticalAssets != null ? zone.criticalAssets.toString() : 'N/A' },
            { icon: Mountain, label: 'Elevation', value: zone.elevation != null ? `${zone.elevation}m` : 'N/A' },
            { icon: MapPin, label: 'Land Use', value: zone.landUse ? zone.landUse.split(' / ')[0] : 'N/A' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-surface-container border border-outline-variant rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Icon className="w-4 h-4" />
                <span className="text-label-sm uppercase">{label}</span>
              </div>
              <p className="text-headline-sm text-on-surface">{value}</p>
            </div>
          ))}
        </div>

        {/* Risk factors */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-headline-sm text-on-surface">Risk Factor Analysis</h3>
          <div className="flex flex-col gap-2">
            {FACTORS.map(({ icon: Icon, label, value, level }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-body-md text-on-surface">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-body-md text-on-surface-variant text-right">{value}</span>
                  <RiskBadge level={level as 'critical' | 'high' | 'moderate' | 'low'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(buildRoute.responsePlan(`plan-00${FACTORS.length - 4}`))}
            className="w-full h-12 bg-on-background text-background text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            View Response Plan
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="w-full h-12 border border-outline-variant text-on-surface text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors active:scale-[0.98]"
          >
            <AlertTriangle className="w-4 h-4" />
            View Zone Alerts
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
