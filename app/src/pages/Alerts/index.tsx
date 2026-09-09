import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { PageLoader } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/ErrorState';
import { alertService } from '../../services/alertService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { buildRoute } from '../../constants/routes';
import type { Alert, AlertFilter, RiskLevel } from '../../types';
import { cn } from '../../utils/cn';

const FILTERS: { value: AlertFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  escalated: 'Escalated',
  resolved: 'Resolved',
};

const LEVEL_BAR: Record<RiskLevel, string> = {
  critical: 'bg-error',
  high: 'bg-tertiary',
  moderate: 'bg-secondary',
  low: 'bg-risk-low',
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    alertService.getAlerts(filter)
      .then(setAlerts)
      .finally(() => setLoading(false));
  }, [filter]);

  // Calculate from loaded alerts if available, otherwise fetch a separate count if needed.
  // For simplicity since we fetch all matching alerts, we can compute from state.
  // Wait, if filter is 'resolved', alerts won't have 'active' ones. 
  // Let's create an effect to fetch total active count separately if needed, 
  // or just use a dedicated service call.
  const [activeCount, setActiveCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    alertService.getAlerts('all').then(allAlerts => {
      setActiveCount(allAlerts.filter(a => a.status !== 'resolved').length);
      setCriticalCount(allAlerts.filter(a => a.riskLevel === 'critical' && a.status !== 'resolved').length);
    }).catch(console.error);
  }, []);

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4">
        {/* Threat indicator bar — from Stitch alerts design */}
        {criticalCount > 0 && (
          <div className="bg-error-container/20 border border-error-container/50 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div className="flex-1">
              <p className="text-headline-sm text-error">CRITICAL ALERT ACTIVE</p>
              <p className="text-label-sm text-on-surface-variant mt-0.5">
                {criticalCount} critical zone{criticalCount > 1 ? 's' : ''} require immediate attention
              </p>
            </div>
            <Bell className="w-5 h-5 text-error animate-pulse-slow" />
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-headline-sm text-on-surface">Active Alerts</h2>
          <span className="text-label-md text-on-surface-variant bg-surface-container px-2 py-1 rounded border border-outline-variant">
            {activeCount} Active
          </span>
        </div>

        {/* Filter chips — from Stitch */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'flex-none px-4 py-2 rounded-full border text-label-md font-semibold tracking-wider uppercase whitespace-nowrap transition-colors',
                filter === value
                  ? 'bg-primary-container text-on-primary-container border-primary/30'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Alerts list */}
        {loading ? (
          <PageLoader message="Loading alerts..." />
        ) : alerts.length === 0 ? (
          <EmptyState title="No alerts" message="No alerts match the current filter." />
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => navigate(buildRoute.alertDetail(alert.id))}
                className="alert-card w-full text-left transition-transform"
              >
                {/* Left accent bar */}
                <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', LEVEL_BAR[alert.riskLevel])} />

                <div className="flex flex-col gap-3 flex-1 ml-2">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-headline-sm text-on-surface">{alert.zoneName}</span>
                      <span className="text-body-md text-on-surface-variant line-clamp-1">{alert.trigger}</span>
                    </div>
                    <RiskBadge level={alert.riskLevel} />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
                    <span>{alert.probability}% probability</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span>{alert.rainfall} mm rain</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span>{alert.soilMoisture}% moisture</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="text-label-sm text-on-surface-variant">{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded',
                        alert.status === 'active' ? 'bg-error-container/30 text-error' :
                        alert.status === 'resolved' ? 'bg-risk-low/10 text-risk-low' :
                        'bg-surface-container-highest text-on-surface-variant'
                      )}>
                        {STATUS_LABELS[alert.status]}
                      </span>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
