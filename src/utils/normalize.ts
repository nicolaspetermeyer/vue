import type { RawDataPoint, FeatureStats } from '@/models/data'

/**
 * Normalize a dataset using Z-score normalization.
 * Each value becomes: (value - mean) / std
 */
export function normalizeZ(
  data: RawDataPoint[],
  stats: Record<string, FeatureStats>,
): RawDataPoint[] {
  return data.map((row) => {
    const { id, ...features } = row
    const normalized: Record<string, number | string> = { id }

    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number' && stats[key]) {
        const { mean, std } = stats[key]
        normalized[key] = (value - mean) / (std || 1)
      }
    }

    return normalized as RawDataPoint
  })
}
