import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './context/ToastContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { Layout } from './components/layout/Layout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { RulesetsPage } from './pages/RulesetsPage';
import { RulesetDetailPage } from './pages/RulesetDetailPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { VerificationPage } from './pages/VerificationPage';
import { CounterfactualPage } from './pages/CounterfactualPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <DemoModeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="rulesets" element={<RulesetsPage />} />
                <Route path="rulesets/:id" element={<RulesetDetailPage />} />
                <Route path="playground" element={<EvaluationPage />} />
                <Route path="verification" element={<VerificationPage />} />
                <Route path="counterfactual" element={<CounterfactualPage />} />
                <Route path="backtesting" element={<BacktestingPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DemoModeProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
