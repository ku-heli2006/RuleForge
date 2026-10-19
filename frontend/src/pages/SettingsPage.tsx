import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useDemoMode } from '../context/DemoModeContext';
import { setApiBaseUrl } from '../lib/api-client';
import { useToast } from '../context/ToastContext';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Cpu,
  Sliders,
  Settings,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { isDemo, toggleDemoMode, isBackendLive, apiBaseUrl, checkBackendStatus } = useDemoMode();
  const { success, error } = useToast();

  const [customBaseUrl, setCustomBaseUrl] = useState(apiBaseUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [solverTimeout, setSolverTimeout] = useState('10000');
  const [smtLogic, setSmtLogic] = useState('QF_LIA');

  const handleSaveUrl = () => {
    setApiBaseUrl(customBaseUrl.trim());
    success('Backend URL Updated', `API requests now route to: ${customBaseUrl.trim()}`);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const isLive = await checkBackendStatus();
    setIsTesting(false);

    if (isLive) {
      success('Connection Successful', `Backend at ${customBaseUrl} is online and responding with HTTP 200.`);
    } else {
      error('Connection Failed', `Unable to reach backend at ${customBaseUrl}/health. Ensure backend server is started.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Settings & Backend Integration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage backend endpoints, switch between demonstration mock data and live Z3 solver backend, and customize SMT theorem-proving parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <div>
                <CardTitle>API Connection</CardTitle>
                <CardDescription>Backend service destination</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Base URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="http://localhost:8080/api/v1"
                />
                <Button size="sm" variant="outline" onClick={handleSaveUrl}>
                  Save
                </Button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default: <code>http://localhost:8080/api/v1</code>
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Live Health Check:</span>
                <div className="flex items-center gap-1.5 font-medium">
                  {isBackendLive === true ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Online & Reachable</span>
                    </>
                  ) : isBackendLive === false ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-rose-700">Offline / No response</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Checking...</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<RefreshCw className={isTesting ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />}
                  isLoading={isTesting}
                  onClick={handleTestConnection}
                >
                  Test Connection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <div>
                <CardTitle>Demonstration Mode</CardTitle>
                <CardDescription>Standalone mock dataset control</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              When Demo Mode is enabled, the UI serves simulated synthetic datasets for rulesets, evaluation, formal verification witnesses, counterfactuals, and backtest results.
            </p>

            <div className="p-3 bg-amber-50/80 rounded border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900">Current Demo Mode:</span>
                <Badge variant={isDemo ? 'amber' : 'neutral'}>
                  {isDemo ? 'ENABLED (MOCK DATA)' : 'DISABLED (REAL API)'}
                </Badge>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                {isDemo
                  ? 'All solver proofs and metrics are clearly tagged as mock demonstration data.'
                  : 'All queries are dispatched directly to the configured backend API.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-medium text-slate-700">Switch Execution Mode:</span>
              <Button
                size="sm"
                variant={isDemo ? 'secondary' : 'primary'}
                onClick={() => toggleDemoMode()}
              >
                {isDemo ? 'Switch to Live API Mode' : 'Enable Demo Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SMT Solver Options */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <div>
                <CardTitle>SMT Solver Logic Parameters</CardTitle>
                <CardDescription>Z3 solver theorem-proving configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">SMT-LIB2 Logic Profile</label>
              <select
                value={smtLogic}
                onChange={(e) => setSmtLogic(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="QF_LIA">QF_LIA (Quantifier-Free Linear Integer Arithmetic)</option>
                <option value="QF_NRA">QF_NRA (Quantifier-Free Non-Linear Real Arithmetic)</option>
                <option value="ALL">ALL (Full SMT Theory Support)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Solver Execution Timeout (ms)
              </label>
              <input
                type="number"
                value={solverTimeout}
                onChange={(e) => setSolverTimeout(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Build Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-600" />
              <div>
                <CardTitle>System Information</CardTitle>
                <CardDescription>RuleForge client build metadata</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Client Engine:</span>
              <span className="text-slate-900 font-semibold">RuleForge WebUI v1.0.0</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Framework:</span>
              <span className="text-slate-900 font-semibold">React 19 + TypeScript + Vite</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">SMT Architecture:</span>
              <span className="text-slate-900 font-semibold">Z3 v4.12.2 Integration</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Domain Model:</span>
              <span className="text-slate-900 font-semibold">E-Commerce Tier & Eligibility</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
