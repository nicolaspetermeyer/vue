import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import type { Dataset } from '@/models/data'

import { fetchDatasets } from '@/services/api'

export const useDatasetStore = defineStore('dataset', () => {
  //state
  const datasets = ref(new Map<number, Dataset>()) // Store datasets
  const selectedDatasetId = ref<number | null>(null) // Store selectedDatasetId

  // 🔹 COMPUTED
  const datasetsArray = computed(() => Array.from(datasets.value.values()))
  const selectedDataset = computed(() => getDataset(selectedDatasetId.value))
  const selectedDatasetName = computed(() => selectedDataset.value?.name ?? null)

  // 🔹 STATE MUTATION FUNCTIONS (PURE)
  function getDataset(id: number | null | undefined) {
    return id ? datasets.value.get(id) || null : null
  }

  function setSelectedDatasetId(id: number | null) {
    console.log('setSelectedDatasetId', id)
    selectedDatasetId.value = id
  }

  // 🔹 API CALLS
  async function loadDatasets() {
    try {
      const response: Dataset[] = await fetchDatasets()
      datasets.value = new Map(response.map((dataset) => [dataset.id, dataset]))
      return response
    } catch {
      return []
    }
  }

  return {
    datasets,
    datasetsArray,
    selectedDatasetId,
    selectedDataset,
    selectedDatasetName,
    getDataset,
    setSelectedDatasetId,
    loadDatasets,
  }
})
