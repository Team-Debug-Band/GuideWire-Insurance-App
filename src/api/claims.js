/**
 * Claims API Layer
 * Interacts with the GuideWire Insurance Backend /claims endpoints.
 */

import { api } from './client';

/**
 * Retrieves all registered claims and their XAI explanations.
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

/**
 * Dispatches a manual claim without parametric XAI triggers.
 * @param {{ reason: string, amount: number }} payload
 */
export const fileManualClaim = (payload) => {
  return api('/manual-claim', { method: 'POST', body: payload });
};

/**
 * Simulates a parametric event and auto-processes claims + payouts.
 *
 * @param {{ event_type: string, city: string, zone: string, severity: number }} payload
 * @returns {Promise<object>} - Simulation result summary.
 */
export const simulateEvent = (payload) => {
  return api('/simulate-event', { method: 'POST', body: payload });
};

/**
 * Retrieves aggregated fraud alerts by location.
 *
 * @returns {Promise<Array>} - List of fraud alert objects.
 */
export const getFraudAlerts = () => {
  return api('/fraud-alerts');
};
