import { ref } from 'vue'
import { fetchRawData, fetchProjection, fetchStats } from '@/services/api'
import { matchProjection } from '@/utils/matchProjection'
import type { ProjectedPoint, RawDataPoint, FeatureStats } from '@/models/data'

export function useDataset() {
  const rawData = ref<RawDataPoint[]>([])
  const projection = ref<ProjectedPoint[]>([])
  const stats = ref<Record<string, FeatureStats>>({})
  const selectedDataset = ref<string>('')

  const load = async (filename: string) => {
    selectedDataset.value = filename

    const raw = await fetchRawData(filename)
    const dr = await fetchProjection(filename)
    const s = await fetchStats(filename)

    rawData.value = raw
    projection.value = matchProjection(raw, dr)
    console.log('projection: ', projection.value)
    stats.value = s
  }

  return {
    rawData,
    projection,
    stats,
    selectedDataset,
    load,
  }
}
