/**
 * Payouts API Layer
 * Interacts with the GuideWire Insurance Backend /payouts endpoint.
 */

import { api } from './client';

/**
 * Retrieves all registered payouts.
 * 
 * @returns {Promise<Array>} - List of all payout records.
 */
export const getPayouts = () => {
  return api('/payouts');
};
