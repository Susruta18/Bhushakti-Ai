import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedLayout } from './layouts/ProtectedLayout';
import { LoadingState } from './components/common/LoadingState';

// Lazy-loaded pages for optimal mobile bundle size
const LoginPage = lazy(() => import('./pages/Login'));
const HomePage = lazy(() => import('./pages/Home'));
const RiskMapPage = lazy(() => import('./pages/RiskMap'));
const RiskDetails = lazy(() => import('./pages/RiskMap/RiskDetails'));
const AIPredictionPage = lazy(() => import('./pages/AIPrediction'));
const AlertsPage = lazy(() => import('./pages/Alerts'));
const AlertDetails = lazy(() => import('./pages/Alerts/AlertDetails'));
const ReportsPage = lazy(() => import('./pages/Reports'));
const ReportDetails = lazy(() => import('./pages/Reports/ReportDetails'));
const ReportHazard = lazy(() => import('./pages/Reports/ReportHazard'));
const ResponsePriorityPage = lazy(() => import('./pages/Response'));
const ResponsePlan = lazy(() => import('./pages/Response/ResponsePlan'));
const InfrastructurePage = lazy(() => import('./pages/Infrastructure'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));

const PageFallback = () => (
  <LoadingState fullScreen={false} message="Loading..." />
);

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedLayout>
              <HomePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/risk-map"
          element={
            <ProtectedLayout>
              <RiskMapPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/risk-map/:id"
          element={
            <ProtectedLayout>
              <RiskDetails />
            </ProtectedLayout>
          }
        />
        <Route
          path="/ai-prediction"
          element={
            <ProtectedLayout>
              <AIPredictionPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedLayout>
              <AlertsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/alerts/:id"
          element={
            <ProtectedLayout>
              <AlertDetails />
            </ProtectedLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <ReportsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/reports/new"
          element={
            <ProtectedLayout>
              <ReportHazard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedLayout>
              <ReportDetails />
            </ProtectedLayout>
          }
        />
        <Route
          path="/response-priority"
          element={
            <ProtectedLayout>
              <ResponsePriorityPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/response-plan/:id"
          element={
            <ProtectedLayout>
              <ResponsePlan />
            </ProtectedLayout>
          }
        />
        <Route
          path="/infrastructure"
          element={
            <ProtectedLayout>
              <InfrastructurePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedLayout>
              <AnalyticsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedLayout>
              <ProfilePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedLayout>
              <NotificationsPage />
            </ProtectedLayout>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
