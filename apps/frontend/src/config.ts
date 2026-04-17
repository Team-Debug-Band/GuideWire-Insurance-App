/**
 * Central configuration for the SurelyAI Frontend.
 */

const envApiBase = import.meta.env.VITE_API_BASE_URL;

if (!envApiBase) {
  console.warn(
    "VITE_API_BASE_URL is not defined in the environment. " +
    "Falling back to local development URL: http://localhost:8000/api/v1"
  );
}

// Ensure the base URL includes the API version prefix if needed by our backend
export const API_BASE_URL = envApiBase || "http://localhost:8000/api/v1";

// Polling interval settings
export const IS_DEMO_MODE = import.meta.env.MODE === 'development' || !import.meta.env.VITE_API_BASE_URL;
export const POLLING_INTERVAL = IS_DEMO_MODE ? 5000 : 30000;

export default {
    API_BASE_URL,
    POLLING_INTERVAL,
    IS_DEMO_MODE
};
