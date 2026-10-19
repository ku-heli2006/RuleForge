import React, { useState } from 'react';
import { useDemoMode } from '../../context/DemoModeContext';
import { Server, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ConnectionIndicator: React.FC = () => {
  const { isDemo, isBackendLive, apiBaseUrl, checkBackendStatus, toggleDemoMode } = useDemoMode();
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecking(true);
    await checkBackendStatus();
    setIsChecking(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
          isDemo
            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            : isBackendLive === true
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            : isBackendLive === false
            ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
        )}
        title="Click to view API connection status"
      >
        <span className="relative flex h-2 w-2">
          {isDemo ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          ) : isBackendLive === true ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </>
          ) : isBackendLive === false ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400" />
          )}
        </span>

        <span className="font-mono text-[11px] tracking-tight">
          {isDemo
            ? 'DEMO MODE'
            : isBackendLive === true
            ? 'BACKEND LIVE'
            : isBackendLive === false
            ? 'BACKEND OFFLINE'
            : 'CHECKING...'}
        </span>
      </button>

      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white border border-slate-200 shadow-xl p-4 z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                Backend Integration
              </span>
              <button
                onClick={handleRefresh}
                disabled={isChecking}
                className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                title="Re-check health"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isChecking && 'animate-spin')} />
              </button>
            </div>

            <div className="space-y-2 mb-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Target Endpoint</span>
                <span className="font-mono text-slate-800 break-all text-[11px] bg-slate-50 p-1 rounded block border border-slate-100 mt-0.5">
                  {apiBaseUrl}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Status</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-medium">
                  {isBackendLive === true ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Reachable (HTTP 200)</span>
                    </>
                  ) : isBackendLive === false ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-rose-700">Unreachable (Connection refused / no server)</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Probing status...</span>
                  )}
                </div>
              </div>

              {isDemo && (
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-1 font-semibold text-amber-900 mb-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Demo Mode Active
                  </div>
                  Using synthetic data. Formal Z3 solver proofs and live backtests are simulated locally.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Toggle Demo Mode</span>
              <button
                onClick={() => toggleDemoMode()}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-semibold rounded transition-colors',
                  isDemo
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                )}
              >
                {isDemo ? 'Switch to Live API' : 'Switch to Demo Mode'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
