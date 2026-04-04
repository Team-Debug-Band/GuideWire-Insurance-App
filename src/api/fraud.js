/**
 * Fraud API Layer
 * Interacts with the GuideWire Insurance Backend /fraud-alerts endpoint.
 */

import { api } from './client';

/**
 * Retrieves all current location-based fraud alerts and historical anomalies.
 * 
 * @returns {Promise<Array>} - List of triggered fraud alerts by zone.
 */
export const getFraudAlerts = () => {
  return api('/fraud-alerts');
};
