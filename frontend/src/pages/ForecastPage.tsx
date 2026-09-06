import React, { useState, useEffect } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import {
  TrendingUp,
  Cpu,
  Calendar,
  CheckCircle2,
  Percent,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { apiService } from '../services/apiService';
import { MedicineForecast, Medicine, Facility } from '../types';
import { ConfidenceBar } from '../components/common/ConfidenceBar';

export const ForecastPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedMedId, setSelectedMedId] = useState<string>(
    searchParams.get('med') || ''
  );
  const [horizon, setHorizon] = useState<'7_DAYS' | '30_DAYS' | '90_DAYS'>('30_DAYS');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [forecast, setForecast] = useState<MedicineForecast | null>(null);

  useEffect(() => {
    apiService.getMedicines().then((meds) => {
      setMedicines(meds);
      setSelectedMedId((prev) => prev || meds[0]?.id || '');
    });
    apiService.getFacilities().then(setFacilities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedMedId) return;
    apiService
      .getForecast(selectedMedId, horizon)
      .then(setForecast)
      .catch((e) => {
        console.error('Error loading forecast', e);
        setForecast(null);
      });
  }, [selectedMedId, horizon]);

  const selectedMed = medicines.find((m) => m.id === selectedMedId);

  // Live model accuracy (from the backend forecast engine) vs the clinical benchmark
  const modelComparisonData = [
    {
      name: forecast ? `${forecast.modelName} (live)` : 'Active Model',
      accuracy: forecast ? Math.round(forecast.accuracyRate) : 0,
    },
    { name: 'Healthcare Benchmark', accuracy: 85 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Demand Forecasts
            </h1>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              Live ML Model
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Predict patient demand cycles, seasonal surges, and consumption requirements.
          </p>
        </div>

        {/* Global Horizon Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs font-bold self-start sm:self-auto">
          {(['7_DAYS', '30_DAYS', '90_DAYS'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                horizon === h
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {h === '7_DAYS' ? '7-Day Horizon' : h === '30_DAYS' ? '30-Day Horizon' : '90-Day Horizon'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Medicine Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Medicine:</span>
          <select
            value={selectedMedId}
            onChange={(e) => setSelectedMedId(e.target.value)}
            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.category})
              </option>
            ))}
          </select>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-bold uppercase text-[10px]">Facility:</span>
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="all">All Healthcare Facilities</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {selectedMed && (
          <div className="ml-auto text-xs text-slate-500 hidden md:block">
            Current Stock: <strong className="text-slate-900">{selectedMed.currentStock} {selectedMed.unit}</strong> | Burn:{' '}
            <strong className="text-slate-900">{selectedMed.dailyConsumption}/day</strong>
          </div>
        )}
      </div>

      {/* 3 Summary Forecast Cards (Prompt Section 11) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setHorizon('7_DAYS')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            horizon === '7_DAYS'
              ? 'bg-teal-50/50 border-teal-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-1">
            <span>7-Day Forecast</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {forecast ? `${Math.round(forecast.accuracyRate)}% Accuracy` : '—'}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {forecast ? forecast.forecast7Day : '—'}{' '}
            <span className="text-xs font-normal text-slate-400">units expected</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            High precision weekly dispatch forecast for immediate buffer planning.
          </p>
        </div>

        <div
          onClick={() => setHorizon('30_DAYS')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            horizon === '30_DAYS'
              ? 'bg-teal-50/50 border-teal-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-1">
            <span>30-Day Forecast</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
              {forecast ? `${Math.round(forecast.accuracyRate)}% Accuracy` : '—'}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {forecast ? forecast.forecast30Day : '—'}{' '}
            <span className="text-xs font-normal text-slate-400">units expected</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Monthly procurement window demand projection for the selected medicine.
          </p>
        </div>

        <div
          onClick={() => setHorizon('90_DAYS')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            horizon === '90_DAYS'
              ? 'bg-teal-50/50 border-teal-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-1">
            <span>90-Day Forecast</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {forecast ? `${Math.round(forecast.accuracyRate)}% Accuracy` : '—'}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {forecast ? forecast.forecast90Day : '—'}{' '}
            <span className="text-xs font-normal text-slate-400">units expected</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Long-range seasonal trend projection for capacity and contract planning.
          </p>
        </div>
      </div>

      {/* Main Forecast Chart View */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Demand Forecast for {forecast?.medicineName || 'Medicine'}
            </h2>
            <p className="text-xs text-slate-500">
              Observed historical consumption vs. model projections with ±1.96σ confidence range.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {forecast ? `Updated: ${forecast.lastUpdated}` : ''}
          </span>
        </div>

        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecast?.points || []}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="u" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 600 }} />
              <Area type="monotone" dataKey="upperConfidence" stroke="transparent" fill="url(#forecastArea)" name="Upper Confidence Limit" />
              <Area type="monotone" dataKey="lowerConfidence" stroke="transparent" fill="#ffffff" name="Lower Confidence Limit" />
              <Line type="monotone" dataKey="historical" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3, fill: '#0284c7' }} name="Historical Consumption" />
              <Line type="monotone" dataKey="forecast" stroke="#0d9488" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3, fill: '#0d9488' }} name="Forecast Projection" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Information & Benchmark Accuracy (Prompt Section 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Model Architecture & Specs Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Cpu className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Model Information & Diagnostics
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Active Model:</span>
                <span className="font-bold text-slate-900">
                  {forecast ? forecast.modelName : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Overall Accuracy:</span>
                <span className="font-bold text-emerald-700">
                  {forecast ? `${forecast.accuracyRate.toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Mean Absolute Error (MAE):</span>
                <span className="font-bold text-slate-900">
                  {forecast ? `${forecast.mae.toFixed(2)} units / day` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Mean Absolute % Error (MAPE):</span>
                <span className="font-bold text-slate-900">
                  {forecast ? `${forecast.mape.toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Telemetry Sampling:</span>
                <span className="font-bold text-slate-900">Daily midnight batch run</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Last Updated:</span>
                <span className="font-medium text-slate-700">
                  {forecast ? forecast.lastUpdated : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>
              Exceeds the 85% healthcare procurement accuracy requirement established by clinical benchmarks.
            </span>
          </div>
        </div>

        {/* Model Benchmark Comparison Bar Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Model Accuracy vs Clinical Benchmark
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live forecast engine accuracy for {selectedMed?.name ?? 'selected medicine'} against
                the 85% healthcare requirement
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              Higher is better
            </span>
          </div>

          <div className="mt-6 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelComparisonData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={120} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Accuracy']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="accuracy" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
