import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, ChevronRight, Clock, MapPin } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { PageLoader } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/ErrorState';
import { reportService } from '../../services/reportService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { formatHazardType } from '../../utils/formatters';
import { buildRoute } from '../../constants/routes';
import type { FieldReport } from '../../types';
import { cn } from '../../utils/cn';

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-primary-container text-on-primary-container',
  under_review: 'bg-tertiary-container text-on-tertiary-container',
  verified: 'bg-risk-low/20 text-risk-low',
  resolved: 'bg-surface-container-high text-on-surface-variant',
  rejected: 'bg-error-container/30 text-error',
};

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

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  const submitted = reports.filter((r) => r.status !== 'resolved').length;
  const verified = reports.filter((r) => r.status === 'verified').length;
  const critical = reports.filter((r) => r.riskLevel === 'critical').length;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4">
        {/* Stats bento — from Stitch reports screen */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Field Reports', value: reports.length, color: 'text-primary' },
            { label: 'Verified', value: verified, color: 'text-risk-low' },
            { label: 'Critical', value: critical, color: 'text-error' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface-container border border-outline-variant rounded-lg p-3 flex flex-col items-center text-center gap-1">
              <span className={cn('text-[24px] font-bold leading-none', color)}>{value}</span>
              <span className="text-label-sm text-on-surface-variant uppercase leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Header + New Report button */}
        <div className="flex justify-between items-center">
          <h2 className="text-headline-sm text-on-surface">Field Reports</h2>
          <button
            onClick={() => navigate('/reports/new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-lg text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>

        {/* Reports list */}
        {loading ? (
          <PageLoader message="Loading reports..." />
        ) : reports.length === 0 ? (
          <EmptyState title="No reports" message="No field reports found." />
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => navigate(buildRoute.reportDetail(report.id))}
                className="w-full bg-surface-container-high border border-surface-container-highest rounded-xl overflow-hidden text-left transition-all hover:bg-surface-container-highest active:scale-[0.98] flex"
              >
                {/* Left accent */}
                <div className={cn('w-1 shrink-0', LEVEL_BAR[report.riskLevel])} />

                <div className="flex flex-col gap-3 flex-1 p-4">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" />
                      <div>
                        <p className="text-headline-sm text-on-surface">{formatHazardType(report.hazardType)}</p>
                        <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="text-label-sm">{report.location}</span>
                        </div>
                      </div>
                    </div>
                    <RiskBadge level={report.riskLevel} />
                  </div>

                  {/* Description */}
                  <p className="text-body-md text-on-surface-variant line-clamp-2">{report.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-label-sm">{formatTimeAgo(report.reportedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded', STATUS_STYLES[report.status])}>
                        {STATUS_LABELS[report.status]}
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
