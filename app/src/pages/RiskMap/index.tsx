import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Layers, Crosshair, Plus, Minus, X, ChevronRight } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { RiskBadge } from '../../components/risk/RiskBadge';
import { riskService } from '../../services/riskService';
import { buildRoute } from '../../constants/routes';
import type { RiskZone } from '../../types';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PageLoader } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

// =========================================================
// RiskMap.tsx — Pluggable map component
// Currently uses a styled GIS-like visual (Stitch approach)
// Replace the inner <MapCanvas> with React Leaflet / MapLibre later
// without changing surrounding layout/bottom-sheet structure
// =========================================================

interface LocationBottomSheetProps {
  zone: RiskZone;
  onClose: () => void;
  onViewDetails: () => void;
}

const LocationBottomSheet: React.FC<LocationBottomSheetProps> = ({ zone, onClose, onViewDetails }) => {
  const riskColors: Record<string, string> = {
    critical: 'bg-error-container text-on-error-container border-error-container/50',
    high: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container/50',
    moderate: 'bg-secondary-container text-on-secondary-container border-secondary-container/50',
    low: 'bg-risk-low/20 text-risk-low border-risk-low/30',
  };

  return (
    <div className="absolute bottom-16 left-0 w-full bg-surface-container rounded-t-[20px] border-t border-outline-variant shadow-[0_-8px_30px_rgba(0,0,0,0.6)] z-40 animate-slide-up">
      {/* Drag handle */}
      <div className="w-full flex justify-center pt-3 pb-2">
        <div className="w-12 h-1.5 bg-outline-variant rounded-full" />
      </div>

      <div className="px-4 pb-6 pt-2 flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-headline-sm text-on-surface">Landslide Risk Map</h2>
            <p className="text-label-md text-on-surface-variant">Selected Region Details</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 border whitespace-nowrap shadow-sm text-label-md ${riskColors[zone.riskLevel]}`}>
              {zone.name.toUpperCase()} — {zone.riskLevel.toUpperCase()} ({zone.probability}%)
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data grid — bento style from Stitch */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-high p-4 rounded-xl border border-outline-variant flex flex-col gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="text-primary text-sm">💧</span>
              <span className="text-label-sm uppercase tracking-wider">Rainfall (24h)</span>
            </div>
            <div className="text-[28px] font-bold text-on-surface leading-none">
              {zone.rainfall24h != null ? zone.rainfall24h : 'N/A'}<span className="text-body-md text-on-surface-variant ml-1">{zone.rainfall24h != null ? 'mm' : ''}</span>
            </div>
          </div>
          <div className="bg-surface-container-high p-4 rounded-xl border border-outline-variant flex flex-col gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="text-tertiary text-sm">🌱</span>
              <span className="text-label-sm uppercase tracking-wider">Soil Moisture</span>
            </div>
            <div className="text-[28px] font-bold text-on-surface leading-none">
              {zone.soilMoisture != null ? zone.soilMoisture : 'N/A'}<span className="text-body-md text-on-surface-variant ml-1">{zone.soilMoisture != null ? '%' : ''}</span>
            </div>
          </div>
        </div>

        {/* Additional info row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Slope', value: zone.slope != null ? `${zone.slope}°` : 'N/A' },
            { label: 'Population', value: zone.populationExposure != null ? zone.populationExposure.toLocaleString() : 'N/A' },
            { label: 'Assets', value: zone.criticalAssets != null ? zone.criticalAssets.toString() : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-high px-3 py-2 rounded-lg border border-outline-variant text-center">
              <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
              <p className="text-body-md text-on-surface font-semibold mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Action buttons — from Stitch */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onViewDetails}
            className="flex-1 h-12 border border-outline-variant text-on-surface bg-transparent hover:bg-surface-variant rounded-lg text-label-md uppercase tracking-wider transition-colors active:scale-95"
          >
            View Details
          </button>
          <button
            onClick={onViewDetails}
            className="flex-1 h-12 bg-on-surface text-surface hover:opacity-90 rounded-lg text-label-md uppercase tracking-wider transition-colors active:scale-95"
          >
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
};

// Replaced static SVG layout with Leaflet MapContainer

const riskColorMap: Record<string, string> = {
  critical: '#ffb4ab',
  high: '#ddc39d',
  moderate: '#b9c8de',
  low: '#22C55E',
};

// Helper component to center map on selected zone
function MapCenterer({ selectedZone }: { selectedZone: RiskZone | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedZone && selectedZone.coordinates && selectedZone.coordinates.lat !== 0 && selectedZone.coordinates.lng !== 0) {
      map.flyTo([selectedZone.coordinates.lat, selectedZone.coordinates.lng], 13, { duration: 1 });
    }
  }, [selectedZone, map]);
  return null;
}

export default function RiskMapPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [activeLayer, setActiveLayer] = useState('Risk');

  useEffect(() => {
    riskService.getRiskZones()
      .then(fetchedZones => {
        setZones(fetchedZones);
        if (id) {
          const matched = fetchedZones.find(z => z.id === id);
          if (matched) setSelectedZone(matched);
        } else if (fetchedZones.length > 0) {
          setSelectedZone(fetchedZones[0]);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleZoneClick = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) setSelectedZone(zone);
  };

  const LAYERS = ['Risk', 'Rainfall', 'Soil Moisture', 'Slope', 'Infrastructure', 'Field Reports'];

  if (loading) return <MobileLayout noPadding><PageLoader message="Loading map data..." /></MobileLayout>;
  if (error) return <MobileLayout noPadding><ErrorState message={error} onRetry={() => window.location.reload()} /></MobileLayout>;

  return (
    <MobileLayout noPadding>
      {/* Full-screen map container */}
      <div className="absolute inset-0 pt-14 pb-16">

        {/* ======================================================
            REAL GIS MAP CANVAS
            ====================================================== */}
        <div className="relative w-full h-full bg-surface-dim overflow-hidden z-0">
          {zones.filter(z => z.coordinates && z.coordinates.lat !== 0 && z.coordinates.lng !== 0).length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-[#0b1326] px-6 text-center">
              <p className="text-on-surface-variant text-body-lg">
                No geographic coordinates available for current risk zones.
              </p>
            </div>
          ) : (
            <MapContainer 
              center={[27.0, 88.2]} // Default center approx Darjeeling
              zoom={10} 
              zoomControl={false}
              className="w-full h-full"
              style={{ background: '#0b1326' }}
            >
              {/* Using a dark themed tile layer */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              <MapCenterer selectedZone={selectedZone} />

              {zones.map((zone) => {
                if (!zone.coordinates || zone.coordinates.lat === 0 || zone.coordinates.lng === 0) return null;
                
                const color = riskColorMap[zone.riskLevel] || riskColorMap.low;
                const isSelected = selectedZone?.id === zone.id;

                const customIcon = L.divIcon({
                  className: 'custom-map-icon',
                  html: `
                    <div style="
                      width: 32px; height: 32px; 
                      border-radius: 50%; 
                      border: 2px solid ${color};
                      background-color: ${color}30;
                      box-shadow: ${isSelected ? `0 0 16px ${color}60` : 'none'};
                      transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
                      transition: all 0.3s ease;
                      display: flex; align-items: center; justify-content: center;
                      transform-origin: center center;
                    ">
                      ${isSelected ? `<div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};" class="animate-pulse"></div>` : ''}
                    </div>
                  `,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                });

                return (
                  <Marker 
                    key={zone.id} 
                    position={[zone.coordinates.lat, zone.coordinates.lng]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => handleZoneClick(zone.id)
                    }}
                  />
                );
              })}

              {/* Map controls are overlaid natively, removing custom zoom buttons below */}
              <ZoomControl position="bottomright" />
            </MapContainer>
          )}
        {/* ======================================================
            END REAL GIS MAP CANVAS
            ====================================================== */}

          {/* Map controls — right edge, from Stitch */}
          <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="w-12 h-12 bg-surface-container-high/90 backdrop-blur-sm border border-outline-variant rounded-full flex items-center justify-center text-on-surface shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:scale-95 transition-transform hover:bg-surface-variant"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="w-12 h-12 bg-surface-container-high/90 backdrop-blur-sm border border-outline-variant rounded-full flex items-center justify-center text-on-surface shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:scale-95 transition-transform hover:bg-surface-variant"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-surface-container-high/90 backdrop-blur-sm border border-outline-variant rounded-full flex items-center justify-center text-on-surface shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:scale-95 transition-transform hover:bg-surface-variant">
              <Crosshair className="w-5 h-5" />
            </button>
          </div>



          {/* Layers panel */}
          {showLayers && (
            <div className="absolute top-4 left-4 bg-surface-container border border-outline-variant rounded-xl p-4 z-20 w-48 shadow-lg animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <span className="text-label-md text-on-surface uppercase tracking-wider">Layers</span>
                <button onClick={() => setShowLayers(false)}>
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {LAYERS.map((layer) => (
                  <button
                    key={layer}
                    onClick={() => { setActiveLayer(layer); setShowLayers(false); }}
                    className={`text-left px-3 py-2 rounded-lg text-body-md transition-colors ${
                      activeLayer === layer
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Risk zone list — compact navigation */}
          <div className="absolute top-4 left-4 right-20 bg-surface-container/90 backdrop-blur-md border border-outline-variant rounded-xl px-3 py-2 z-10 flex items-center gap-2">
            <span className="text-label-sm text-on-surface-variant shrink-0">Layer:</span>
            <span className="text-label-md text-primary">{activeLayer}</span>
            <button onClick={() => setShowLayers(true)} className="ml-auto">
              <Layers className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
        </div>

        {/* Bottom sheet — from Stitch */}
        {selectedZone && (
          <LocationBottomSheet
            zone={selectedZone}
            onClose={() => setSelectedZone(null)}
            onViewDetails={() => navigate(buildRoute.riskMapDetail(selectedZone.id))}
          />
        )}

        {/* Zone list (when no zone selected) */}
        {!selectedZone && (
          <div className="absolute bottom-16 left-0 w-full bg-surface-container rounded-t-[20px] border-t border-outline-variant shadow-[0_-8px_30px_rgba(0,0,0,0.6)] z-40">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-outline-variant rounded-full" />
            </div>
            <div className="px-4 pb-6 pt-2">
              <h2 className="text-headline-sm text-on-surface mb-3">Risk Zones</h2>
              <div className="flex flex-col gap-2">
                {zones.slice(0, 3).map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className="flex items-center gap-3 p-3 bg-surface-container-high rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-colors text-left"
                  >
                    <div className={`w-2 h-8 rounded-full ${
                      zone.riskLevel === 'critical' ? 'bg-error' :
                      zone.riskLevel === 'high' ? 'bg-tertiary' :
                      zone.riskLevel === 'moderate' ? 'bg-secondary' : 'bg-risk-low'
                    }`} />
                    <div className="flex-1">
                      <p className="text-headline-sm text-on-surface">{zone.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{zone.probability}% probability</p>
                    </div>
                    <RiskBadge level={zone.riskLevel} />
                    <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
