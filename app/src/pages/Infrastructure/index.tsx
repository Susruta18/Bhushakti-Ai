import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, AlertTriangle, MapPin, ChevronRight, Users } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { PageLoader } from '../../components/common/LoadingState';
import { infrastructureService } from '../../services/infrastructureService';
import { formatAssetType, formatDistance } from '../../utils/formatters';
import type { InfrastructureAsset } from '../../types';
import { cn } from '../../utils/cn';

const STATUS_LABELS: Record<string, string> = {
  operational: 'Operational',
  at_risk: 'At Risk',
  damaged: 'Damaged',
  closed: 'Closed',
};

const STATUS_STYLES: Record<string, string> = {
  operational: 'text-risk-low bg-risk-low/10 border-risk-low/30',
  at_risk: 'text-tertiary bg-tertiary-container/20 border-tertiary-container/50',
  damaged: 'text-error bg-error-container/20 border-error-container/50',
  closed: 'text-on-surface-variant bg-surface-container border-outline-variant',
};

const LEVEL_BAR: Record<string, string> = {
  critical: 'bg-error', high: 'bg-tertiary', moderate: 'bg-secondary', low: 'bg-risk-low',
};

const ASSET_ICON: Record<string, string> = {
  road: '🛣️', bridge: '🌉', hospital: '🏥', school: '🏫',
  emergency_shelter: '🏕️', government_facility: '🏛️',
};

export default function InfrastructurePage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    infrastructureService.getInfrastructure()
      .then(setAssets)
      .finally(() => setLoading(false));
  }, []);

  const atRisk = assets.filter((a) => a.riskLevel === 'critical' || a.riskLevel === 'high').length;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-headline-sm text-on-surface">Infrastructure Exposure</h2>
          </div>
          <p className="text-body-md text-on-surface-variant">Critical assets in landslide risk zones</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Assets', value: assets.length, color: 'text-primary' },
            { label: 'At Risk', value: atRisk, color: 'text-error' },
            { label: 'Operational', value: assets.filter(a => a.status === 'operational').length, color: 'text-risk-low' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface-container border border-outline-variant rounded-lg p-3 flex flex-col items-center text-center gap-1">
              <span className={cn('text-[24px] font-bold leading-none', color)}>{value}</span>
              <span className="text-label-sm text-on-surface-variant uppercase leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* At-risk alert */}
        {atRisk > 0 && (
          <div className="bg-error-container/20 border border-error-container/50 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <p className="text-body-md text-on-surface">
              <span className="font-semibold text-error">{atRisk} assets</span> are in high or critical risk zones.
            </p>
          </div>
        )}

        {/* Assets list */}
        {loading ? (
          <PageLoader message="Loading infrastructure..." />
        ) : (
          <div className="flex flex-col gap-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="w-full bg-surface-container-high border border-surface-container-highest rounded-xl overflow-hidden flex"
              >
                {/* Left accent */}
                <div className={cn('w-1.5 shrink-0', LEVEL_BAR[asset.riskLevel])} />

                <div className="flex flex-col gap-3 flex-1 p-4">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ASSET_ICON[asset.type] || '🏗️'}</span>
                      <div>
                        <p className="text-headline-sm text-on-surface">{asset.name}</p>
                        <p className="text-label-sm text-on-surface-variant">{formatAssetType(asset.type)}</p>
                      </div>
                    </div>
                    <RiskBadge level={asset.riskLevel} />
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{asset.zone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>{formatDistance(asset.distanceFromHazard)} from hazard</span>
                    </div>
                    {asset.populationServed && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{asset.populationServed.toLocaleString()} served</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {asset.notes && (
                    <p className="text-label-sm text-on-surface-variant border-t border-outline-variant/30 pt-2">{asset.notes}</p>
                  )}

                  {/* Status */}
                  <div className={cn('self-start px-2 py-1 rounded border text-label-sm font-semibold uppercase', STATUS_STYLES[asset.status])}>
                    {STATUS_LABELS[asset.status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/analytics')}
          className="w-full h-12 border border-outline-variant text-on-surface text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors active:scale-[0.98] mt-2"
        >
          View Analytics
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </MobileLayout>
  );
}
