import { describe, it, expect, beforeEach } from 'vitest';
import { getApiBaseUrl, setApiBaseUrl, isDemoMode, setDemoMode, ApiError } from '../lib/api-client';

describe('API Client & Demo Mode State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default API base URL', () => {
    expect(getApiBaseUrl()).toContain('http');
  });

  it('allows overriding base URL in localStorage', () => {
    setApiBaseUrl('http://api.production.ruleforge.internal/v1');
    expect(getApiBaseUrl()).toBe('http://api.production.ruleforge.internal/v1');
  });

  it('manages demo mode state persistently', () => {
    setDemoMode(true);
    expect(isDemoMode()).toBe(true);
    setDemoMode(false);
    expect(isDemoMode()).toBe(false);
  });

  it('creates ApiError with status and message', () => {
    const error = new ApiError('Conflict in Z3 constraints', 409, 'Z3_UNSAT_CORE');
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe('Z3_UNSAT_CORE');
    expect(error.message).toBe('Conflict in Z3 constraints');
  });
});
