import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, CheckCheck } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { PageLoader } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { responseService } from '../../services/responseService';
import type { ResponsePlan as ResponsePlanType, ResponseAction } from '../../types';
import { cn } from '../../utils/cn';

const CATEGORY_COLORS: Record<string, string> = {
  inspection: 'bg-primary-container text-primary',
  communication: 'bg-tertiary-container text-tertiary',
  evacuation: 'bg-error-container text-error',
  monitoring: 'bg-secondary-container text-secondary',
  reporting: 'bg-surface-container-highest text-on-surface-variant',
};

const PRIORITY_LABELS: Record<string, string> = {
  immediate: '🔴 Immediate',
  high: '🟡 High',
  normal: '🔵 Normal',
};

export default function ResponsePlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<ResponsePlanType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { navigate('/response-priority'); return; }
    responseService.getResponsePlan(id)
      .then(setPlan)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleToggle = async (action: ResponseAction) => {
    if (!plan) return;
    try {
      const updated = await responseService.updateActionStatus(plan.id, action.id, !action.completed);
      setPlan(updated);
    } catch { /* silent */ }
  };

  if (loading) return <MobileLayout><PageLoader /></MobileLayout>;
  if (error || !plan) return <MobileLayout><ErrorState message={error || 'Plan not found.'} /></MobileLayout>;

  const completed = plan.actions.filter((a) => a.completed).length;
  const total = plan.actions.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Back nav */}
        <div className="flex items-center gap-3 -mt-2">
          <button onClick={() => navigate('/response-priority')} className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div className="flex-1">
            <h2 className="text-headline-sm text-on-surface">{plan.zoneName}</h2>
            <p className="text-label-sm text-on-surface-variant">Response Plan</p>
          </div>
          <RiskBadge level={plan.riskLevel} />
        </div>

        {/* Progress card */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-label-md text-on-surface-variant uppercase">Progress</span>
            <span className="text-headline-sm text-on-surface">{completed}/{total}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progress === 100 ? 'bg-risk-low' : plan.riskLevel === 'critical' ? 'bg-error' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-label-sm text-on-surface-variant">
            <span>{completed} completed</span>
            <span>{total - completed} remaining</span>
          </div>
        </div>

        {/* Checklist — from Stitch response plan design */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-headline-sm text-on-surface flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-primary" />
            Action Checklist
          </h3>

          <div className="flex flex-col gap-2">
            {plan.actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleToggle(action)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border text-left transition-all active:scale-[0.98]',
                  action.completed
                    ? 'bg-risk-low/10 border-risk-low/30 opacity-80'
                    : 'bg-surface-container-high border-outline-variant hover:bg-surface-container-highest'
                )}
              >
                {/* Checkbox */}
                <div className={cn('mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors', action.completed ? 'bg-risk-low border-risk-low' : 'border-outline-variant bg-transparent')}>
                  {action.completed && <CheckCircle2 className="w-4 h-4 text-background" />}
                  {!action.completed && <Circle className="w-3 h-3 text-transparent" />}
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <p className={cn('text-body-md font-medium', action.completed ? 'text-on-surface-variant line-through' : 'text-on-surface')}>
                    {action.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase', CATEGORY_COLORS[action.category])}>
                      {action.category}
                    </span>
                    <span className="text-label-sm text-on-surface-variant">{PRIORITY_LABELS[action.priority]}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Completion message */}
        {progress === 100 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-risk-low/10 border border-risk-low/30 rounded-xl animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0" />
            <div>
              <p className="text-label-md text-risk-low uppercase">All Actions Complete</p>
              <p className="text-label-sm text-on-surface-variant mt-0.5">Response plan fully executed.</p>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
