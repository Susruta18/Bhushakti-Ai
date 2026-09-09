import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, TriangleAlert, CheckCircle2, Upload } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { reportService } from '../../services/reportService';
import type { HazardType, ReportFormData } from '../../types';
import { cn } from '../../utils/cn';

const HAZARD_TYPES: { value: HazardType; label: string; icon: string }[] = [
  { value: 'ground_crack', label: 'Ground Crack', icon: '🪨' },
  { value: 'soil_movement', label: 'Soil Movement', icon: '🌱' },
  { value: 'rockfall', label: 'Rockfall', icon: '⛰️' },
  { value: 'road_damage', label: 'Road Damage', icon: '🛣️' },
  { value: 'landslide', label: 'Landslide', icon: '⚠️' },
  { value: 'drainage_blockage', label: 'Drainage Blockage', icon: '🌊' },
];

type FormStep = 'form' | 'submitting' | 'success';

export default function ReportHazard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FormStep>('form');
  const [form, setForm] = useState<ReportFormData>({
    hazardType: 'ground_crack',
    location: '',
    description: '',
    photos: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ReportFormData, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof ReportFormData, string>> = {};
    if (!form.location.trim()) e.location = 'Location is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStep('submitting');
    try {
      await reportService.createReport(form);
      setStep('success');
    } catch {
      setStep('form');
    }
  };

  if (step === 'submitting') {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center gap-6 min-h-[70vh]">
          <div className="w-20 h-20 rounded-full border-4 border-primary-container border-t-primary animate-spin" />
          <div className="text-center flex flex-col gap-2">
            <p className="text-headline-sm text-on-surface">Submitting Report...</p>
            <p className="text-body-md text-on-surface-variant">Uploading field data</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (step === 'success') {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center gap-6 min-h-[70vh] text-center">
          <div className="w-20 h-20 rounded-full bg-risk-low/20 border-2 border-risk-low flex items-center justify-center animate-fade-in">
            <CheckCircle2 className="w-10 h-10 text-risk-low" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-headline-sm text-on-surface">Report Submitted</p>
            <p className="text-body-md text-on-surface-variant">
              Your field report has been received and is under review.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => navigate('/reports')}
              className="w-full h-12 bg-on-background text-background text-label-md uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
            >
              View All Reports
            </button>
            <button
              onClick={() => { setStep('form'); setForm({ hazardType: 'ground_crack', location: '', description: '', photos: [] }); }}
              className="w-full h-12 border border-outline-variant text-on-surface text-label-md uppercase tracking-widest rounded-xl hover:bg-surface-container-high active:scale-[0.98] transition-all"
            >
              Submit Another
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Back nav */}
        <div className="flex items-center gap-3 -mt-2">
          <button type="button" onClick={() => navigate('/reports')} className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div>
            <h2 className="text-headline-sm text-on-surface">Report Hazard</h2>
            <p className="text-label-sm text-on-surface-variant">Submit a field observation</p>
          </div>
        </div>

        {/* Hazard type selector */}
        <div className="flex flex-col gap-3">
          <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Hazard Type</label>
          <div className="grid grid-cols-3 gap-2">
            {HAZARD_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, hazardType: value }))}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors active:scale-95',
                  form.hazardType === value
                    ? 'bg-primary-container border-primary/30 text-on-primary-container'
                    : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-label-sm leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col gap-2">
          <label className="text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="location">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              id="location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Enter location or zone name"
              className={cn(
                'w-full h-12 pl-10 pr-4 bg-surface-bright border rounded-lg text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors',
                errors.location ? 'border-error' : 'border-outline'
              )}
            />
          </div>
          {errors.location && (
            <div className="flex items-center gap-1.5 text-error">
              <TriangleAlert className="w-3.5 h-3.5" />
              <span className="text-label-sm">{errors.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            placeholder="Describe what you observed — size, extent, severity, any other relevant details..."
            className={cn(
              'w-full px-3 py-3 bg-surface-bright border rounded-lg text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none',
              errors.description ? 'border-error' : 'border-outline'
            )}
          />
          {errors.description && (
            <div className="flex items-center gap-1.5 text-error">
              <TriangleAlert className="w-3.5 h-3.5" />
              <span className="text-label-sm">{errors.description}</span>
            </div>
          )}
        </div>

        {/* Photo upload placeholder */}
        <div className="flex flex-col gap-2">
          <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Photos (Optional)</label>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 h-24 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              <Camera className="w-6 h-6" />
              <span className="text-label-sm">Take Photo</span>
            </button>
            <button
              type="button"
              className="flex-1 h-24 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-label-sm">Upload File</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full h-12 bg-on-background text-background text-label-md uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] font-semibold mt-2"
        >
          Submit Report
        </button>
      </form>
    </MobileLayout>
  );
}
