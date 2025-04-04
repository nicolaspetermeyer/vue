import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Data, ProjectionRow, FeatureStats, Projection } from '@/models/data'
import { fetchRawData, fetchStats, fetchProjection } from '@/services/api'
import { useDatasetStore } from '@/stores/datasetStore'
import { matchProjection } from '@/utils/matchProjection'
import { normalizeZ } from '@/utils/normalize'

export const useDataStore = defineStore('data', () => {
  // 🔹 STATE
  const rawData = ref<Data[]>([])
  const normalizedData = ref<Data[]>([])
  const projectionRow = ref<ProjectionRow[]>([])
  const globalStats = ref<Record<string, FeatureStats>>({})
  const projectionMatch = ref<Projection[]>([])

  //unified loader
  async function loadData() {
    const dataset = useDatasetStore().selectedDatasetName
    if (!dataset) {
      return null
    }
    try {
      const [raw, stat] = await Promise.all([fetchRawData(dataset), fetchStats(dataset)])
      rawData.value = raw
      globalStats.value = stat
    } catch {
      return null
    }
  }
  async function loadProjection() {
    const dataset = useDatasetStore().selectedDatasetName
    if (!dataset) {
      return null
    }
    try {
      const response: ProjectionRow[] = await fetchProjection(dataset)

      projectionRow.value = response
      console.log(projectionRow.value)
      projectionMatch.value = matchProjection(rawData.value, projectionRow.value)
    } catch {
      return null
    }
  }

  //   const normalized = normalizeZ(rawData, stat)
  //   const matched = matchProjection(normalized, proj)
  // const matched = matchProjection(rawData.value, projectionRow)
  //   console.log('rawData: ', rawData)
  //   console.log('normalized: ', normalized)
  //   console.log('matched: ', matched)
  //   console.log('proj: ', proj)

  //   normalizedData.value = normalized
  //   stats.value = stat
  //   projection.value = matched

  return {
    rawData,
    normalizedData,
    projectionRow,
    globalStats,
    projectionMatch,
    loadData,
    loadProjection,
  }
})
