import type { FeatureStats } from '@/models/data'

/**
 * Utility class for normalizing values using different statistical methods
 */
export class StatisticalNormalizer {
  /**
   * Normalize a single value using min-max normalization
   *
   * @param value - Value to normalize
   * @param min - Minimum value in the range
   * @param max - Maximum value in the range
   * @param clamp - Whether to clamp the result to [0, 1]
   * @returns Normalized value between 0 and 1
   */
  static minMaxNormalize(value: number, min: number, max: number, clamp: boolean = true): number {
    // Check for division by zero case
    if (max === min) return 0.5

    // Standard min-max normalization
    let normalized = (value - min) / (max - min)

    // Optionally clamp to [0, 1]
    if (clamp) {
      normalized = Math.max(0, Math.min(1, normalized))
    }

    return normalized
  }

  /**
   * Normalize a single value using Z-score normalization
   *
   * @param value - Value to normalize
   * @param mean - Mean of the distribution
   * @param std - Standard deviation of the distribution
   * @returns Z-score normalized value
   */
  static zScoreNormalize(value: number, mean: number, std: number): number {
    // Check for division by zero case
    if (std === 0) return 0

    return (value - mean) / std
  }

  /**
   * Normalize a value using feature statistics
   *
   * @param value - Value to normalize
   * @param stats - Feature statistics containing min, max, mean, std
   * @param method - Normalization method ('minmax' or 'zscore')
   * @param clamp - Whether to clamp minmax results to [0, 1]
   * @returns Normalized value
   */
  static normalizeWithStats(
    value: number,
    stats: FeatureStats,
    method: 'minmax' | 'zscore' = 'minmax',
    clamp: boolean = true,
  ): number {
    if (method === 'minmax') {
      return this.minMaxNormalize(value, stats.min, stats.max, clamp)
    } else {
      return this.zScoreNormalize(value, stats.mean, stats.std)
    }
  }

  /**
   * Normalize a map of attributes using their respective feature statistics
   *
   * @param attributes - Object containing attribute key-value pairs
   * @param statsMap - Map of attribute keys to their statistics
   * @param method - Normalization method ('minmax' or 'zscore')
   * @returns Object with the same keys but normalized values
   */
  static normalizeAttributes(
    attributes: Record<string, number>,
    statsMap: Map<string, FeatureStats> | Record<string, FeatureStats>,
    method: 'minmax' | 'zscore' = 'minmax',
  ): Record<string, number> {
    const normalized: Record<string, number> = {}

    for (const [key, value] of Object.entries(attributes)) {
      let stats: FeatureStats | undefined

      // Handle both Map and Record types for statsMap
      if (statsMap instanceof Map) {
        stats = statsMap.get(key)
      } else {
        stats = statsMap[key]
      }

      // Only normalize if we have stats for this attribute
      if (stats) {
        normalized[key] = this.normalizeWithStats(value, stats, method)
      } else {
        // Keep original if no stats available
        normalized[key] = value
      }
    }

    return normalized
  }
}
