import { mockApi } from '../mock/mock-api';

const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';

// Initial state from environment variable
const ENV_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const ENV_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1';

// Allow runtime override via localStorage or UI toggle
const DEMO_MODE_STORAGE_KEY = 'ruleforge_demo_mode';
const BASE_URL_STORAGE_KEY = 'ruleforge_api_base_url';

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;

  constructor(message: string, statusCode: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export function getApiBaseUrl(): string {
  try {
    const saved = localStorage.getItem(BASE_URL_STORAGE_KEY);
    if (saved) return saved;
  } catch {
    // ignore
  }
  return ENV_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  try {
    localStorage.setItem(BASE_URL_STORAGE_KEY, url);
  } catch {
    // ignore
  }
}

export function isDemoMode(): boolean {
  try {
    const saved = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch {
    // ignore
  }
  // Default to true in development if no backend is specified, or follow env var
  return ENV_DEMO_MODE !== undefined ? ENV_DEMO_MODE : true;
}

export function setDemoMode(enabled: boolean): void {
  try {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
  // Dispatch custom event for reactive UI updates
  window.dispatchEvent(new CustomEvent('ruleforge:demo-mode-changed', { detail: { enabled } }));
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Standard HTTP fetcher with timeout and error mapping.
 * When real API mode is active, failures are NOT masked by mock data.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, ...fetchOptions } = options;
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode: string | undefined;
      let errorDetails: unknown;

      try {
        const errorJson = await response.json();
        if (errorJson.message) errorMessage = errorJson.message;
        if (errorJson.errorCode) errorCode = errorJson.errorCode;
        if (errorJson.details) errorDetails = errorJson.details;
      } catch {
        // Not JSON
      }

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      // If response is wrapped in { data: ... }
      if (json && typeof json === 'object' && 'data' in json) {
        return json.data as T;
      }
      return json as T;
    }

    const text = await response.text();
    return text as unknown as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        `Request to ${cleanEndpoint} timed out after ${timeoutMs}ms`,
        408,
        'TIMEOUT'
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown network failure';
    throw new ApiError(
      `Network Error: Unable to reach backend at ${fullUrl}. Ensure RuleForge backend server is running. (${message})`,
      0,
      'NETWORK_FAILURE'
    );
  }
}

export { mockApi };
