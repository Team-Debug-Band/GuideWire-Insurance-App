/**
 * Worker API Layer
 * Reuses core insurance endpoints for worker-facing dashboard components.
 */

import { api } from './client';

/**
 * Retrieves all registered claims.
 * 
 * @returns {Promise<Array>} - List of all processed claims.
 */
export const getClaims = () => {
  return api('/claims');
};

/**
 * Retrieves all successful payouts.
 *
 * @returns {Promise<Array>} - List of all successful payouts.
 */
export const getPayouts = () => {
  return api('/payouts');
};
