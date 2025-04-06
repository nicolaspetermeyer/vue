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

  // State Pixi
  const pixiProjection = ref(new Map<string, Projection[]>([])) // Map of id to projection data

  // State Access Functions
  function getPixiProjection(id: string | null | undefined) {
    return id ? pixiProjection.value.get(id) || null : null
  }

  //unified loader
  async function loadData() {
    const dataset = useDatasetStore().selectedDatasetName
    if (!dataset) {
      return null
    }
    try {
      const [raw, stat] = await Promise.all([fetchRawData(dataset), fetchStats(dataset)])
      rawData.value = raw
      console.log('RAWDATA VAlues', rawData.value)
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
