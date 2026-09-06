import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { MedicineDetailPage } from './pages/MedicineDetailPage';
import { ForecastPage } from './pages/ForecastPage';
import { AlertsPage } from './pages/AlertsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { BatchesPage } from './pages/BatchesPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { DataUploadPage } from './pages/DataUploadPage';
import { AssistantPage } from './pages/AssistantPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Dashboard Shell */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/:id" element={<MedicineDetailPage />} />
            <Route path="forecasts" element={<ForecastPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="facilities" element={<FacilitiesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="upload" element={<DataUploadPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
