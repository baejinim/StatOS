/**
 * Feature flags to enable/disable routes and features
 * Set to false to disable features without removing code
 */
export const features = {
  ama: false,
  hn: false,
  listening: false,
  sites: false,
  stack: false,
  numbers: false,
  designDetails: false,
  appDissection: false,
  speaking: false, // Disable speaking (Notion-based)
  writing: true, // Keep writing enabled
  about: true, // Keep about enabled
} as const;

export type FeatureKey = keyof typeof features;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return features[feature] === true;
}

