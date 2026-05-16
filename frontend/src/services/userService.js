import { get, put } from './api';

/**
 * Get user profile information
 * @returns {Promise<object>} User profile data
 */
export const getUserProfile = async () => {
  return get('/user/profile', true);
};

/**
 * Update user profile information
 * @param {object} profileData - Profile data to update (name, birthday, gender, title)
 * @returns {Promise<object>} Updated user data
 */
export const updateUserProfile = async (profileData) => {
  return put('/user/profile', profileData, true);
};
