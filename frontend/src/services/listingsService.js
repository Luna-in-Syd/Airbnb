import { get, post, put, del } from './api';
import { API_ENDPOINTS } from '../config';

/**
 * Get all listings
 * @returns {Promise<Array>} Array of listings
 */
export const getAllListings = async () => {
  const data = await get(API_ENDPOINTS.LISTINGS);
  return data.listings || [];
};

/**
 * Get a single listing by ID
 * @param {string} id - Listing ID
 * @returns {Promise<Object>} Listing details
 */
export const getListingById = async (id) => {
  const data = await get(API_ENDPOINTS.LISTING_DETAIL(id));
  return data.listing || {};
};

/**
 * Create a new listing
 * @param {Object} listingData - Listing data (title, address, price, thumbnail, metadata)
 * @returns {Promise<Object>} Created listing with listingId
 */
export const createListing = async (listingData) => {
  const data = await post(API_ENDPOINTS.LISTING_NEW, listingData, true);
  return data;
};

/**
 * Update an existing listing
 * @param {string} id - Listing ID
 * @param {Object} listingData - Updated listing data
 * @returns {Promise<Object>} Response data
 */
export const updateListing = async (id, listingData) => {
  const data = await put(API_ENDPOINTS.LISTING_DETAIL(id), listingData, true);
  return data;
};

/**
 * Delete a listing
 * @param {string} id - Listing ID
 * @returns {Promise<Object>} Response data
 */
export const deleteListing = async (id) => {
  const data = await del(API_ENDPOINTS.LISTING_DETAIL(id), true);
  return data;
};

/**
 * Publish a listing with availability dates
 * @param {string} id - Listing ID
 * @param {Array} availability - Array of date ranges [{start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'}]
 * @returns {Promise<Object>} Response data
 */
export const publishListing = async (id, availability) => {
  const data = await put(API_ENDPOINTS.LISTING_PUBLISH(id), { availability }, true);
  return data;
};

/**
 * Unpublish a listing
 * @param {string} id - Listing ID
 * @returns {Promise<Object>} Response data
 */
export const unpublishListing = async (id) => {
  const data = await put(API_ENDPOINTS.LISTING_UNPUBLISH(id), {}, true);
  return data;
};

/**
 * Leave a review for a listing
 * @param {string} listingId - Listing ID
 * @param {string} bookingId - Booking ID
 * @param {Object} review - Review data {rating: number, comment: string}
 * @returns {Promise<Object>} Response data
 */
export const leaveReview = async (listingId, bookingId, review) => {
  const data = await put(API_ENDPOINTS.LISTING_REVIEW(listingId, bookingId), { review }, true);
  return data;
};

/**
 * Add a review for a listing (alias for leaveReview)
 * @param {string} listingId - Listing ID
 * @param {string} bookingId - Booking ID
 * @param {Object} review - Review data {rating: number, comment: string}
 * @returns {Promise<Object>} Response data
 */
export const addReview = async (listingId, bookingId, review) => {
  return leaveReview(listingId, bookingId, review);
};
