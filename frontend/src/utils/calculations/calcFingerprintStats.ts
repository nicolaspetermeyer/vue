import { Data, AttributeStats } from '@/models/data'
import { useProjectionStore } from '@/stores/projectionStore'

export function calcFingerprintStats(
  selection: Data[], // array of selected data points
): Record<string, AttributeStats> {
  const projectionStore = useProjectionStore()
  const globalStats = projectionStore.globalStats
  const result: Record<string, AttributeStats> = {}

  const featureKeys = Object.keys(globalStats)

  for (const key of featureKeys) {
    const values = selection
      .map((d) => d[key])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v))

    if (values.length === 0) continue
    const min = Math.min(...values)
    const max = Math.max(...values)
    const localMean = values.reduce((a, b) => a + b, 0) / values.length

    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - localMean, 2), 0) / values.length
    const std = Math.sqrt(variance)

    const median = values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)]
    const q25 = values.slice().sort((a, b) => a - b)[Math.floor(values.length * 0.25)]
    const q75 = values.slice().sort((a, b) => a - b)[Math.floor(values.length * 0.75)]
    const iqr = q75 - q25

    const { min: globalMin, max: GlobalMax, mean, normMean } = globalStats[key]

    if (min === undefined || max === undefined) {
      continue
    }
    const range = GlobalMax - globalMin || 1
    const localNormMean = (localMean - globalMin) / range
    const meanDelta = localMean - mean
    const normStd = std / range

    result[key] = {
      mean,
      normMean,
      std, // local standard deviation
      normStd, // normalized standard deviation
      median, // local median
      q25, // local quartiles
      q75, // local quartiles
      iqr, // local interquartile range
      localMean, // local mean
      localNormMean, // normalized local mean
      meanDelta, // difference to global mean
      min, // local min
      max, // local max
      isGlobal: false,
    }
  }

  return result
}
