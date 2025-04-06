import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Data, ProjectionRow, FeatureStats, Projection } from '@/models/data'
import { fetchRawData, fetchStats, fetchProjection } from '@/services/api'
import { useDatasetStore } from '@/stores/datasetStore'
import { matchProjection } from '@/utils/matchProjection'

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
      projectionMatch.value = matchProjection(rawData.value, projectionRow.value)
    } catch {
      return null
    }
  }

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
