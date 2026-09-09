import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { PageLoader } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { reportService } from '../../services/reportService';
import { formatDateTime, formatTimeAgo } from '../../utils/dateUtils';
import { formatHazardType } from '../../utils/formatters';
import type { FieldReport } from '../../types';
import { cn } from '../../utils/cn';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  verified: 'Verified',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const LEVEL_BAR: Record<string, string> = {
  critical: 'bg-error', high: 'bg-tertiary', moderate: 'bg-secondary', low: 'bg-risk-low',
};

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<FieldReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { navigate('/reports'); return; }
    reportService.getReport(id)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <MobileLayout><PageLoader /></MobileLayout>;
  if (error || !report) return <MobileLayout><ErrorState message={error || 'Report not found.'} /></MobileLayout>;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Back nav */}
        <div className="flex items-center gap-3 -mt-2">
          <button onClick={() => navigate('/reports')} className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div className="flex-1">
            <h2 className="text-headline-sm text-on-surface">{formatHazardType(report.hazardType)}</h2>
            <p className="text-label-sm text-on-surface-variant">{report.zone}</p>
          </div>
          <RiskBadge level={report.riskLevel} />
        </div>

        {/* Photo */}
        {report.photoUrl && (
          <div className="relative bg-surface-container border border-outline-variant rounded-xl overflow-hidden h-48">
            <img src={report.photoUrl} alt="Field report photo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <div className={cn('absolute left-3 bottom-3 px-2 py-0.5 rounded text-[10px] font-semibold uppercase', LEVEL_BAR[report.riskLevel].replace('bg-', 'bg-'), 'text-background')}>
              {report.riskLevel} risk
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider">Location</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-body-lg text-on-surface">{report.location}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider">Description</p>
            <p className="text-body-md text-on-surface leading-relaxed">{report.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/30">
            <div className="flex flex-col gap-1">
              <p className="text-label-sm text-on-surface-variant uppercase">Reported By</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-on-surface-variant" />
                <span className="text-body-md text-on-surface">{report.reportedBy}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-label-sm text-on-surface-variant uppercase">Reported</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-on-surface-variant" />
                <span className="text-body-md text-on-surface">{formatTimeAgo(report.reportedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-headline-sm text-on-surface">Status</h3>

          <div className="flex items-center gap-3 py-2">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-body-md text-on-surface font-semibold">Submitted</p>
              <p className="text-label-sm text-on-surface-variant">{formatDateTime(report.reportedAt)}</p>
            </div>
          </div>

          {report.verifiedAt ? (
            <div className="flex items-center gap-3 py-2 border-t border-outline-variant/30">
              <CheckCircle2 className="w-5 h-5 text-risk-low shrink-0" />
              <div className="flex-1">
                <p className="text-body-md text-on-surface font-semibold">Verified</p>
                <p className="text-label-sm text-on-surface-variant">{formatDateTime(report.verifiedAt)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2 border-t border-outline-variant/30 opacity-50">
              <AlertCircle className="w-5 h-5 text-on-surface-variant shrink-0" />
              <p className="text-body-md text-on-surface-variant">Pending verification</p>
            </div>
          )}
        </div>

        {/* Current status */}
        <div className={cn(
          'px-4 py-3 rounded-lg border flex items-center justify-center',
          report.status === 'verified' ? 'bg-risk-low/10 border-risk-low/30 text-risk-low' :
          report.status === 'under_review' ? 'bg-tertiary-container/20 border-tertiary-container/50 text-tertiary' :
          'bg-surface-container border-outline-variant text-on-surface-variant'
        )}>
          <span className="text-label-md uppercase tracking-wider">
            {STATUS_LABELS[report.status] || report.status}
          </span>
        </div>
      </div>
    </MobileLayout>
  );
}
