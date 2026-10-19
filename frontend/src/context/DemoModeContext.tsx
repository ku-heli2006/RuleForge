import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isDemoMode, setDemoMode, getApiBaseUrl } from '../lib/api-client';

interface DemoModeContextValue {
  isDemo: boolean;
  toggleDemoMode: (enabled?: boolean) => void;
  isBackendLive: boolean | null; // null = checking, true = up, false = unreachable
  apiBaseUrl: string;
  checkBackendStatus: () => Promise<boolean>;
}

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemo, setIsDemo] = useState<boolean>(isDemoMode());
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(getApiBaseUrl());

  const checkBackendStatus = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = `${getApiBaseUrl().replace(/\/+$/, '')}/health`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      const live = response.ok;
      setIsBackendLive(live);
      return live;
    } catch {
      setIsBackendLive(false);
      return false;
    }
  }, []);

  const toggleDemoMode = useCallback((enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !isDemo;
    setDemoMode(nextVal);
    setIsDemo(nextVal);
  }, [isDemo]);

  useEffect(() => {
    // Initial backend reachability probe
    checkBackendStatus();

    const handleStorage = () => {
      setIsDemo(isDemoMode());
      setApiBaseUrlState(getApiBaseUrl());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('ruleforge:demo-mode-changed', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ruleforge:demo-mode-changed', handleStorage);
    };
  }, [checkBackendStatus]);

  return (
    <DemoModeContext.Provider
      value={{
        isDemo,
        toggleDemoMode,
        isBackendLive,
        apiBaseUrl,
        checkBackendStatus,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export function useDemoMode(): DemoModeContextValue {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
