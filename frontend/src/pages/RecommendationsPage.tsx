import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Building2,
  Coins,
  ShieldCheck,
  Check,
  Edit3,
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Recommendation } from '../types';
import { ConfidenceBar } from '../components/common/ConfidenceBar';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

export const RecommendationsPage: React.FC = () => {
  const { currentUser, addToast, refreshCounts } = useApp();

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  // Modals
  const [approveModalRec, setApproveModalRec] = useState<Recommendation | null>(null);
  const [modifyModalRec, setModifyModalRec] = useState<Recommendation | null>(null);
  const [modifyQty, setModifyQty] = useState<number>(300);
  const [loading, setLoading] = useState(false);

  const fetchRecs = async () => {
    const list = await apiService.getRecommendations();
    setRecs(list);
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleApprove = async () => {
    if (!approveModalRec) return;
    setLoading(true);
    try {
      await apiService.approveRecommendation(approveModalRec.id, currentUser.name);
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
      addToast({
        type: 'success',
        title: 'Recommendation Approved',
        message: `${approveModalRec.code} successfully processed. Audit trail updated.`,
      });
      setApproveModalRec(null);
      await fetchRecs();
      await refreshCounts();
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to approve recommendation.' });
    } finally {
      setLoading(false);
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyModalRec) return;
    setLoading(true);
    try {
      await apiService.modifyRecommendation(modifyModalRec.id, modifyQty);
      addToast({
        type: 'info',
        title: 'Quantity Adjusted',
        message: `${modifyModalRec.code} updated to ${modifyQty} units.`,
      });
      setModifyModalRec(null);
      await fetchRecs();
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to modify recommendation.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (rec: Recommendation) => {
    await apiService.rejectRecommendation(rec.id);
    addToast({
      type: 'warning',
      title: 'Recommendation Rejected',
      message: `${rec.code} marked as rejected by ${currentUser.name}.`,
    });
    await fetchRecs();
    await refreshCounts();
  };

  const filteredRecs = recs.filter((r) => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              AI Action Recommendations
            </h1>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              Human-in-the-Loop Protocol
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Machine-generated purchase orders and stock redistributions requiring clinical supervisor confirmation.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold self-start sm:self-auto">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'PENDING'
                ? `Pending (${recs.filter((r) => r.status === 'PENDING').length})`
                : tab === 'APPROVED'
                ? `Approved (${recs.filter((r) => r.status === 'APPROVED').length})`
                : tab === 'REJECTED'
                ? `Rejected (${recs.filter((r) => r.status === 'REJECTED').length})`
                : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Cards Grid (Prompt Section 16) */}
      <div className="space-y-4">
        {filteredRecs.map((rec) => {
          const isOrder = rec.type === 'ORDER';
          const isPending = rec.status === 'PENDING';

          return (
            <div
              key={rec.id}
              className={`p-6 bg-white rounded-2xl border shadow-2xs transition-all ${
                isPending
                  ? 'border-slate-200 hover:border-teal-400'
                  : rec.status === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-slate-200 opacity-70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full ${
                      isOrder ? 'bg-teal-700 text-white' : 'bg-indigo-700 text-white'
                    }`}
                  >
                    {isOrder ? 'ORDER MEDICINE' : 'STOCK TRANSFER'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">{rec.code}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    Created: {rec.createdAt}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-36">
                    <ConfidenceBar score={rec.aiConfidence} showLabel={true} />
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      rec.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : rec.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              </div>

              {/* Medicine title & Primary figures */}
              <div className="mt-4">
                <h3 className="text-lg font-black text-slate-900">{rec.medicineName}</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{rec.actionText}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Action Volume</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {rec.quantity} {rec.unit}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Budget Impact</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    Rs. {rec.estimatedCostPkr.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Depletion Runway</div>
                  <div className="text-base font-black text-rose-600 mt-0.5">
                    {rec.expectedStockoutDays} days remaining
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Location</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {rec.fromFacility && rec.toFacility
                      ? `${rec.fromFacility} → ${rec.toFacility}`
                      : 'Main Hospital'}
                  </div>
                </div>
              </div>

              {/* "Why this prediction?" factors breakdown box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Why was this prediction and quantity calculated?</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">{rec.reason}</p>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500">
                  <div>
                    Projected 30D Demand: <strong className="text-slate-800">360 units</strong>
                  </div>
                  <div>
                    Current Stock: <strong className="text-slate-800">120 units</strong>
                  </div>
                  <div>
                    Safety Stock Req: <strong className="text-slate-800">50 units</strong>
                  </div>
                  <div>
                    Vendor Lead Time: <strong className="text-slate-800">7 days</strong>
                  </div>
                </div>
              </div>

              {/* Audit record if approved */}
              {rec.approvedBy && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>
                      Authorized by <strong>{rec.approvedBy}</strong> on {rec.approvedAt}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-emerald-200/60 text-emerald-950 px-2 py-0.5 rounded">
                    Audit Logged
                  </span>
                </div>
              )}

              {/* Interactive buttons */}
              {isPending && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setModifyModalRec(rec);
                      setModifyQty(rec.quantity);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Modify Quantity</span>
                  </button>

                  <button
                    onClick={() => handleReject(rec)}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => setApproveModalRec(rec)}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Recommendation</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredRecs.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No recommendations in this status tab.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(approveModalRec)}
        onClose={() => setApproveModalRec(null)}
        title="Authorize Inventory Decision"
        subtitle="Verification required for electronic procurement routing."
      >
        {approveModalRec && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div>Reference Code: <strong className="font-mono">{approveModalRec.code}</strong></div>
              <div>Medicine: <strong>{approveModalRec.medicineName}</strong></div>
              <div>Authorized Action: <strong>{approveModalRec.actionText}</strong></div>
              <div>Volume: <strong>{approveModalRec.quantity} {approveModalRec.unit}</strong></div>
              <div>Estimated Cost: <strong>Rs. {approveModalRec.estimatedCostPkr.toLocaleString()}</strong></div>
              <div>Approver: <strong>{currentUser.name} ({currentUser.role})</strong></div>
            </div>

            <p className="text-slate-500">
              Confirming will update active inventory buffers, log this decision into the hospital audit trail, and close the risk flag.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApproveModalRec(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs"
              >
                {loading ? 'Authorizing...' : 'Authorize Action'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modify Modal */}
      <Modal
        isOpen={Boolean(modifyModalRec)}
        onClose={() => setModifyModalRec(null)}
        title="Modify Authorized Quantity"
        subtitle="Fine-tune units before dispatching."
      >
        {modifyModalRec && (
          <form onSubmit={handleModifySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Units of {modifyModalRec.medicineName} ({modifyModalRec.unit})
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={modifyQty}
                onChange={(e) => setModifyQty(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900"
              />
            </div>

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900">
              Recalculated Est. Budget: <strong>Rs. {Math.round(modifyQty * (modifyModalRec.estimatedCostPkr / modifyModalRec.quantity)).toLocaleString()}</strong>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModifyModalRec(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs"
              >
                Apply Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
