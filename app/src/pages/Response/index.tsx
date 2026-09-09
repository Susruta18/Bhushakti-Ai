import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertTriangle, Users, Building2, Navigation } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { RiskGauge } from '../../components/risk/RiskGauge';
import { PageLoader } from '../../components/common/LoadingState';
import { responseService } from '../../services/responseService';
import { buildRoute } from '../../constants/routes';
import type { ResponsePriority } from '../../types';
import { cn } from '../../utils/cn';

const LEVEL_BAR: Record<string, string> = {
  critical: 'bg-error', high: 'bg-tertiary', moderate: 'bg-secondary', low: 'bg-risk-low',
};

const ACTION_COLOR: Record<string, string> = {
  'Immediate': 'text-error bg-error-container/20 border-error-container/50',
  'Urgent': 'text-tertiary bg-tertiary-container/20 border-tertiary-container/50',
  'Monitor': 'text-secondary bg-secondary-container/20 border-secondary-container/50',
  'Standby': 'text-on-surface-variant bg-surface-container border-outline-variant',
};

export default function ResponsePriorityPage() {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<ResponsePriority[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    responseService.getResponsePriorities()
      .then(setPriorities)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <MobileLayout><PageLoader message="Loading priorities..." /></MobileLayout>;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <h2 className="text-headline-sm text-on-surface">Response Priority</h2>
          </div>
          <p className="text-body-md text-on-surface-variant">
            AI-ranked zones by risk, exposure, and accessibility
          </p>
        </div>

        {/* Priority cards — bento with rank accent from Stitch */}
        <div className="flex flex-col gap-3">
          {priorities.map((priority) => (
            <button
              key={priority.id}
              onClick={() => navigate(buildRoute.responsePlan(`plan-00${priority.rank}`))}
              className="w-full bg-surface-container-high border border-surface-container-highest rounded-xl overflow-hidden text-left transition-all active:scale-[0.98]"
            >
              <div className="flex">
                {/* Left accent bar */}
                <div className={cn('w-1.5 shrink-0', LEVEL_BAR[priority.riskLevel])} />

                <div className="flex flex-col gap-4 flex-1 p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Rank badge */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center shrink-0">
                        <span className="text-headline-sm text-on-surface font-bold">#{priority.rank}</span>
                      </div>
                      <div>
                        <p className="text-headline-sm text-on-surface">{priority.zoneName}</p>
                        <p className="text-label-sm text-on-surface-variant">{priority.probability}% probability</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <RiskBadge level={priority.riskLevel} />
                      <RiskGauge probability={priority.probability} riskLevel={priority.riskLevel} size="sm" />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Users, label: 'Population', value: priority.populationExposure.toLocaleString() },
                      { icon: Building2, label: 'Assets', value: priority.criticalAssets.toString() },
                      { icon: Navigation, label: 'Priority', value: `${priority.priorityScore}` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-surface-container rounded-lg px-2 py-2 flex flex-col gap-0.5 border border-outline-variant/50">
                        <div className="flex items-center gap-1 text-on-surface-variant">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase">{label}</span>
                        </div>
                        <span className="text-body-md text-on-surface font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className={cn('text-label-md uppercase tracking-wider px-2 py-1 rounded border', ACTION_COLOR[priority.actionRequired] || ACTION_COLOR['Standby'])}>
                      {priority.actionRequired}
                    </span>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="text-label-sm">{priority.estimatedDeployment}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* AI model disclaimer */}
        <div className="flex items-start gap-2 px-3 py-2 bg-surface-container border border-outline-variant rounded-lg mt-2">
          <AlertTriangle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
          <p className="text-label-sm text-on-surface-variant">
            Priority ranking is based on simulated AI scoring — probability, population exposure, and accessibility. Not for operational use without real data.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
