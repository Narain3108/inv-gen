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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

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

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // FastAPI uses 'detail', others might use 'message'
      const errorMessage = errorData.detail || errorData.message || response.statusText;
      
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

  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add User ID if available (Fallback for non-cookie environments)
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }

    return {
      ...headers,
      ...customHeaders,
    };
  }

  async get<T>(endpoint: string, params?: Record<string, any>, transformCase = false): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    return transformCase ? snakeToCamel(result) : result;
  }

  async post<T>(endpoint: string, data?: any, transformCase = false): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    return transformCase ? snakeToCamel(result) : result;
  }

  async put<T>(endpoint: string, data?: any, transformCase = false): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    return transformCase ? snakeToCamel(result) : result;
  }

  async patch<T>(endpoint: string, data?: any, transformCase = false): Promise<T> {
    const bodyData = transformCase && data ? camelToSnake(data) : data;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(bodyData),
      credentials: 'include', // Send cookies
    });

    const result = await this.handleResponse<T>(response);
    return transformCase ? snakeToCamel(result) : result;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include', // Send cookies
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Send cookies
      // Don't set Content-Type header - browser will set it with boundary
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
