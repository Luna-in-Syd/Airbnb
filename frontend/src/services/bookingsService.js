import { apiRequest } from './api';
import { API_BASE_URL } from '../config';

/**
 * Make a new booking for a listing
 * @param {string} listingId - The listing ID
 * @param {Object} bookingData - Booking data with dateRange
 * @returns {Promise<Object>} - Created booking data
 */
export const makeBooking = async (listingId, bookingData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/bookings/new/${listingId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to make booking');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to make booking');
  }
};

/**
 * Get all bookings for the current user
 * @returns {Promise<Array>} - Array of booking objects
 */
export const getMyBookings = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch bookings');
    }

    return data.bookings || [];
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch bookings');
  }
};

/**
 * Delete a booking
 * @param {string} bookingId - The booking ID to delete
 * @returns {Promise<Object>} - Response data
 */
export const deleteBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete booking');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete booking');
  }
};

/**
 * Accept a booking (for listing owners)
 * @param {string} bookingId - The booking ID to accept
 * @returns {Promise<Object>} - Response data
 */
export const acceptBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/bookings/accept/${bookingId}`, {
      method: 'PUT',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to accept booking');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to accept booking');
  }
};

/**
 * Decline a booking (for listing owners)
 * @param {string} bookingId - The booking ID to decline
 * @returns {Promise<Object>} - Response data
 */
export const declineBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/bookings/decline/${bookingId}`, {
      method: 'PUT',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to decline booking');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to decline booking');
  }
};

/**
 * Get all bookings (returns bookings data with bookings array)
 * @returns {Promise<Object>} - Object containing bookings array { bookings: [...] }
 */
export const getAllBookings = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch all bookings');
    }

    return data; // Returns { bookings: [...] }
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch all bookings');
  }
};