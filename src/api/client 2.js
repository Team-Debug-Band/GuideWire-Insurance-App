const BASE_URL = 'http://127.0.0.1:8000';

/**
 * A centralized fetch-based API client for the GuideWire Insurance Backend.
 * Handles base URL prepending, JSON serialization, and error management.
 * 
 * @param {string} endpoint - The API route (e.g. '/claims', '/simulate-event')
 * @param {object} options - Standard fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Decoded JSON response
 */
export async function api(endpoint, options = {}) {
  const { method = 'GET', body, headers = {}, ...rest } = options;

  // Ensure absolute path for the endpoint
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${formattedEndpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const config = {
    method,
    headers: defaultHeaders,
    ...rest,
  };

  // Convert payload to JSON string if body is provided
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `API Client: Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    // Auto-decode JSON response
    return await response.json();
  } catch (error) {
    console.group(`API ERROR: [${method}] ${url}`);
    console.error('Message:', error.message);
    console.groupEnd();
    throw error;
  }
}
