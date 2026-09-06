import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Download,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService, UploadResult } from '../services/apiService';
import confetti from 'canvas-confetti';

// Sample template content (also used by the "Use Sample Dataset" affordance)
const SAMPLE_CSV =
  'MedicineName,GenericName,Category,Facility,BatchID,CurrentStock,DailyDemand,ExpiryDate,SupplierLeadDays\n' +
  'Insulin Human 100IU,Regular Human Insulin,Diabetes,Main Hospital,INS-881,120,10.9,2026-12-30,7\n' +
  'Amoxicillin 500mg,Amoxicillin,Antibiotics,Facility A,AMX-204,300,2.5,2026-10-15,5\n' +
  'Ceftriaxone 1g,Ceftriaxone Sodium,Antibiotics,Main Hospital,CFT-902,85,14.5,2027-02-18,6\n';

export const DataUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pipelineSteps = [
    'Uploading file to the ingestion API...',
    'Parsing rows and validating schema...',
    'Auditing medicine catalog and facility columns...',
    'Checking batch expiry dates and stock levels...',
    'Refreshing risk alerts and AI recommendations...',
  ];

  const resetState = () => {
    setFile(null);
    setProcessingStage(0);
    setIsProcessing(false);
    setIsCompleted(false);
    setUploadResult(null);
    setUploadError(null);
  };

  const selectFile = (f: File) => {
    setFile(f);
    setProcessingStage(0);
    setIsCompleted(false);
    setUploadResult(null);
    setUploadError(null);
  };

  const handleStartProcessing = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setUploadError(null);
    setProcessingStage(1);

    // Animate pipeline steps while the backend processes the upload
    const interval = setInterval(() => {
      setProcessingStage((prev) => (prev < pipelineSteps.length ? prev + 1 : prev));
    }, 700);

    try {
      const result = await apiService.uploadInventory(file);
      clearInterval(interval);
      setUploadResult(result);
      setProcessingStage(pipelineSteps.length + 1);
      setIsCompleted(true);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      addToast({
        type: 'success',
        title: 'Dataset Ingestion Complete',
        message: `${result.recordsCount} records processed by the backend.`,
      });
    } catch (e) {
      clearInterval(interval);
      console.warn('Upload error', e);
      setProcessingStage(0);
      setIsProcessing(false);
      setUploadError(
        'The backend could not process this file. Verify the API server is running and the file is a valid CSV/XLSX inventory export.'
      );
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Ingestion pipeline returned an error. Please try again.',
      });
    }
  };

  const handleDownloadSample = () => {
    const csvContent = `data:text/csv;charset=utf-8,${SAMPLE_CSV}`;
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = 'medstock_sample_inventory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addToast({
      type: 'info',
      title: 'Template Downloaded',
      message: 'Sample CSV file saved to your downloads.',
    });
  };

  const handleUseSampleDataset = () => {
    const sampleFile = new File([SAMPLE_CSV], 'medstock_sample_inventory.csv', {
      type: 'text/csv',
    });
    selectFile(sampleFile);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Data Upload & Telemetry Ingestion
          </h1>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            Pipeline v2.4
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Upload hospital inventory snapshots, dispensing logs, or batch expiry spreadsheets.
        </p>
      </div>

      {/* Drag-and-Drop Area */}
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              selectFile(e.dataTransfer.files[0]);
            }
          }}
          className={`p-10 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center bg-white ${
            dragActive
              ? 'border-teal-500 bg-teal-50/40'
              : 'border-slate-300 hover:border-teal-400'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 shadow-2xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-extrabold text-slate-900">
            Drag & drop your inventory file here
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Supported formats: <strong>.csv, .xlsx, .xls</strong> (Hospital HMIS, ERP, or Pharmacy registers)
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="cursor-pointer px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
              Browse Local Files
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    selectFile(e.target.files[0]);
                  }
                }}
              />
            </label>

            <button
              onClick={handleUseSampleDataset}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              Use Sample Dataset
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={handleDownloadSample}
              className="text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download sample template CSV</span>
            </button>
          </div>
        </div>
      ) : (
        /* File Summary & Validation Checklist (Prompt Section 17) */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{file.name}</h3>
                  <div className="text-xs text-slate-500">
                    {uploadResult
                      ? `${uploadResult.recordsCount} records • ${uploadResult.medicinesCount} medicines • ${uploadResult.facilitiesCount} facilities`
                      : `${(file.size / 1024).toFixed(1)} KB • awaiting ingestion`}
                  </div>
                </div>
              </div>

              {!isProcessing && !isCompleted && (
                <button
                  onClick={resetState}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Change File
                </button>
              )}
            </div>

            {/* Validation Results (live backend warnings) */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Backend Ingestion Checks
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {uploadResult ? (
                  uploadResult.warnings.map((w, i) => {
                    const isSuccess = /success/i.test(w);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                          isSuccess
                            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                            : 'bg-amber-50/60 border-amber-200 text-amber-900'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span>{w}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                    <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Schema validation and expiry audits run on the backend during ingestion.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <span>{uploadError}</span>
                  <div>
                    <button
                      onClick={handleStartProcessing}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                    >
                      Retry Upload
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ingestion Pipeline State */}
            {processingStage > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Pipeline Execution Progress</span>
                  <span>
                    {Math.min(100, Math.round((processingStage / pipelineSteps.length) * 100))}%
                  </span>
                </div>

                <div className="space-y-2">
                  {pipelineSteps.map((step, idx) => {
                    const isDone = processingStage > idx + 1 || isCompleted;
                    const isCurrent = processingStage === idx + 1 && !isCompleted;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 text-xs p-2 rounded-lg transition-all ${
                          isDone
                            ? 'text-emerald-700 bg-emerald-50/30 font-medium'
                            : isCurrent
                            ? 'text-teal-800 bg-teal-50 font-bold animate-pulse'
                            : 'text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Safe Ingestion: Does not overwrite verified clinical audit records.
              </span>

              {!isCompleted && !isProcessing && (
                <button
                  onClick={handleStartProcessing}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Ingestion Pipeline</span>
                </button>
              )}
            </div>
          </div>

          {/* Analysis Complete Summary Box (Prompt Section 17) */}
          {isCompleted && uploadResult && (
            <div className="bg-gradient-to-br from-teal-900 to-slate-950 text-white p-6 rounded-2xl border border-teal-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Ingestion & Risk Synthesis Complete
                  </h3>
                  <p className="text-xs text-teal-200">
                    All {uploadResult.recordsCount} records parsed and validated by the backend
                    pipeline.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <div className="text-teal-300 font-bold uppercase text-[10px]">
                    Records Processed
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {uploadResult.recordsCount}
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    {uploadResult.medicinesCount} medicines • {uploadResult.facilitiesCount}{' '}
                    facilities
                  </div>
                </div>

                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <div className="text-amber-300 font-bold uppercase text-[10px]">
                    Active Risk Alerts
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {uploadResult.generatedAlerts}
                  </div>
                  <div className="text-slate-300 text-[11px]">Open alerts in system</div>
                </div>

                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <div className="text-emerald-300 font-bold uppercase text-[10px]">
                    AI Action Plans
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {uploadResult.generatedRecommendations}
                  </div>
                  <div className="text-slate-300 text-[11px]">Awaiting authorization</div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <span>View Updated Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
