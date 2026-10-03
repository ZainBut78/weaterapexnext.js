'use client';

import { CloudRain, Wind, Thermometer, Droplets, CheckCircle2, AlertTriangle, Pencil } from 'lucide-react';
import { useUnits } from '../../context/UnitsContext';

const RISK_CONFIG = {
  low: { color: '#34D399', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'LOW RISK' },
  moderate: { color: '#FB923C', bg: 'bg-orange-50', text: 'text-orange-600', label: 'MODERATE RISK' },
  high: { color: '#F87171', bg: 'bg-red-50', text: 'text-red-600', label: 'HIGH RISK' },
};

const RiskResult = ({ data, onEdit }) => {
  const units = useUnits(); // °C/°F + km/h/mph (audit 3.2)
  const {
    eventType = 'Wedding',
    city = 'Barcelona, Spain',
    dateTimeLabel = 'August 15, 2024 at 4:00 PM',
    riskScore = 4.0,
    riskLevel = 'low',
    rainProbability = 22,
    windKmh = 12,
    temperatureC = 23,
    humidityPct = 58,
    recommendation = 'Conditions are generally favorable. A light backup plan is advised due to a slight chance of afternoon showers.',
    warning = null,
  } = data || {};

  // riskLevel backend se kuch aur aa jaye to config undefined ho jata tha
  // aur poora component crash kar deta tha. Fallback ab "low" hai.
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.low;

  // riskScore par seedha .toFixed() lagta tha — agar backend null/string
  // bhej de to "toFixed is not a function" se result card blank ho jata.
  const score = Number(riskScore);
  const safeScore = Number.isFinite(score) ? score : 0;

  const circumference = 2 * Math.PI * 54;
  const progress = (Math.min(Math.max(safeScore, 0), 10) / 10) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 max-w-5xl mx-auto">

      {/* Header — mobile pe "Edit Details" 2 lines mein tootta tha aur
          pencil icon text se align nahi hota tha. Ab button shrink nahi
          hota (shrink-0 + whitespace-nowrap) aur left block min-w-0 hai. */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
            {eventType}
          </span>
          <h2 className="flex items-start gap-2 text-lg font-bold text-slate-900">
            <span className="mt-1 shrink-0"><MapPinIcon /></span>
            <span className="min-w-0 break-words">{city}</span>
          </h2>
          <p className="flex items-start gap-2 text-sm text-slate-500 mt-1">
            <span className="mt-0.5 shrink-0"><CalendarIcon /></span>
            <span className="min-w-0">{dateTimeLabel}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex shrink-0 items-center justify-center gap-1.5 -mr-2 -mt-1 min-h-11 px-2 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Pencil size={14} className="shrink-0" />
          <span className="hidden sm:inline">Edit Details</span>
          <span className="sm:hidden">Edit</span>
        </button>
      </div>

      <hr className="border-gray-100 mb-6" />

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">

        {/* Gauge */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={config.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-slate-900">{safeScore.toFixed(1)}</span>
              <span className="text-sm text-slate-400">/ 10</span>
            </div>
          </div>
          <span className={`mt-4 ${config.bg} ${config.text} text-xs font-bold px-4 py-1.5 rounded-full`}>
            {config.label}
          </span>
        </div>

        {/* Recommendation + Stats */}
        <div className="flex-1 w-full">
          <div className={`flex gap-3 ${config.bg} border-l-4 rounded-r-lg p-4 mb-5`} style={{ borderColor: config.color }}>
            <CheckCircle2 size={20} className={`${config.text} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`font-semibold text-sm ${config.text} mb-1`}>Safe to proceed</p>
              <p className="text-sm text-slate-600">{recommendation}</p>
            </div>
          </div>

          {warning && (
            <div className="flex gap-3 bg-amber-50 border-l-4 rounded-r-lg p-4 mb-5" style={{ borderColor: '#F59E0B' }}>
              <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-amber-700 mb-1">Whole-day caution</p>
                <p className="text-sm text-slate-600">{warning}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={CloudRain} value={`${rainProbability}%`} label="RAIN" color="text-blue-500" />
            <StatCard icon={Wind} value={units.wind(windKmh)} label={`${units.windUnit.toUpperCase()} WIND`} color="text-slate-500" />
            <StatCard icon={Thermometer} value={`${units.temp(temperatureC)}°`} label="TEMP" color="text-orange-500" />
            <StatCard icon={Droplets} value={`${humidityPct}%`} label="HUMIDITY" color="text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, color }) => (
  <div className="bg-slate-50 rounded-xl p-4 text-center">
    <Icon size={18} className={`${color} mx-auto mb-2`} />
    <p className="text-xl font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-400 font-medium tracking-wide">{label}</p>
  </div>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export default RiskResult;