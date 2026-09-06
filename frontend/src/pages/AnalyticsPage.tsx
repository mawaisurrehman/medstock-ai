import React, { useState, useEffect, useMemo } from 'react';
import { TrendingDown, Coins, ShieldCheck, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { apiService, AnalyticsSnapshot } from '../services/apiService';
import { Medicine, Batch, Facility } from '../types';

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#e11d48',
  HIGH: '#f59e0b',
  MEDIUM: '#0284c7',
  LOW: '#10b981',
  SAFE: '#94a3b8',
};

const CATEGORY_COLORS = ['#0d9488', '#0284c7', '#f59e0b', '#6366f1', '#ec4899', '#84cc16'];

function formatPkr(value: number): string {
  if (value >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rs. ${Math.round(value / 1_000)}K`;
  return `Rs. ${value}`;
}

export const AnalyticsPage: React.FC = () => {
  const { addToast } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    apiService
      .getAnalytics()
      .then(setAnalytics)
      .catch((e) => {
        console.warn('Analytics load error', e);
        setLoadError(true);
      });
    apiService.getMedicines().then(setMedicines).catch(() => undefined);
    apiService.getBatches().then(setBatches).catch(() => undefined);
    apiService.getFacilities().then(setFacilities).catch(() => undefined);
  }, []);

  // Chart 1: Medicines grouped by stockout risk level (live inventory)
  const stockoutRiskData = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, SAFE: 0 };
    medicines.forEach((m) => {
      counts[m.stockoutRisk] = (counts[m.stockoutRisk] ?? 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => ({ level, medicines: count }));
  }, [medicines]);

  // Chart 2: Batches grouped by expiry risk level (live batches)
  const expiryRiskData = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, SAFE: 0 };
    batches.forEach((b) => {
      counts[b.expiryRisk] = (counts[b.expiryRisk] ?? 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => ({ level, batches: count }));
  }, [batches]);

  // Chart 3: Inventory value by therapeutic category (live stock × unit price)
  const categoryValueData = useMemo(() => {
    const values: Record<string, number> = {};
    medicines.forEach((m) => {
      values[m.category] = (values[m.category] ?? 0) + m.currentStock * m.unitPricePkr;
    });
    return Object.entries(values)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [medicines]);

  // Chart 4: Medicine count by category
  const categoryCountData = useMemo(() => {
    const counts: Record<string, number> = {};
    medicines.forEach((m) => {
      counts[m.category] = (counts[m.category] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  }, [medicines]);

  // Chart 5: Top consumed medicines by live daily dispensing rate
  const topConsumedData = useMemo(
    () =>
      [...medicines]
        .sort((a, b) => b.dailyConsumption - a.dailyConsumption)
        .slice(0, 5)
        .map((m) => ({ name: m.name, units: Math.round(m.dailyConsumption) })),
    [medicines]
  );

  // Chart 6: Facility risk comparison (live critical stockouts & expiry risks)
  const facilityComparisonData = useMemo(
    () =>
      facilities.map((f) => ({
        name: f.name,
        stockouts: f.criticalStockouts,
        expiryRisks: f.expiryRisks,
      })),
    [facilities]
  );

  const totalInventoryValue = categoryValueData.reduce((sum, c) => sum + c.value, 0);

  const handleDownloadCSV = () => {
    if (!analytics) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Analytics data has not loaded from the backend yet.',
      });
      return;
    }

    const rows: string[] = [
      'Section,Metric,Value',
      `Overview,Total Medicines,${analytics.overview.totalMedicines}`,
      `Overview,Critical Alerts,${analytics.overview.criticalAlerts}`,
      `Overview,Warnings,${analytics.overview.warnings}`,
      `Overview,Active Recommendations,${analytics.overview.activeRecommendations}`,
      `Stockouts,Total,${analytics.stockouts.total}`,
      `Stockouts,Critical,${analytics.stockouts.critical}`,
      `Stockouts,Resolved,${analytics.stockouts.resolved}`,
      `Expiry,Total,${analytics.expiry.total}`,
      `Expiry,Critical,${analytics.expiry.critical}`,
      `Savings,Estimated Expiry Prevention (PKR),${analytics.savings.estimatedExpiryPrevention}`,
      `Savings,Emergency Purchase Reduction (PKR),${analytics.savings.estimatedEmergencyPurchaseReduction}`,
      `Savings,Total Estimated Savings (PKR),${analytics.savings.totalEstimatedSavings}`,
      `Forecast,Confidence %,${analytics.forecastAccuracy.confidence}`,
      `Forecast,MAPE %,${analytics.forecastAccuracy.mape}`,
      `Forecast,MAE,${analytics.forecastAccuracy.mae}`,
      `Emergency Purchases,Total,${analytics.emergencyPurchases.total}`,
      `Emergency Purchases,Prevented,${analytics.emergencyPurchases.prevented}`,
      `Emergency Purchases,Estimated Cost Avoided (PKR),${analytics.emergencyPurchases.estimatedCostAvoided}`,
      '',
      'Facility,Medicines,Critical Stockouts,Expiry Risks,Inventory Value (PKR)',
      ...facilities.map(
        (f) =>
          `"${f.name}",${f.totalMedicines},${f.criticalStockouts},${f.expiryRisks},${f.inventoryValuePkr}`
      ),
    ];

    const csvContent = `data:text/csv;charset=utf-8,${encodeURI(rows.join('\n'))}`;
    const a = document.createElement('a');
    a.href = csvContent;
    a.download = `medstock_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addToast({
      type: 'success',
      title: 'Analytics Exported',
      message: 'Live analytics snapshot saved as CSV.',
    });
  };

  if (loadError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center">
          <ShieldCheck className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-black text-slate-900">Analytics Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">
            Could not load metrics from the MedStock AI backend. Please verify the API server is
            running and you are signed in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Executive Analytics & Impact
            </h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Live Database Metrics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cross-sectional operational performance, waste mitigation, and supply chain telemetry
            computed from live inventory data.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs self-start sm:self-auto"
          title="Download analytics snapshot as CSV"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Executive Metric Cards (live analytics endpoint) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Critical Stockout Alerts
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {analytics ? analytics.stockouts.critical : '—'}
            </span>
            {analytics && (
              <span className="text-xs text-slate-400">of {analytics.stockouts.total}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{analytics ? `${analytics.stockouts.resolved} resolved` : ''}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Expiry Risk Alerts
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {analytics ? analytics.expiry.critical : '—'}
            </span>
            {analytics && <span className="text-xs text-slate-400">of {analytics.expiry.total}</span>}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {batches.length ? `${batches.length} batches tracked` : 'Batch data loading...'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Estimated Savings
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {analytics ? formatPkr(analytics.savings.totalEstimatedSavings) : '—'}
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-2">
            <Coins className="w-3.5 h-3.5" />
            <span>
              {analytics
                ? `${formatPkr(analytics.savings.estimatedExpiryPrevention)} expiry prevented`
                : ''}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Forecast Precision
          </div>
          <div className="text-3xl font-black text-teal-700 tracking-tight">
            {analytics ? `${analytics.forecastAccuracy.confidence.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-teal-800 font-semibold mt-2">
            {analytics ? `Mean MAPE: ${analytics.forecastAccuracy.mape.toFixed(1)}%` : ''}
          </div>
        </div>
      </div>

      {/* Row 1: Stockout Risk Distribution & Expiry Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Stockout Risk Distribution</h3>
              <p className="text-xs text-slate-500">Medicines by computed risk level</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {medicines.length} medicines
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockoutRiskData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="medicines" name="Medicines" radius={[6, 6, 0, 0]}>
                  {stockoutRiskData.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level] ?? '#0d9488'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Batch Expiry Risk Distribution</h3>
              <p className="text-xs text-slate-500">Batches by days-to-expiry assessment</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {batches.length} batches
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryRiskData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="batches" name="Batches" radius={[6, 6, 0, 0]}>
                  {expiryRiskData.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level] ?? '#0d9488'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Inventory Value by Category & Category Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Inventory Value by Therapeutic Category
              </h3>
              <p className="text-xs text-slate-500">
                Live stock × unit price, computed from the medicine catalog
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{formatPkr(totalInventoryValue)}</span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryValueData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}K`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number) => [formatPkr(val), 'Inventory Value']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} name="Value (PKR)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Medicines by Category</h3>
              <span className="text-xs font-bold text-slate-400">
                Total: {medicines.length}
              </span>
            </div>

            <div className="mt-2 h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryCountData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryCountData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} medicines`, 'Count']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {categoryCountData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-slate-600 truncate">{c.name}:</span>
                <span className="font-bold text-slate-900">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top Consumed Medicines & Facility Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-black text-slate-900 mb-1">
            Top Consumed Medicines (Daily Dispensing Volume)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Highest live burn rates (units/day) across the catalog
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConsumedData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  formatter={(val: number) => [`${val} units/day`, 'Burn Rate']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="units" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-black text-slate-900 mb-1">Facility Risk Comparison</h3>
          <p className="text-xs text-slate-500 mb-4">
            Critical stockouts and expiry risks per healthcare facility
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityComparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
                <Bar dataKey="stockouts" fill="#e11d48" radius={[4, 4, 0, 0]} name="Critical Stockouts" />
                <Bar dataKey="expiryRisks" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Expiry Risks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Emergency purchase impact strip (live analytics) */}
      {analytics && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Emergency Purchase Impact</h3>
              <p className="text-xs text-slate-500">
                {analytics.emergencyPurchases.prevented} of {analytics.emergencyPurchases.total}{' '}
                emergency purchases prevented by proactive AI reordering
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Estimated Cost Avoided
            </div>
            <div className="text-xl font-black text-emerald-700">
              {formatPkr(analytics.emergencyPurchases.estimatedCostAvoided)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
