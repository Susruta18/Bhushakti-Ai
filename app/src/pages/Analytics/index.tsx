import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, TrendingUp, Droplets, AlertCircle } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { PageLoader } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { analyticsService } from '../../services/analyticsService';
import type { AnalyticsOverview, RiskDistribution, AnalyticsRiskTrendPoint as RiskTrendPoint, AlertTrendPoint, EnvironmentalTrendPoint } from '../../types';

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#ffb4ab',
  HIGH: '#ddc39d',
  MODERATE: '#b9c8de',
  LOW: '#22C55E',
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution[]>([]);
  const [riskTrend, setRiskTrend] = useState<RiskTrendPoint[]>([]);
  const [alertTrend, setAlertTrend] = useState<AlertTrendPoint[]>([]);
  const [environmentalTrend, setEnvironmentalTrend] = useState<EnvironmentalTrendPoint[]>([]);

  useEffect(() => {
    Promise.all([
      analyticsService.getOverview(),
      analyticsService.getRiskDistribution(),
      analyticsService.getRiskTrend(),
      analyticsService.getAlertsTrend(),
      analyticsService.getEnvironmentalTrend()
    ])
      .then(([o, rd, rt, at, et]) => {
        setOverview(o);
        setRiskDistribution(rd);
        setRiskTrend(rt);
        setAlertTrend(at);
        setEnvironmentalTrend(et);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <MobileLayout><PageLoader message="Loading analytics..." /></MobileLayout>;
  if (error || !overview) return <MobileLayout><ErrorState message={error || 'Failed to load analytics'} onRetry={() => window.location.reload()} /></MobileLayout>;

  // Combine risk trend and environmental trend by date for the dual-axis chart
  const combinedTrend: { date: string, rainfall: number, risk: number }[] = [];
  // For simplicity, we just use the last 7 dates that have either
  const allDates = new Set([...riskTrend.map(r => r.date), ...environmentalTrend.map(e => e.date)]);
  const sortedDates = Array.from(allDates).sort();
  
  sortedDates.forEach(date => {
    const r = riskTrend.find(r => r.date === date);
    const e = environmentalTrend.find(e => e.date === date);
    combinedTrend.push({
      date,
      rainfall: e?.averageRainfall || 0,
      risk: r?.averageProbability || 0
    });
  });

  const maxRainfall = combinedTrend.length > 0 ? Math.max(...combinedTrend.map(d => d.rainfall)) : 0;
  const maxAlerts = alertTrend.length > 0 ? Math.max(...alertTrend.map(d => d.critical + d.high + d.moderate)) : 0;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            <h2 className="text-headline-sm text-on-surface">Analytics</h2>
          </div>
          <p className="text-body-md text-on-surface-variant">Risk trends and environmental data — Darjeeling Hills</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Current Risk', value: `${Math.round(overview.highestRisk * 100)}%`, sub: 'Max Probability', color: 'text-tertiary' },
            { label: 'Rainfall 24h', value: overview.maxRainfall24h !== null ? `${overview.maxRainfall24h}mm` : 'N/A', sub: 'Max Recorded', color: 'text-primary' },
            { label: 'Active Alerts', value: overview.activeAlerts.toString(), sub: 'Currently Active', color: 'text-error' },
            { label: 'Reports Filed', value: overview.reportsFiled, sub: 'Module Unavailable', color: 'text-secondary' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-1">
              <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
              <p className={`text-[28px] font-bold leading-none ${color}`}>{value}</p>
              <p className="text-label-sm text-on-surface-variant">{sub}</p>
            </div>
          ))}
        </div>

        {/* Rainfall + Risk chart */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" />
            <h3 className="text-headline-sm text-on-surface">Rainfall vs. Risk (Today)</h3>
          </div>

          {/* Dual-axis bar chart SVG */}
          {combinedTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center border border-outline-variant/30 rounded-lg bg-surface-container-high/30">
              <p className="text-label-md text-on-surface-variant">No historical data available yet</p>
            </div>
          ) : (
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 40, 80, 120, 160].map((y) => (
                  <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#45474c" strokeWidth="0.5" strokeDasharray="4,4" />
                ))}

                {/* Rainfall bars */}
                {combinedTrend.map((d, i) => {
                  const barWidth = 300 / combinedTrend.length;
                  const barH = maxRainfall > 0 ? (d.rainfall / maxRainfall) * 140 : 0;
                  return (
                    <rect
                      key={`bar-${i}`}
                      x={i * barWidth + 4}
                      y={160 - barH}
                      width={barWidth - 16}
                      height={barH}
                      rx="2"
                      fill="#1e293b"
                      stroke="#bcc7de"
                      strokeWidth="0.5"
                    />
                  );
                })}

                {/* Risk probability line */}
                <polyline
                  fill="none"
                  points={combinedTrend.map((d, i) => {
                    const x = (i / (combinedTrend.length - 1)) * 300;
                    const y = 160 - d.risk * 160;
                    return `${x},${y}`;
                  }).join(' ')}
                  stroke="#ddc39d"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Last point dot */}
                {(() => {
                  const last = combinedTrend[combinedTrend.length - 1];
                  return (
                    <circle
                      cx="300"
                      cy={160 - last.risk * 160}
                      r="3"
                      fill="#ffb4ab"
                    />
                  );
                })()}
              </svg>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-surface-container-high border border-primary rounded-sm" />
              <span className="text-label-sm text-on-surface-variant">Rainfall</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-tertiary" />
              <span className="text-label-sm text-on-surface-variant">Risk Probability</span>
            </div>
          </div>
        </div>

        {/* Alert history bar chart */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-error" />
            <h3 className="text-headline-sm text-on-surface">Alert History (7 Days)</h3>
          </div>

          {alertTrend.length === 0 ? (
            <div className="h-36 flex items-center justify-center border border-outline-variant/30 rounded-lg bg-surface-container-high/30">
              <p className="text-label-md text-on-surface-variant">No historical data available yet</p>
            </div>
          ) : (
            <div className="relative h-36">
              <svg className="w-full h-full" viewBox={`0 ${-10} ${alertTrend.length * 40} 140`} preserveAspectRatio="none">
                {alertTrend.map((d, i) => {
                  const total = d.critical + d.high + d.moderate;
                  const scale = maxAlerts > 0 ? 100 / maxAlerts : 1;
                  let y = 100;

                  const segments = [
                    { value: d.critical, color: '#ffb4ab' },
                    { value: d.high, color: '#ddc39d' },
                    { value: d.moderate, color: '#b9c8de' },
                  ];

                  return (
                    <g key={i} transform={`translate(${i * 40 + 5}, 0)`}>
                      {segments.map(({ value, color }, si) => {
                        const h = value * scale;
                        y -= h;
                        return (
                          <rect key={si} x="5" y={y} width="24" height={h} fill={color} rx="1" />
                        );
                      })}
                      <text x="17" y="120" fill="#8f9097" fontSize="10" textAnchor="middle">
                        {d.date.split('-')[2]}
                      </text>
                      {total > 0 && (
                        <text x="17" y={Math.max(5, 100 - total * scale - 4)} fill="#dae2fd" fontSize="9" textAnchor="middle">
                          {total}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          <div className="flex gap-4">
            {['Critical', 'High', 'Moderate'].map((level) => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: RISK_COLORS[level] }} />
                <span className="text-label-sm text-on-surface-variant">{level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk distribution donut */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-headline-sm text-on-surface">Zone Risk Distribution</h3>
          </div>

          {riskDistribution.length === 0 ? (
            <div className="h-32 flex items-center justify-center border border-outline-variant/30 rounded-lg bg-surface-container-high/30">
              <p className="text-label-md text-on-surface-variant">No zones available</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <svg className="w-28 h-28 shrink-0" viewBox="0 0 100 100">
                {(() => {
                  let currentAngle = -90;
                  return riskDistribution.map(({ level, percentage }) => {
                    const startAngle = currentAngle;
                    const sweepAngle = (percentage / 100) * 360;
                    currentAngle += sweepAngle;
                    const r = 40;
                    const cx = 50, cy = 50;
                    const start = { x: cx + r * Math.cos((startAngle * Math.PI) / 180), y: cy + r * Math.sin((startAngle * Math.PI) / 180) };
                    const end = { x: cx + r * Math.cos(((startAngle + sweepAngle) * Math.PI) / 180), y: cy + r * Math.sin(((startAngle + sweepAngle) * Math.PI) / 180) };
                    const large = sweepAngle > 180 ? 1 : 0;
                    // Prevent rendering issues when percentage is 100
                    if (percentage === 100) {
                      return <circle key={level} cx={cx} cy={cy} r={r} fill={RISK_COLORS[level]} stroke="#0b1326" strokeWidth="1.5" />;
                    }
                    if (percentage === 0) return null;
                    return (
                      <path
                        key={level}
                        d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`}
                        fill={RISK_COLORS[level]}
                        stroke="#0b1326"
                        strokeWidth="1.5"
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="22" fill="#0b1326" />
                <text x="50" y="46" fill="#dae2fd" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {riskDistribution.reduce((sum, r) => sum + r.count, 0)}
                </text>
                <text x="50" y="57" fill="#8f9097" fontSize="7" textAnchor="middle">Zones</text>
              </svg>

              <div className="flex flex-col gap-2">
                {riskDistribution.map(({ level, count, percentage }) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: RISK_COLORS[level] }} />
                    <span className="text-body-md text-on-surface">{level}</span>
                    <span className="text-label-sm text-on-surface-variant ml-auto">({count}) {percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
