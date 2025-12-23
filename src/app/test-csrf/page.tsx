'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';

export default function TestCSRFPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testCSRF = async () => {
    setLoading(true);
    setResult('Testing CSRF token...\n');
    
    try {
      // First, let's check what's in localStorage
      const userData = localStorage.getItem('userData');
      const userToken = localStorage.getItem('userToken');
      const userId = localStorage.getItem('userId');
      const csrfToken = localStorage.getItem('csrfToken');
      
      setResult(prev => prev + `\nLocalStorage check:
- userData: ${userData ? 'exists' : 'missing'}
- userToken: ${userToken ? 'exists' : 'missing'}
- userId: ${userId || 'missing'}
- csrfToken: ${csrfToken || 'missing'}
`);

      if (userData) {
        try {
          const user = JSON.parse(userData);
          setResult(prev => prev + `\nParsed user ID: ${user.id}\n`);
        } catch (e) {
          setResult(prev => prev + `\nError parsing userData: ${e}\n`);
        }
      }

      // Try to fetch CSRF token directly
      setResult(prev => prev + '\nTesting CSRF token endpoint...\n');
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/csrf-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': userToken ? `Bearer ${userToken}` : '',
        },
      });
      
      setResult(prev => prev + `CSRF endpoint response: ${response.status} ${response.statusText}\n`);
      
      if (response.ok) {
        const data = await response.json();
        setResult(prev => prev + `CSRF token received: ${data.csrf_token}\n`);
      } else {
        const errorText = await response.text();
        setResult(prev => prev + `CSRF endpoint error: ${errorText}\n`);
      }

      // Now try a regular API call that requires CSRF
      setResult(prev => prev + '\nTesting regular API call...\n');
      
      try {
        const testResponse = await apiClient.post('/invoices', {
          test: 'data'
        });
        setResult(prev => prev + `API call successful: ${JSON.stringify(testResponse)}\n`);
      } catch (error: any) {
        setResult(prev => prev + `API call failed: ${error.message}\n`);
      }
      
    } catch (error: any) {
      setResult(prev => prev + `\nError: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('csrfExpiry');
    setResult('CSRF tokens cleared from localStorage');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CSRF Token Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testCSRF}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test CSRF Token'}
        </button>
        
        <button
          onClick={clearTokens}
          className="bg-red-500 text-white px-4 py-2 rounded ml-2"
        >
          Clear CSRF Tokens
        </button>
        
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">
          {result}
        </pre>
      </div>
    </div>
  );
}