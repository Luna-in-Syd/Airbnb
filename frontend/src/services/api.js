import { API_BASE_URL } from '../config';

/**
 * Makes an API request with proper headers and error handling
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Promise<object>} Response data
 */
export const apiRequest = async (endpoint, method = 'GET', body = null, requiresAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add authorization token if required
  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

/**
 * GET request helper
 */
export const get = (endpoint, requiresAuth = false) => {
  return apiRequest(endpoint, 'GET', null, requiresAuth);
};

/**
 * POST request helper
 */
export const post = (endpoint, body, requiresAuth = false) => {
  return apiRequest(endpoint, 'POST', body, requiresAuth);
};

/**
 * PUT request helper
 */
export const put = (endpoint, body, requiresAuth = false) => {
  return apiRequest(endpoint, 'PUT', body, requiresAuth);
};

/**
 * DELETE request helper
 */
export const del = (endpoint, requiresAuth = false) => {
  return apiRequest(endpoint, 'DELETE', null, requiresAuth);
};
