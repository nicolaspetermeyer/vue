import type { AttributeStats } from '@/models/data'

/**
 * Utility class for normalizing values using different statistical methods
 */
export class StatisticalNormalizer {
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
    globalStats: Record<string, AttributeStats>,
    method: 'minmax' | 'zscore' = 'minmax',
  ): Record<string, number> {
    const result: Record<string, number> = {}

    for (const [key, value] of Object.entries(attributes)) {
      if (!globalStats[key]) continue

      const { min, max, std, mean } = globalStats[key]

      if (method === 'minmax') {
        const actualMin = min ?? 0
        const actualMax = max ?? 1
        const range = actualMax - actualMin || 1 // Prevent division by zero
        result[key] = (value - actualMin) / range
      } else if (method === 'zscore') {
        result[key] = (value - mean) / std
      }
    }

    return result
  }
}
