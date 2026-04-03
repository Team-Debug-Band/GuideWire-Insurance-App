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
