import { Data, LocalFeatureStats } from '@/models/data'
import { useProjectionStore } from '@/stores/projectionStore'

export function calcFingerprintStats(
  selection: Data[], // array of selected data points
): Record<string, LocalFeatureStats> {
  const projectionStore = useProjectionStore()
  const globalStats = projectionStore.globalStats
  const result: Record<string, LocalFeatureStats> = {}

  const featureKeys = Object.keys(globalStats)

  for (const key of featureKeys) {
    const values = selection
      .map((d) => d[key])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v))

    if (values.length === 0) continue

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
    const stddev = Math.sqrt(variance)

    const { min, max, mean: globalMean } = globalStats[key]
    const range = max - min || 1 // prevent division by 0
    const normMean = (mean - min) / range
    const meanDelta = mean - globalMean

    result[key] = {
      mean,
      stddev,
      globalMean,
      normMean,
      meanDelta,
    }
  }

  return result
}
