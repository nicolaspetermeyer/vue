import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { RawDataPoint, ProjectedPoint, FeatureStats } from '@/models/data'

import { fetchRawData, fetchStats, fetchProjection } from '@/services/api'

import { matchProjection } from '@/utils/matchProjection'
import { normalizeZ } from '@/utils/normalize'

export const useDatasetStore = defineStore('dataimport', () => {
  //state
  const selectedDataset = ref<string | null>(null)

  const rawData = ref<RawDataPoint[]>([])
  const normalizedData = ref<RawDataPoint[]>([])
  const projection = ref<ProjectedPoint[]>([])
  const stats = ref<Record<string, FeatureStats>>({})

  //unified loader
  async function load(filename: string) {
    selectedDataset.value = filename

    const raw = await fetchRawData(filename)
    const stat = await fetchStats(filename)
    const proj = await fetchProjection(filename)

    const rawData: RawDataPoint[] = raw.map((row) => ({
      ...row,
      id: String(row.id),
    }))

    const normalized = normalizeZ(rawData, stat)
    const matched = matchProjection(normalized, proj)

    console.log('rawData: ', rawData)
    console.log('normalized: ', normalized)
    console.log('matched: ', matched)
    console.log('proj: ', proj)

    normalizedData.value = normalized
    stats.value = stat
    projection.value = matched
  }

  return {
    selectedDataset,
    rawData,
    normalizedData,
    projection,
    stats,
    load,
  }
})
