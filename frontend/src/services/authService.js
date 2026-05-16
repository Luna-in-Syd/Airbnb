import { post } from './api';
import { API_ENDPOINTS } from '../config';

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @returns {Promise<{token: string}>} Auth token
 */
export const register = async (email, password, name) => {
  const data = await post(API_ENDPOINTS.REGISTER, { email, password, name });
  return data;
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string}>} Auth token
 */
export const login = async (email, password) => {
  const data = await post(API_ENDPOINTS.LOGIN, { email, password });
  return data;
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  await post(API_ENDPOINTS.LOGOUT, {}, true);
};
