/**
 * API Client Configuration
 * Base HTTP client for all API requests
 */

/**
 * Convert camelCase to snake_case
 */
function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const snakeObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = typeof value === 'object' ? camelToSnake(value) : value;
  }
  return snakeObj;
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  const camelObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = typeof value === 'object' ? snakeToCamel(value) : value;
  }
  return camelObj;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');

function buildUrl(base: string, endpoint: string) {
  const e = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${e}`;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base API client with error handling and request configuration
 */
class ApiClient {
  private baseURL: string;
  // Track in-flight GET requests to dedupe identical requests
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private csrfToken: string | null = null;
  // Prevent race conditions in CSRF token fetching
  private csrfFetchPromise: Promise<void> | null = null;

  constructor(baseURL: string) {
    this.baseURL = (baseURL || '').replace(/\/+$/, '');
  }

  /**
   * Check if an error is a CSRF token error that can be retried
   */
  private isCsrfError(status: number, message: string): boolean {
    return status === 403 &&
      (message.toLowerCase().includes('csrf') ||
        message.includes('CSRF token required') ||
        message.includes('Invalid CSRF token'));
  }

  private async handleResponse<T>(response: Response, requestInit?: RequestInit): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // FastAPI uses 'detail', others might use 'message'
      let errorMessage = errorData.detail || errorData.message || response.statusText;

      // Handle Pydantic validation errors (array of objects)
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage
          .map((err: any) => err.msg || JSON.stringify(err))
          .join(', ');
      } else if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage);
      }

      // If 403 with CSRF error, clear cached token (retry will be handled by caller)
      if (this.isCsrfError(response.status, errorMessage) && typeof window !== 'undefined') {
        console.warn('[apiClient] CSRF token invalid, clearing for refresh');
        this.csrfToken = null;
        this.csrfFetchPromise = null;
      }

      // If unauthorized, clear client session to avoid repeated failing calls
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          const currentPath = window.location.pathname;
          // Only log and redirect if not already on an auth page
          if (!currentPath.startsWith('/auth')) {
            console.warn('[apiClient] 401 Unauthorized received. Clearing local session and redirecting to login.');
            localStorage.removeItem('userData');
            localStorage.removeItem('userToken');
            localStorage.removeItem('orgData');
            localStorage.removeItem('orgToken');
            this.csrfToken = null;
            // Give caller a chance to handle before redirecting in SPA environments
            setTimeout(() => {
              try {
                if (!window.location.pathname.startsWith('/auth')) {
                  window.location.href = '/auth/login';
                }
              } catch (e) {
                // ignore
              }
            }, 200);
          } else {
            // Just clear tokens if already on auth page
            localStorage.removeItem('userData');
            localStorage.removeItem('userToken');
            localStorage.removeItem('orgData');
            localStorage.removeItem('orgToken');
            this.csrfToken = null;
          }
        } catch (e) {
          // ignore
        }
      }

      throw new ApiError(
        response.status,
        errorMessage,
        errorData
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async getHeaders(customHeaders?: HeadersInit, includeCsrf = true): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Always include auth headers when available
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('userToken');

      // Always include Bearer token if available (works cross-domain)
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;

        // Optional: send user ID for additional validation
        const userId = localStorage.getItem('userId');
        if (userId) {
          headers['x-user-id'] = userId;
        }
      }

      // ALWAYS include CSRF token when available for state-changing methods
      // This is needed because backend checks cookies first, and if cookie exists,
      // CSRF is required even if Bearer token is also present
      if (includeCsrf) {
        try {
          await this.ensureCsrfToken();
          if (this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
          }
        } catch (e) {
          console.warn('[apiClient] Failed to fetch CSRF token:', e);
          // ignore CSRF fetch failures here; calls will fail server-side if required
        }
      }
    }

    return {
      ...headers,
      ...customHeaders,
    };
  }

  private async ensureCsrfToken(forceRefresh = false): Promise<void> {
    if (this.csrfToken && !forceRefresh) return;

    // Don't fetch CSRF token if user is not authenticated (no token = no user session)
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('userToken');
      if (!userToken) {
        console.debug('[apiClient] Skipping CSRF token fetch - user not authenticated');
        return;
      }
    }

    // If already fetching, wait for that promise (prevent race conditions)
    if (this.csrfFetchPromise) {
      await this.csrfFetchPromise;
      return;
    }

    // Fetch CSRF token endpoint; it relies on cookie auth (credentials: include)
    this.csrfFetchPromise = (async () => {
      try {
        const url = buildUrl(this.baseURL, '/auth/csrf-token');
        const resp = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken') || ''}`,
          },
        });
        if (!resp.ok) {
          console.warn('[apiClient] Failed to fetch CSRF token:', resp.status, resp.statusText);
          return;
        }
        const data = await resp.json().catch(() => null);
        if (data && data.csrfToken) {
          this.csrfToken = data.csrfToken;
          console.debug('[apiClient] CSRF token obtained');
        }
      } catch (e) {
        console.error('[apiClient] Error fetching CSRF token:', e);
      } finally {
        this.csrfFetchPromise = null;
      }
    })();

    await this.csrfFetchPromise;
  }

  // Public helper: allow callers to prime CSRF token after cookie login
  public async initCsrf(): Promise<void> {
    await this.ensureCsrfToken(true);
  }

  // Public helper: clear CSRF token to force refresh on next request
  public clearCsrf(): void {
    this.csrfToken = null;
  }

  async get<T>(endpoint: string, params?: Record<string, any>, transformCase = false): Promise<T> {
    const url = new URL(buildUrl(this.baseURL, endpoint));

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Debug log for outgoing request
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] GET', url.toString());
    }

    const key = url.toString();

    // If an identical GET is already in flight, return that promise (dedupe)
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const response = await fetch(key, {
          method: 'GET',
          headers: await this.getHeaders(),
          credentials: 'include', // Send cookies
          cache: 'no-store', // Prevent caching of API responses
        });

        const result = await this.handleResponse<T>(response);
        if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
          console.debug('[apiClient] GET response', key, result);
        }

        return transformCase ? snakeToCamel(result) : result;
      } finally {
        // Clean up in-flight cache regardless of success/error
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
    return promise as Promise<T>;
  }

  async post<T>(endpoint: string, data?: any, transformCase = false): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const url = buildUrl(this.baseURL, endpoint);

    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] POST', url, bodyData);
    }

    const makeRequest = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(bodyData),
        credentials: 'include',
      });
      return response;
    };

    let response = await makeRequest();

    // If CSRF error, refresh token and retry once
    if (response.status === 403) {
      const errorData = await response.clone().json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || '';
      if (this.isCsrfError(403, errorMessage)) {
        console.warn('[apiClient] CSRF error on POST, refreshing token and retrying...');
        this.csrfToken = null;
        this.csrfFetchPromise = null;
        await this.ensureCsrfToken(true);
        response = await makeRequest();
      }
    }

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] POST response', url, result);
    }

    return transformCase ? snakeToCamel(result) : result;
  }

  async put<T>(endpoint: string, data?: any, transformCase = false, params?: Record<string, any>): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const url = new URL(buildUrl(this.baseURL, endpoint));

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PUT', url.toString(), bodyData);
    }

    const makeRequest = async () => {
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: await this.getHeaders(),
        body: JSON.stringify(bodyData),
        credentials: 'include',
      });
      return response;
    };

    let response = await makeRequest();

    // If CSRF error, refresh token and retry once
    if (response.status === 403) {
      const errorData = await response.clone().json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || '';
      if (this.isCsrfError(403, errorMessage)) {
        console.warn('[apiClient] CSRF error on PUT, refreshing token and retrying...');
        this.csrfToken = null;
        this.csrfFetchPromise = null;
        await this.ensureCsrfToken(true);
        response = await makeRequest();
      }
    }

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PUT response', url.toString(), result);
    }

    return transformCase ? snakeToCamel(result) : result;
  }

  async patch<T>(endpoint: string, data?: any, transformCase = false): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const url = buildUrl(this.baseURL, endpoint);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PATCH', url, bodyData);
    }

    const makeRequest = async () => {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: await this.getHeaders(),
        body: JSON.stringify(bodyData),
        credentials: 'include',
      });
      return response;
    };

    let response = await makeRequest();

    // If CSRF error, refresh token and retry once
    if (response.status === 403) {
      const errorData = await response.clone().json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || '';
      if (this.isCsrfError(403, errorMessage)) {
        console.warn('[apiClient] CSRF error on PATCH, refreshing token and retrying...');
        this.csrfToken = null;
        this.csrfFetchPromise = null;
        await this.ensureCsrfToken(true);
        response = await makeRequest();
      }
    }

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PATCH response', url, result);
    }

    return transformCase ? snakeToCamel(result) : result;
  }

  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(buildUrl(this.baseURL, endpoint));

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] DELETE', url.toString());
    }

    const makeRequest = async () => {
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: await this.getHeaders(),
        credentials: 'include',
      });
      return response;
    };

    let response = await makeRequest();

    // If CSRF error, refresh token and retry once
    if (response.status === 403) {
      const errorData = await response.clone().json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || '';
      if (this.isCsrfError(403, errorMessage)) {
        console.warn('[apiClient] CSRF error on DELETE, refreshing token and retrying...');
        this.csrfToken = null;
        this.csrfFetchPromise = null;
        await this.ensureCsrfToken(true);
        response = await makeRequest();
      }
    }

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] DELETE response', url.toString(), result);
    }

    return result;
  }

  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const makeRequest = async () => {
      const headers = await this.getHeaders({}, true);
      // Remove Content-Type when sending FormData so browser sets correct boundary
      if (headers && (headers as any)['Content-Type']) delete (headers as any)['Content-Type'];

      const response = await fetch(buildUrl(this.baseURL, endpoint), {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });
      return response;
    };

    let response = await makeRequest();

    // If CSRF error, refresh token and retry once
    if (response.status === 403) {
      const errorData = await response.clone().json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || '';
      if (this.isCsrfError(403, errorMessage)) {
        console.warn('[apiClient] CSRF error on uploadFile, refreshing token and retrying...');
        this.csrfToken = null;
        this.csrfFetchPromise = null;
        await this.ensureCsrfToken(true);
        response = await makeRequest();
      }
    }

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Runtime debug: log resolved API base URL in browser devtools
if (typeof window !== 'undefined') {
  try {
    // Expose for quick inspection and optional DEBUG toggle
    (window as any).API_BASE_URL = API_BASE_URL;
    console.debug('[apiClient] Resolved API_BASE_URL ->', API_BASE_URL);
  } catch (e) {
    // ignore
  }
}
