import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Batch } from '../types';
import { RiskBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

export const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, refreshCounts } = useApp();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedRange, setSelectedRange] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transfer Modal
  const [transferBatch, setTransferBatch] = useState<Batch | null>(null);
  const [targetFacility, setTargetFacility] = useState('Facility B');
  const [transferQty, setTransferQty] = useState(100);
  const [loading, setLoading] = useState(false);

  const fetchBatches = async () => {
    const list = await apiService.getBatches();
    setBatches(list);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBatch) return;
    setLoading(true);

    try {
      // Find matching recommendation #REC-1025
      const recs = await apiService.getRecommendations();
      const rec = recs.find((r) => r.type === 'TRANSFER' && r.medicineId === transferBatch.medicineId);
      if (rec) {
        await apiService.approveRecommendation(rec.id, 'Store Manager');
      }

      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      addToast({
        type: 'success',
        title: 'Stock Transfer Authorized',
        message: `Dispatched ${transferQty} units of ${transferBatch.medicineName} (Batch ${transferBatch.batchId}) from ${transferBatch.facilityName} to ${targetFacility}.`,
      });

      setTransferBatch(null);
      await fetchBatches();
      await refreshCounts();
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to complete transfer.' });
    } finally {
      setLoading(false);
    }
  };

  // Filter batches
  const filteredBatches = batches.filter((b) => {
    const matchesFacility = facilityFilter === 'ALL' || b.facilityName === facilityFilter;
    const matchesSearch =
      b.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.medicineName.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedRange === '0-30') return b.daysToExpiry <= 30 && matchesFacility && matchesSearch;
    if (selectedRange === '31-60')
      return b.daysToExpiry > 30 && b.daysToExpiry <= 60 && matchesFacility && matchesSearch;
    if (selectedRange === '61-90')
      return b.daysToExpiry > 60 && b.daysToExpiry <= 90 && matchesFacility && matchesSearch;
    if (selectedRange === '90+') return b.daysToExpiry > 90 && matchesFacility && matchesSearch;

    return matchesFacility && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Batches & Expiry Management
            </h1>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              FEFO Protocol
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            First-Expiry-First-Out (FEFO) audit, remaining shelf-life, and inter-facility transfers.
          </p>
        </div>

        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs self-start sm:self-auto"
        >
          <span>Export Expiry Audit Report</span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
        </button>
      </div>

      {/* Visual Expiry Category Cards (Prompt Section 13) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setSelectedRange('0-30')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedRange === '0-30'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[10px] font-bold text-rose-700 uppercase">0 – 30 Days</div>
          <div className="text-2xl font-black text-rose-600 mt-0.5">3 batches</div>
          <div className="text-[10px] text-rose-600 font-medium">Critical attention</div>
        </div>

        <div
          onClick={() => setSelectedRange('31-60')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedRange === '31-60'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-700 uppercase">31 – 60 Days</div>
          <div className="text-2xl font-black text-amber-600 mt-0.5">5 batches</div>
          <div className="text-[10px] text-amber-700 font-medium">Transfer window</div>
        </div>

        <div
          onClick={() => setSelectedRange('61-90')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedRange === '61-90'
              ? 'bg-yellow-50 border-yellow-500 ring-2 ring-yellow-500/20'
              : 'bg-white border-yellow-200 hover:border-yellow-300'
          }`}
        >
          <div className="text-[10px] font-bold text-yellow-800 uppercase">61 – 90 Days</div>
          <div className="text-2xl font-black text-yellow-700 mt-0.5">9 batches</div>
          <div className="text-[10px] text-yellow-700 font-medium">Monitor burn rate</div>
        </div>

        <div
          onClick={() => setSelectedRange('90+')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedRange === '90+'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-800 uppercase">90+ Days</div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">82 batches</div>
          <div className="text-[10px] text-emerald-700 font-medium">Adequate shelf-life</div>
        </div>

        <div
          onClick={() => setSelectedRange('ALL')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedRange === 'ALL'
              ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase">Total Tracked</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">99 batches</div>
          <div className="text-[10px] text-slate-500 font-medium">View All</div>
        </div>
      </div>

      {/* Expiry Timeline Health Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span>Overall Inventory Expiry Distribution</span>
          <span className="text-slate-400 font-normal">Total Value: Rs. 14.8M</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
          <div style={{ width: '3%' }} className="bg-rose-500" title="0-30 days: 3%" />
          <div style={{ width: '5%' }} className="bg-amber-500" title="31-60 days: 5%" />
          <div style={{ width: '9%' }} className="bg-yellow-400" title="61-90 days: 9%" />
          <div style={{ width: '83%' }} className="bg-emerald-500" title="90+ days: 83%" />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>0-30 Days (3%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>31-60 Days (5%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>61-90 Days (9%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Safe: 90+ Days (83%)</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by batch ID or medicine..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 text-slate-900"
          />
        </div>

        <select
          value={facilityFilter}
          onChange={(e) => setFacilityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700"
        >
          <option value="ALL">All Facilities</option>
          <option value="Main Hospital">Main Hospital</option>
          <option value="Facility A">Facility A</option>
          <option value="Facility B">Facility B</option>
          <option value="Clinic C">Clinic C</option>
        </select>
      </div>

      {/* Batches Table (Prompt Section 13) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Batch ID</th>
                <th className="py-3.5 px-3">Medicine</th>
                <th className="py-3.5 px-3">Facility</th>
                <th className="py-3.5 px-3">Quantity</th>
                <th className="py-3.5 px-3">Mfg Date</th>
                <th className="py-3.5 px-3">Expiry Date</th>
                <th className="py-3.5 px-3">Days to Expiry</th>
                <th className="py-3.5 px-3">Daily Burn</th>
                <th className="py-3.5 px-3">Expiry Risk</th>
                <th className="py-3.5 px-4 text-right">Recommended Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBatches.map((b) => {
                const isUrgent = b.daysToExpiry <= 45;

                return (
                  <tr
                    key={b.batchId}
                    className={`hover:bg-slate-50 transition-colors ${
                      isUrgent ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.batchId}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{b.medicineName}</div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">{b.facilityName}</td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900">{b.quantity}</span> {b.unit}
                    </td>

                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                      {b.manufactureDate}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[11px] font-bold text-slate-800">
                      {b.expiryDate}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`font-bold ${
                          b.daysToExpiry <= 30
                            ? 'text-rose-600'
                            : b.daysToExpiry <= 60
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {b.daysToExpiry} days
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-500">
                      {b.dailyConsumptionRate}/day
                    </td>

                    <td className="py-3.5 px-3">
                      <RiskBadge level={b.expiryRisk} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {b.recommendedAction.includes('Transfer') ? (
                        <button
                          onClick={() => {
                            setTransferBatch(b);
                            setTransferQty(100);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs inline-flex items-center gap-1"
                        >
                          <span>Authorize Transfer</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {b.recommendedAction}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Confirmation Modal (Demo Flow Step 5) */}
      <Modal
        isOpen={Boolean(transferBatch)}
        onClose={() => setTransferBatch(null)}
        title="Inter-Facility Stock Transfer"
        subtitle="Redistribute inventory to prevent expiration waste."
      >
        {transferBatch && (
          <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div>Batch ID: <strong className="font-mono">{transferBatch.batchId}</strong></div>
              <div>Medicine: <strong>{transferBatch.medicineName}</strong></div>
              <div>Source Facility: <strong>{transferBatch.facilityName}</strong></div>
              <div>Days to Expiry: <strong className="text-amber-700">{transferBatch.daysToExpiry} days</strong></div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Destination Healthcare Facility
              </label>
              <select
                value={targetFacility}
                onChange={(e) => setTargetFacility(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
              >
                <option value="Facility B">Facility B (High Demand Hospital)</option>
                <option value="Main Hospital">Main Hospital</option>
                <option value="Clinic C">Clinic C</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Units to Transfer
              </label>
              <input
                type="number"
                min="10"
                max={transferBatch.quantity}
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900"
              />
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              ✓ Destination Facility B has daily consumption of 8.5 units/day and will utilize this stock before expiry.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferBatch(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs"
              >
                {loading ? 'Dispatching...' : 'Confirm & Dispatch Transfer'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
