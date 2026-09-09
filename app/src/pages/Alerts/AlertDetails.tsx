import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCheck, UserCheck, ChevronUp, CheckCircle2, Clock, Droplets, Leaf, Users, Building2 } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { RiskGauge } from '../../components/risk/RiskGauge';
import { PageLoader } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { alertService } from '../../services/alertService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { buildRoute } from '../../constants/routes';
import type { Alert } from '../../types';

export default function AlertDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { navigate('/alerts'); return; }
    alertService.getAlert(id)
      .then(setAlert)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAcknowledge = async () => {
    if (!alert) return;
    setActionLoading('acknowledge');
    try {
      const updated = await alertService.acknowledgeAlert(alert.id);
      setAlert(updated);
    } finally { setActionLoading(null); }
  };

  const handleResolve = async () => {
    if (!alert) return;
    setActionLoading('resolve');
    try {
      const updated = await alertService.resolveAlert(alert.id);
      setAlert(updated);
    } finally { setActionLoading(null); }
  };

  if (loading) return <MobileLayout><PageLoader /></MobileLayout>;
  if (error || !alert) return <MobileLayout><ErrorState message={error || 'Alert not found.'} /></MobileLayout>;

  const LEVEL_BAR: Record<string, string> = {
    critical: 'bg-error', high: 'bg-tertiary', moderate: 'bg-secondary', low: 'bg-risk-low',
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Back nav */}
        <div className="flex items-center gap-3 -mt-2">
          <button onClick={() => navigate('/alerts')} className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div className="flex-1">
            <h2 className="text-headline-sm text-on-surface">{alert.zoneName}</h2>
            <p className="text-label-sm text-on-surface-variant">{formatTimeAgo(alert.timestamp)}</p>
          </div>
          <RiskBadge level={alert.riskLevel} />
        </div>

        {/* Alert severity card */}
        <div className={`relative bg-surface-container border border-outline-variant rounded-xl p-4 overflow-hidden`}>
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${LEVEL_BAR[alert.riskLevel]}`} />
          <div className="ml-3 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider">Alert Trigger</p>
              <p className="text-headline-sm text-on-surface">{alert.trigger}</p>
            </div>
            <RiskGauge probability={alert.probability} riskLevel={alert.riskLevel} size="sm" />
          </div>
        </div>

        {/* Description */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Description</p>
          <p className="text-body-md text-on-surface leading-relaxed">{alert.description}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Droplets, label: 'Rainfall', value: alert.rainfall !== undefined ? `${alert.rainfall} mm` : 'N/A' },
            { icon: Leaf, label: 'Soil Moisture', value: alert.soilMoisture !== undefined ? `${alert.soilMoisture}%` : 'N/A' },
            { icon: Users, label: 'Population', value: alert.populationExposure !== undefined ? alert.populationExposure.toLocaleString() : 'N/A' },
            { icon: Building2, label: 'Critical Assets', value: alert.criticalAssets !== undefined ? alert.criticalAssets.toString() : 'N/A' },
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

        {/* Response required */}
        {alert.responseRequired && (
          <div className="bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-tertiary" />
            <div>
              <p className="text-label-sm text-on-surface-variant">Response Required</p>
              <p className="text-headline-sm text-on-surface">{alert.responseRequired}</p>
            </div>
          </div>
        )}

        {/* Status info */}
        {alert.acknowledgedBy && (
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-container border border-outline-variant rounded-lg">
            <UserCheck className="w-4 h-4 text-primary" />
            <span className="text-body-md text-on-surface-variant">Acknowledged by <span className="text-on-surface font-semibold">{alert.acknowledgedBy}</span></span>
          </div>
        )}
        {alert.assignedTo && (
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-container border border-outline-variant rounded-lg">
            <UserCheck className="w-4 h-4 text-secondary" />
            <span className="text-body-md text-on-surface-variant">Assigned to <span className="text-on-surface font-semibold">{alert.assignedTo}</span></span>
          </div>
        )}

        {/* Action buttons — from Stitch */}
        {alert.status !== 'resolved' && (
          <div className="flex flex-col gap-2 pb-4">
            {alert.status === 'active' && (
              <button
                onClick={handleAcknowledge}
                disabled={!!actionLoading}
                className="w-full h-12 bg-primary-container text-on-primary-container text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading === 'acknowledge' ? (
                  <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : <CheckCheck className="w-4 h-4" />}
                Acknowledge Alert
              </button>
            )}
            <button
              onClick={() => navigate(buildRoute.responsePlan('plan-001'))}
              className="w-full h-12 border border-outline-variant text-on-surface text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors active:scale-[0.98]"
            >
              <ChevronUp className="w-4 h-4" />
              Open Response Plan
            </button>
            <button
              onClick={handleResolve}
              disabled={!!actionLoading}
              className="w-full h-12 border border-risk-low/40 text-risk-low text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-risk-low/10 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {actionLoading === 'resolve' ? (
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : <CheckCircle2 className="w-4 h-4" />}
              Mark Resolved
            </button>
          </div>
        )}

        {alert.status === 'resolved' && (
          <div className="flex items-center justify-center gap-2 text-risk-low py-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-label-md uppercase tracking-wider">Alert Resolved</span>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
