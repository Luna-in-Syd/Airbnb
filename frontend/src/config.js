import backendConfig from '../backend.config.json';

export const API_BASE_URL = `http://localhost:${backendConfig.BACKEND_PORT}`;

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/user/auth/register',
  LOGIN: '/user/auth/login',
  LOGOUT: '/user/auth/logout',

  // Listings
  LISTINGS: '/listings',
  LISTING_DETAIL: (id) => `/listings/${id}`,
  LISTING_NEW: '/listings/new',
  LISTING_PUBLISH: (id) => `/listings/publish/${id}`,
  LISTING_UNPUBLISH: (id) => `/listings/unpublish/${id}`,
  LISTING_REVIEW: (listingId, bookingId) => `/listings/${listingId}/review/${bookingId}`,

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_NEW: (listingId) => `/bookings/new/${listingId}`,
  BOOKING_DETAIL: (bookingId) => `/bookings/${bookingId}`,
  BOOKING_DELETE: (bookingId) => `/bookings/${bookingId}`,
  BOOKING_ACCEPT: (listingId, bookingId) => `/listings/${listingId}/accept/${bookingId}`,
  BOOKING_DECLINE: (listingId, bookingId) => `/listings/${listingId}/decline/${bookingId}`,
};
