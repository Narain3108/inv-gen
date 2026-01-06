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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/,'');

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

  constructor(baseURL: string) {
    this.baseURL = (baseURL || '').replace(/\/+$/,'');
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
      
      // If 403 with CSRF error, clear cached token for retry
      if (response.status === 403 && typeof window !== 'undefined' && 
          (errorMessage.includes('CSRF') || errorMessage.includes('csrf'))) {
        console.warn('[apiClient] CSRF token invalid, will refresh on next request');
        this.csrfToken = null;
      }
      
      // If unauthorized, clear client session to avoid repeated failing calls
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          console.warn('[apiClient] 401 Unauthorized received. Clearing local session and redirecting to login.');
          localStorage.removeItem('userData');
          localStorage.removeItem('userToken');
          localStorage.removeItem('orgData');
          localStorage.removeItem('orgToken');
          this.csrfToken = null;
          // Give caller a chance to handle before redirecting in SPA environments
          setTimeout(() => {
            try {
              window.location.href = '/auth/login';
            } catch (e) {
              // ignore
            }
          }, 200);
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

    // Determine auth method: prefer Bearer token if available, otherwise use cookie
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('userToken');
      
      if (userToken) {
        // Bearer token auth - no CSRF needed
        headers['Authorization'] = `Bearer ${userToken}`;
        
        // Optional: send user ID for additional validation
        const userId = localStorage.getItem('userId');
        if (userId) {
          headers['x-user-id'] = userId;
        }
      } else {
        // Cookie-based auth - CSRF required for state-changing methods
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
    }

    return {
      ...headers,
      ...customHeaders,
    };
  }

  private async ensureCsrfToken(forceRefresh = false): Promise<void> {
    if (this.csrfToken && !forceRefresh) return;
    
    // Fetch CSRF token endpoint; it relies on cookie auth (credentials: include)
    try {
      const url = buildUrl(this.baseURL, '/auth/csrf-token');
      const resp = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      if (!resp.ok) {
        console.warn('[apiClient] Failed to fetch CSRF token:', resp.status, resp.statusText);
        return;
      }
      const data = await resp.json().catch(() => null);
      if (data && data.csrfToken) {
        this.csrfToken = data.csrfToken;
        console.debug('[apiClient] CSRF token obtained:', this.csrfToken);
      }
    } catch (e) {
      console.error('[apiClient] Error fetching CSRF token:', e);
    }
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

    const response = await fetch(url, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

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

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

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

    const response = await fetch(url, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

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

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: await this.getHeaders(),
      credentials: 'include', // Send cookies
    });

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

    const headers = await this.getHeaders({}, true);
    // Remove Content-Type when sending FormData so browser sets correct boundary
    if (headers && (headers as any)['Content-Type']) delete (headers as any)['Content-Type'];

    const response = await fetch(buildUrl(this.baseURL, endpoint), {
      method: 'POST',
      body: formData,
      credentials: 'include', // Send cookies
      headers,
      // Don't set Content-Type header - browser will set it with boundary
    });

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
