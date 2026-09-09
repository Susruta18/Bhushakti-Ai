import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Droplets, Mountain, Leaf, History, Eye, Route, ClipboardCheck, ChevronRight } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskGauge } from '../../components/risk/RiskGauge';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { PageLoader } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { riskService } from '../../services/riskService';
import { alertService } from '../../services/alertService';
import { formatTimeAgo, isDataStale, getDataAge } from '../../utils/dateUtils';
import type { RiskZone } from '../../types';
import { buildRoute } from '../../constants/routes';
import { MOCK_RISK_TREND } from '../../data/mockData';

export default function HomePage() {
  const navigate = useNavigate();
  const [zone, setZone] = useState<RiskZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAlerts, setActiveAlerts] = useState<number | null>(null);

  useEffect(() => {
    riskService.getCurrentRisk()
      .then(setZone)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    alertService.getActiveAlertCount()
      .then(setActiveAlerts)
      .catch(console.error);
  }, []);

  if (loading) return <MobileLayout><PageLoader message="Loading risk data..." /></MobileLayout>;
  if (error) return <MobileLayout><ErrorState message={error} onRetry={() => window.location.reload()} /></MobileLayout>;
  if (!zone) return null;

  const stale = isDataStale(zone.lastUpdated);

  // Trend chart points from mock data
  const trendPoints = MOCK_RISK_TREND.map((p, i) => ({
    x: (i / (MOCK_RISK_TREND.length - 1)) * 100,
    y: 100 - p.probability,
  }));
  const polylinePoints = trendPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const polygonPoints = `0,100 ${polylinePoints} 100,100`;

  const RISK_FACTORS = [
    { icon: Droplets, label: 'Rainfall', value: zone.rainfall24h != null ? `${zone.rainfall24h} mm` : 'N/A', level: 'high' as const, highlight: true },
    { icon: Leaf, label: 'Soil Moisture', value: zone.soilMoisture != null ? `${zone.soilMoisture}%` : 'N/A', level: 'high' as const, highlight: true },
    { icon: Mountain, label: 'Slope', value: zone.slope != null ? `${zone.slope}°` : 'N/A', level: 'moderate' as const, highlight: false },
    { icon: History, label: 'History', value: zone.historicalSusceptibility === 'high' ? 'Active' : (zone.historicalSusceptibility === 'moderate' ? 'Moderate' : 'Low'), level: zone.historicalSusceptibility as 'high' | 'moderate' | 'low', highlight: zone.historicalSusceptibility === 'high' },
  ];

  const ACTIONS = [
    { icon: Eye, label: 'Increase structural monitoring' },
    { icon: Route, label: 'Inspect primary access roads' },
    { icon: ClipboardCheck, label: 'Verify local spotter reports' },
  ];

  return (
    <MobileLayout>
      <div className="flex flex-col gap-6">
        {/* Stale data warning */}
        {stale && (
          <div className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
            <p className="text-label-sm text-on-surface-variant">
              Environmental data was last updated {getDataAge(zone.lastUpdated)} ago.
            </p>
          </div>
        )}

        {/* Context header */}
        <section className="flex flex-col gap-2 text-center">
          <div className="flex items-center justify-center gap-2 text-on-surface-variant">
            <MapPin className="w-4 h-4" />
            <span className="text-body-md">{zone.region}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-label-md text-on-surface-variant uppercase">
              Last updated {formatTimeAgo(zone.lastUpdated)}
            </span>
          </div>
        </section>

        {/* Risk Gauge Card — glassmorphism from Stitch */}
        <section className="relative bg-surface-container/50 backdrop-blur-xl border border-outline-variant rounded-xl p-6 flex flex-col items-center gap-4 overflow-hidden">
          {/* Map pattern overlay */}
          <div className="absolute inset-0 bg-map-pattern opacity-50 pointer-events-none" />

          <div className="relative z-10 text-center flex flex-col gap-1">
            <h2 className="text-headline-sm text-on-surface">CURRENT RISK: <span className="uppercase">{zone.riskLevel}</span></h2>
            <p className="text-body-md text-on-surface-variant">Estimated Landslide Probability</p>
          </div>

          <div className="relative z-10">
            <RiskGauge probability={zone.probability} riskLevel={zone.riskLevel} size="lg" />
          </div>

          {/* Trend indicator */}
          <div className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full border ${
            zone.trend === 'increasing'
              ? 'bg-error-container/20 border-error-container/50'
              : zone.trend === 'decreasing'
              ? 'bg-risk-low/10 border-risk-low/30'
              : 'bg-surface-container border-outline-variant'
          }`}>
            <TrendingUp className={`w-4 h-4 ${zone.trend === 'increasing' ? 'text-error' : 'text-on-surface-variant'}`} />
            <span className={`text-label-md uppercase ${zone.trend === 'increasing' ? 'text-error' : 'text-on-surface-variant'}`}>
              Trend: {zone.trend.charAt(0).toUpperCase() + zone.trend.slice(1)}
            </span>
          </div>
        </section>

        {/* Bento grid: Risk factors — matches Stitch exactly */}
        <section className="flex flex-col gap-3">
          <h3 className="text-headline-sm text-on-surface">Why is the risk {zone.riskLevel}?</h3>
          <div className="grid grid-cols-2 gap-2">
            {RISK_FACTORS.map(({ icon: Icon, label, value, level, highlight }) => (
              <div
                key={label}
                className="bg-surface-container border border-outline-variant rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden"
              >
                {highlight && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-error-container/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
                )}
                <div className="flex justify-between items-start">
                  <Icon className="w-5 h-5 text-on-surface-variant" />
                  <RiskBadge level={level} />
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
                  <p className="text-headline-sm text-on-surface">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Actions — matches Stitch */}
        <section className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
          <h3 className="text-headline-sm text-on-surface flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tertiary" />
            Recommended Actions
          </h3>
          <ul className="flex flex-col gap-2">
            {ACTIONS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 p-2 bg-surface-container-high rounded-lg border border-outline-variant/50">
                <div className="w-8 h-8 rounded bg-primary-container text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-body-md text-on-surface">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Primary CTA */}
        <button
          onClick={() => navigate(buildRoute.riskMapDetail(zone.id))}
          className="w-full h-12 bg-primary text-on-primary text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors active:scale-95 duration-100"
        >
          View Risk Details
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Quick stats — horizontal scroll from Stitch */}
        <section className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
          {[
            { value: activeAlerts !== null ? activeAlerts.toString() : '0', label: 'Active Alerts', color: 'text-error', nav: '/alerts' },
            { value: 'N/A', label: 'Nearby Reports', color: 'text-tertiary', nav: '/reports' },
            { value: 'N/A', label: 'Critical Assets', color: 'text-primary', nav: '/infrastructure' },
          ].map(({ value, label, color, nav }) => (
            <button
              key={label}
              onClick={() => navigate(nav)}
              className="flex-none w-32 bg-surface-container-lowest border border-outline-variant rounded-lg p-2 flex flex-col items-center justify-center gap-1 text-center active:scale-95 transition-transform"
            >
              <span className={`text-[28px] font-bold leading-none tracking-tight ${color}`}>{value}</span>
              <span className="text-label-sm text-on-surface-variant uppercase">{label}</span>
            </button>
          ))}
        </section>

        {/* Risk Trend chart — SVG from Stitch */}
        <section className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
          <h3 className="text-headline-sm text-on-surface">Risk Trend (24h)</h3>
          <div className="h-32 w-full relative border-b border-l border-outline-variant/30">
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#bcc7de" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <polygon fill="url(#trendGrad)" opacity="0.2" points={polygonPoints} />
              <polyline
                fill="none"
                points={polylinePoints}
                stroke="#bcc7de"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Last data point */}
              <circle
                cx={trendPoints[trendPoints.length - 1].x}
                cy={trendPoints[trendPoints.length - 1].y}
                r="2"
                fill="#ffb4ab"
              />
            </svg>
          </div>
          <div className="flex justify-between text-on-surface-variant text-label-sm">
            <span>Yesterday</span>
            <span>Now</span>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
