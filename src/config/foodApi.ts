// Food API Configuration
// This file centralizes the configuration for the food recognition API

export const FOOD_API_CONFIG = {
  // Cloud Run service URL
  BASE_URL: 'https://fiit-food101-505393897095.us-central1.run.app',

  // Confidence thresholds for decision making
  THRESHOLDS: {
    HIGH: 0.7, // Auto-accept if confidence >= 70%
    MID: 0.5, // Show options if confidence >= 50%
    LOW: 0.35, // Fallback if confidence < 35%
  },

  // Request timeout in milliseconds (8 seconds as per requirements)
  TIMEOUT_MS: 8000,
};

// Helper function to get decision based on confidence
export function getDecision(
  confidence: number
): 'auto_accept' | 'confirm' | 'fallback' {
  if (confidence >= FOOD_API_CONFIG.THRESHOLDS.HIGH) {
    return 'auto_accept';
  } else if (confidence >= FOOD_API_CONFIG.THRESHOLDS.MID) {
    return 'confirm';
  } else {
    return 'fallback';
  }
}
