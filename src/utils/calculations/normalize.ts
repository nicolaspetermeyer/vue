import type { Data, FeatureStats } from '@/models/data'

/**
 * Normalize a dataset using Z-score normalization.
 * Each value becomes: (value - mean) / std
 */
export function normalizeZ(data: Data[], stats: Record<string, FeatureStats>): Data[] {
  return data.map((row) => {
    const { id, ...features } = row
    const normalized: Record<string, number | string> = { id }

    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number' && key in stats) {
        const { mean, std } = stats[key]
        if (std !== 0) {
          normalized[key] = (value - mean) / std
        } else {
          normalized[key] = 0 // or keep the raw value
        }
      }
    }

    return normalized as Data
  })
}
