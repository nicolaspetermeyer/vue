import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Data, FeatureStats, DataResponse, ColumnMetadata } from '@/models/data'
import { fetchRawData, fetchStats } from '@/services/api'
import { useDatasetStore } from '@/stores/datasetStore'

export const useDataStore = defineStore('data', () => {
  // 🔹 STATE
  const rawData = ref<Data[]>([])
  const globalStats = ref<Record<string, FeatureStats>>({})
  const columnMetadata = ref<Record<string, { isNumeric: boolean }>>({})

  const numericAttributes = ref<string[]>([])
  const nonNumericAttributes = ref<string[]>([])

  //unified loader
  async function loadData() {
    const dataset = useDatasetStore().selectedDatasetName
    if (!dataset) {
      return null
    }
    try {
      const [raw, stat] = await Promise.all([fetchRawData(dataset), fetchStats(dataset)])
      if (typeof raw === 'object' && 'data' in raw && 'metadata' in raw) {
        const typedResponse = raw as DataResponse
        rawData.value = typedResponse.data
        columnMetadata.value = typedResponse.metadata.columns

        categorizeAttributes()
      } else {
        rawData.value = raw as Data[]
      }
      globalStats.value = stat
    } catch (error) {
      console.error('Failed to load data:', error)
      return null
    }
  }

  function categorizeAttributes() {
    numericAttributes.value = []
    nonNumericAttributes.value = []

    Object.entries(columnMetadata.value).forEach(([key, meta]) => {
      if (meta.isNumeric) {
        numericAttributes.value.push(key)
      } else {
        nonNumericAttributes.value.push(key)
      }
    })

    console.log('Numeric attributes:', numericAttributes.value)
    console.log('Non-numeric attributes:', nonNumericAttributes.value)
  }

  return {
    rawData,
    globalStats,
    columnMetadata,
    numericAttributes,
    nonNumericAttributes,
    loadData,
  }
})
