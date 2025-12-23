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

  constructor(baseURL: string) {
    this.baseURL = (baseURL || '').replace(/\/+$/,'');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
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
      
      // If unauthorized, clear client session to avoid repeated failing calls
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          console.warn('[apiClient] 401 Unauthorized received. Clearing local session and redirecting to login.');
          localStorage.removeItem('userData');
          localStorage.removeItem('userToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('orgData');
          localStorage.removeItem('orgToken');
          localStorage.removeItem('csrfToken');
          localStorage.removeItem('csrfExpiry');
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

  private async fetchCsrfToken(): Promise<string | null> {
    try {
      const userToken = localStorage.getItem('userToken');
      
      const response = await fetch(`${this.baseURL}/auth/csrf-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': userToken ? `Bearer ${userToken}` : '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const csrfToken = data.csrf_token;
        // Cache token for 1 hour
        localStorage.setItem('csrfToken', csrfToken);
        localStorage.setItem('csrfExpiry', (Date.now() + 3600000).toString());
        return csrfToken;
      } else {
        console.warn('[apiClient] Failed to fetch CSRF token:', response.status, response.statusText);
        return null;
      }
    } catch (e) {
      console.warn('[apiClient] Failed to fetch CSRF token:', e);
      return null;
    }
  }

  private async getHeaders(customHeaders?: HeadersInit): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add User ID if available (Fallback for non-cookie environments)
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      const userToken = localStorage.getItem('userToken');
      const userData = localStorage.getItem('userData');
      
      if (userId) {
        headers['x-user-id'] = userId;
      }
      
      // Also send token in Authorization header as fallback if cookie fails
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      // Add CSRF token for cookie-based authentication
      if (userData) {
        try {
          const user = JSON.parse(userData);
          
          if (user.id) {
            // Try to get cached CSRF token first
            let csrfToken = localStorage.getItem('csrfToken');
            const csrfExpiry = localStorage.getItem('csrfExpiry');
            
            // Check if token is expired or doesn't exist
            if (!csrfToken || !csrfExpiry || Date.now() > parseInt(csrfExpiry)) {
              csrfToken = await this.fetchCsrfToken();
            }
            
            if (csrfToken) {
              headers['X-CSRF-Token'] = csrfToken;
            }
          }
        } catch (e) {
          console.warn('[apiClient] Error parsing userData:', e);
        }
      }
    }

    return {
      ...headers,
      ...customHeaders,
    };
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
        const headers = await this.getHeaders();
        const response = await fetch(key, {
          method: 'GET',
          headers,
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

    const headers = await this.getHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] POST response', url, result);
    }

    return transformCase ? snakeToCamel(result) : result;
  }

  async put<T>(endpoint: string, data?: any, transformCase = false): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const url = buildUrl(this.baseURL, endpoint);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PUT', url, bodyData);
    }

    const headers = await this.getHeaders();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PUT response', url, result);
    }

    return transformCase ? snakeToCamel(result) : result;
  }

  async patch<T>(endpoint: string, data?: any, transformCase = false): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const url = buildUrl(this.baseURL, endpoint);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PATCH', url, bodyData);
    }

    const headers = await this.getHeaders();
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] PATCH response', url, result);
    }

    return transformCase ? snakeToCamel(result) : result;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = buildUrl(this.baseURL, endpoint);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] DELETE', url);
    }

    const headers = await this.getHeaders();
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[apiClient] DELETE response', url, result);
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

    const response = await fetch(buildUrl(this.baseURL, endpoint), {
      method: 'POST',
      body: formData,
      credentials: 'include', // Send cookies
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
