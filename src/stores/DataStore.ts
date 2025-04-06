import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Data, ProjectionRow, FeatureStats, Projection } from '@/models/data'
import { fetchRawData, fetchStats } from '@/services/api'
import { useDatasetStore } from '@/stores/datasetStore'

export const useDataStore = defineStore('data', () => {
  // 🔹 STATE
  const rawData = ref<Data[]>([])
  const globalStats = ref<Record<string, FeatureStats>>({})

  //unified loader
  async function loadData() {
    const dataset = useDatasetStore().selectedDatasetName
    if (!dataset) {
      return null
    }
    try {
      const [raw, stat] = await Promise.all([fetchRawData(dataset), fetchStats(dataset)])
      rawData.value = raw
      console.log('Data:', rawData.value)
      globalStats.value = stat
    } catch {
      return null
    }
  }

  return {
    rawData,
    globalStats,
    loadData,
  }
})
