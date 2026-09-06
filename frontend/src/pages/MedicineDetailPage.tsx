import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Truck,
  TrendingUp,
  AlertTriangle,
  FileText,
  Edit,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { apiService } from '../services/apiService';
import { Medicine, MedicineForecast, Recommendation } from '../types';
import { RiskBadge, Badge } from '../components/common/Badge';
import { ConfidenceBar } from '../components/common/ConfidenceBar';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

export const MedicineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast, currentUser, refreshCounts } = useApp();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [forecast, setForecast] = useState<MedicineForecast | null>(null);
  const [horizon, setHorizon] = useState<'7_DAYS' | '30_DAYS' | '90_DAYS'>('30_DAYS');
  const [relatedRec, setRelatedRec] = useState<Recommendation | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      const med = await apiService.getMedicine(id);
      if (med) {
        setMedicine(med);
        const f = await apiService.getForecast(med.id, horizon);
        setForecast(f);
        const recs = await apiService.getRecommendations();
        const foundRec = recs.find((r) => r.medicineId === med.id);
        if (foundRec) setRelatedRec(foundRec);
      }
    };
    fetchDetails();
  }, [id, horizon]);

  if (!medicine) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading medicine records...
      </div>
    );
  }

  // Inventory trend demo data
  const inventoryTrendData = [
    { day: 'Day 1', stock: 280 },
    { day: 'Day 5', stock: 240 },
    { day: 'Day 10', stock: 200 },
    { day: 'Day 15', stock: 290 }, // batch received
    { day: 'Day 20', stock: 230 },
    { day: 'Day 25', stock: 175 },
    { day: 'Today', stock: medicine.currentStock },
  ];

  const handleApprove = async () => {
    if (!relatedRec) return;
    setLoadingAction(true);
    try {
      await apiService.approveRecommendation(relatedRec.id, currentUser.name);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      addToast({
        type: 'success',
        title: 'Order Approved',
        message: `Order for ${relatedRec.quantity} ${relatedRec.unit} authorized. Stock buffer updated!`,
      });
      setApproveModalOpen(false);
      // Reload medicine
      const updated = await apiService.getMedicine(medicine.id);
      if (updated) setMedicine(updated);
      const recs = await apiService.getRecommendations();
      setRelatedRec(recs.find((r) => r.medicineId === medicine.id) || null);
      await refreshCounts();
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to approve recommendation.' });
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/inventory')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Inventory</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {medicine.name}
            </h1>
            <RiskBadge level={medicine.stockoutRisk} size="md" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {medicine.genericName} • Category: <strong>{medicine.category}</strong> • Facility:{' '}
            <strong>{medicine.facilityName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              addToast({
                type: 'info',
                message: 'Medicine specification editor opened in read-only mode for audit.',
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs"
          >
            <Edit className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (Prompt Section 10) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Current Stock
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {medicine.currentStock}{' '}
            <span className="text-xs font-normal text-slate-400">{medicine.unit}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Safety Stock: <strong>{medicine.safetyStock} units</strong>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Avg Daily Demand
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {medicine.dailyConsumption}{' '}
            <span className="text-xs font-normal text-slate-400">units / day</span>
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            Trend: {medicine.demandTrend}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/10 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1">
            Days Until Stockout
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
            {medicine.daysRemaining} days
          </div>
          <div className="text-xs text-rose-700 font-medium mt-1">
            {medicine.daysRemaining <= 11 ? 'Imminent depletion' : 'Operational buffer'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Supplier Lead Time
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {medicine.supplierLeadTimeDays} days
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Vendor: <strong>MediSupply Pakistan</strong>
          </div>
        </div>
      </div>

      {/* AI Explanation Box (Prompt Section 10: "Why is this medicine high risk?") */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-950 text-white p-6 rounded-2xl border border-teal-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                AI Clinical & Supply Explanation
              </h3>
              <p className="text-xs text-teal-200">
                Why is {medicine.name} flagged as {medicine.stockoutRisk} risk?
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-teal-300 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-500/30 self-start md:self-auto">
            Model Confidence: 91%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {medicine.aiRiskReasons.map((reason, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span className="text-slate-200 leading-relaxed">{reason}</span>
            </div>
          ))}
        </div>

        {/* Action button inside explanation to approve order right here! */}
        {relatedRec && relatedRec.status === 'PENDING' && (
          <div className="mt-5 p-4 rounded-xl bg-teal-500/10 border border-teal-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-teal-300 uppercase tracking-wider">
                Recommended Action Available
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {relatedRec.actionText}: {relatedRec.quantity} {relatedRec.unit} (Est. Rs.{' '}
                {relatedRec.estimatedCostPkr.toLocaleString()})
              </div>
            </div>
            <button
              onClick={() => setApproveModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Approve Order Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Charts Grid: Inventory Trend (Left) & Demand Forecast (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Inventory Burn Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical stock level telemetry</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Last 30 Days
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="u" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stock"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7' }}
                  name="In-Stock Units"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demand Forecast Horizon Selector & Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Projected Demand Curve</h3>
              <p className="text-xs text-slate-500 mt-0.5">Confidence intervals from time-series model</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['7_DAYS', '30_DAYS', '90_DAYS'] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    horizon === h
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {h === '7_DAYS' ? '7D' : h === '30_DAYS' ? '30D' : '90D'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast?.points || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="u" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="upperConfidence" stroke="transparent" fill="#0d9488" fillOpacity={0.15} name="Upper Bound" />
                <Area type="monotone" dataKey="lowerConfidence" stroke="transparent" fill="#ffffff" name="Lower Bound" />
                <Line type="monotone" dataKey="forecast" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3, fill: '#0d9488' }} name="Demand Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock Movement & Risk Analysis (Prompt Section 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stock Movement */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">
            Monthly Stock Movement Ledger
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Audit register for {medicine.stockMovement.period}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Opening</div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {medicine.stockMovement.opening}
              </div>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Received</div>
              <div className="text-lg font-black text-emerald-800 mt-1">
                +{medicine.stockMovement.received}
              </div>
            </div>
            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-center">
              <div className="text-[10px] uppercase font-bold text-rose-700">Issued / Burn</div>
              <div className="text-lg font-black text-rose-800 mt-1">
                -{medicine.stockMovement.issued}
              </div>
            </div>
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 text-center">
              <div className="text-[10px] uppercase font-bold text-teal-800">Closing</div>
              <div className="text-lg font-black text-teal-900 mt-1">
                {medicine.stockMovement.closing}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Analysis Card */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">
              Holistic Risk Diagnostics
            </h3>
            <p className="text-xs text-slate-500 mb-3">Multi-vector inventory stability criteria</p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Stockout Vulnerability:</span>
                <RiskBadge level={medicine.stockoutRisk} size="sm" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Batch Expiry Risk:</span>
                <RiskBadge level={medicine.expiryRisk} size="sm" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Demand Trajectory:</span>
                <span className="font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded">
                  {medicine.demandTrend}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => navigate('/recommendations')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
            >
              <span>View All Matching Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Authorize Medicine Order?"
        subtitle="Confirm order requisition with MediSupply Pakistan"
      >
        {relatedRec && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div>Medicine: <strong>{medicine.name}</strong></div>
              <div>Order Quantity: <strong>{relatedRec.quantity} {relatedRec.unit}</strong></div>
              <div>Estimated Cost: <strong>Rs. {relatedRec.estimatedCostPkr.toLocaleString()}</strong></div>
              <div>Authorized User: <strong>{currentUser.name}</strong></div>
            </div>

            <p className="text-slate-500">
              Placing this order extends operational runway from 11 days to 38 days, protecting patient treatment continuity.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs"
              >
                {loadingAction ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
