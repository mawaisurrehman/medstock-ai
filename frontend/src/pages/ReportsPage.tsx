import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Calendar,
  Building2,
  CheckCircle2,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { MedStockLogo } from '../assets/logo';
import { apiService } from '../services/apiService';
import type { Medicine, ReportTemplate } from '../types';

export const ReportsPage: React.FC = () => {
  const { addToast, currentUser } = useApp();
  const [previewReport, setPreviewReport] = useState<string | null>(null);
  const [reportTypes, setReportTypes] = useState<ReportTemplate[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    apiService
      .getReports()
      .then(setReportTypes)
      .catch((e) => console.warn('Reports load error', e));
    apiService
      .getMedicines()
      .then(setMedicines)
      .catch((e) => console.warn('Medicines load error', e));
  }, []);

  // Live preview rows: most critical medicines (fewest days of stock remaining) first
  const previewRows = useMemo(() => {
    if (!previewReport) return [];
    return [...medicines]
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5)
      .map((m) => {
        const reorderQty = Math.max(m.reorderPoint - m.currentStock, 0);
        return {
          medicine: m,
          reorderQty,
          cost: reorderQty * m.unitPricePkr,
        };
      });
  }, [previewReport, medicines]);

  const previewTotalCost = previewRows.reduce((sum, r) => sum + r.cost, 0);

  const handleDownloadCSV = async (title: string) => {
    try {
      const meds = medicines.length ? medicines : await apiService.getMedicines();
      if (!meds.length) {
        addToast({
          type: 'error',
          title: 'Export Failed',
          message: 'No inventory records available from the backend.',
        });
        return;
      }

      const csvContent =
        'data:text/csv;charset=utf-8,ID,Medicine,Facility,Stock,DailyDemand,DaysRemaining,StockoutRisk\n' +
        meds
          .map(
            (m) =>
              `${m.id},"${m.name}","${m.facilityName}",${m.currentStock},${m.dailyConsumption},${m.daysRemaining},${m.stockoutRisk}`
          )
          .join('\n');

      const encoded = encodeURI(csvContent);
      const link = document.createElement('a');
      link.href = encoded;
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        title: 'CSV File Downloaded',
        message: `${title} exported successfully (${meds.length} records).`,
      });
    } catch (e) {
      console.warn('CSV export error', e);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not export inventory data from the backend.',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Healthcare Reports & Audit Logs
          </h1>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            Clinical Compliance
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Generate, inspect, and export regulatory inventory registers and procurement documents.
        </p>
      </div>

      {/* Reports Grid (Prompt Section 20) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {report.format}
                </span>
              </div>

              <h3 className="text-sm font-black text-slate-900 mt-3">{report.title}</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{report.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Frequency:</span>
                  <span className="font-semibold text-slate-800">{report.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Generated:</span>
                  <span className="font-semibold text-slate-800">{report.lastGenerated}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setPreviewReport(report.id)}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Document</span>
              </button>

              <button
                onClick={() => handleDownloadCSV(report.title)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Download CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Preview Modal (Prompt Section 20) */}
      <Modal
        isOpen={Boolean(previewReport)}
        onClose={() => setPreviewReport(null)}
        title="Document Preview & Verification"
        subtitle="Official hospital audit header formatted for procurement & clinical compliance."
        maxWidth="4xl"
      >
        <div className="space-y-6 text-xs text-slate-700">
          {/* Official Document Sheet */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-5 print:border-none print:shadow-none">
            {/* Header with Logo */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <MedStockLogo size="md" variant="full" />
                <div className="text-[11px] text-slate-500 font-semibold mt-1">
                  Predict. Prevent. Protect. — Healthcare Inventory Intelligence
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-500">
                <div className="font-black text-slate-900 text-xs uppercase">
                  Audit Requisition ID: MS-{new Date().getFullYear()}-
                  {String(Date.now() % 100000).padStart(5, '0')}
                </div>
                <div>Generated: {new Date().toLocaleString()}</div>
                <div>Facility: Main Hospital (Lahore)</div>
                <div>Authorizer: {currentUser.name} ({currentUser.role})</div>
              </div>
            </div>

            {/* Document Title */}
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                {previewReport?.includes('procurement')
                  ? 'Authorized Clinical Procurement & Reorder Requisition'
                  : previewReport?.includes('expiry')
                  ? 'Batch Expiry & Inter-Facility Transfer Schedule'
                  : 'Consolidated Hospital Medicine Inventory Register'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pursuant to hospital supply chain protocol and verified machine learning demand forecasts.
              </p>
            </div>

            {/* Live Data Table (from backend inventory) */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Medicine</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Current Stock</th>
                    <th className="p-2.5">Required Reorder</th>
                    <th className="p-2.5">Vendor Lead Time</th>
                    <th className="p-2.5 text-right">Est. Cost (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {previewRows.length > 0 ? (
                    previewRows.map(({ medicine: m, reorderQty, cost }) => (
                      <tr key={m.id}>
                        <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                        <td className="p-2.5">{m.category}</td>
                        <td
                          className={`p-2.5 font-bold ${
                            m.daysRemaining < 14
                              ? 'text-rose-600'
                              : m.daysRemaining < 30
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {m.currentStock} {m.unit}
                        </td>
                        <td
                          className={`p-2.5 font-bold ${
                            reorderQty > 0 ? 'text-teal-800' : 'text-slate-400'
                          }`}
                        >
                          {reorderQty > 0 ? `${reorderQty} ${m.unit}` : 'Adequate stock'}
                        </td>
                        <td className="p-2.5">{m.supplierLeadTimeDays} days</td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          Rs. {cost.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No inventory records available from the backend.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan={5} className="p-2.5 text-right uppercase text-[10px]">
                      Total Approved Requisition Budget:
                    </td>
                    <td className="p-2.5 text-right font-mono text-teal-800">
                      Rs. {previewTotalCost.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature blocks */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-[11px] text-slate-600">
              <div className="border-t border-slate-300 pt-1">
                <div className="font-bold text-slate-900">Verified by Store Manager</div>
                <div>Signature: __________________________</div>
                <div className="text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</div>
              </div>
              <div className="border-t border-slate-300 pt-1">
                <div className="font-bold text-slate-900">Approved by Chief Pharmacist</div>
                <div>Signature: __________________________</div>
                <div className="text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-400">
              Official MedStock AI regulatory compliant export
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>

              <button
                onClick={() => handleDownloadCSV('Procurement_Report')}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV / PDF</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
