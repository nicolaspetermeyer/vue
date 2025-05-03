<script setup lang="ts">
import { onMounted } from 'vue'

import { useDatasetStore } from '@/stores/datasetStore'
import { useDataStore } from '@/stores/dataStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'

const datasetStore = useDatasetStore()
const { datasetsArray, selectedDataset, selectedDatasetId } = storeToRefs(datasetStore)
const { setSelectedDatasetId } = datasetStore

const dataStore = useDataStore()
const { loadData } = dataStore

const projectionStore = useProjectionStore()
const { loadProjection } = projectionStore
const { projectionMethod } = storeToRefs(projectionStore)

const fingerprintStore = useFingerprintStore()
const { addFingerprint } = fingerprintStore

const handleSelect = (event: Event) => {
  const select = event.target as HTMLSelectElement
  if (select) {
    setSelectedDatasetId(Number(select.value) || null)
    loadData()
  }
}

onMounted(async () => {})
</script>

<template>
  <div class="sidebar">
    <h2>User Controls</h2>
    <div class="flex flex-col gap-2">
      <h2 class="text-xl font-bold">Dataset</h2>
      <select class="select w-full max-w-xs" @change="handleSelect" v-model="selectedDatasetId">
        <option disabled :value="null">Select Dataset</option>
        <option v-for="dataset in datasetsArray" :key="dataset.id" :value="dataset.id">
          {{ dataset.name }}
        </option>
      </select>
      <h2 class="text-xl font-bold">Projection</h2>
      <select class="select max-w-[50%]" v-model="projectionMethod">
        <option value="pca">PCA</option>
        <option value="tsne">t-SNE</option>
      </select>
      <button @click="loadProjection()" class="btn btn-xs btn-content">Compute Points</button>
      <h2 class="text-xl font-bold">Fingerprint</h2>

      <button @click="addFingerprint()" class="btn btn-xs btn-content">Create Fingerprint</button>
      <h2 class="text-xl font-bold">Comparison</h2>
      <!-- Radio buttons -->
      <div class="flex items-center mb-4">
        <input
          id="global-delta"
          type="radio"
          value=""
          name="default-radio"
          class="w-4 h-4 text-blue-600 bg-black-100 dark:bg-black-700"
        />
        <label
          for="global-delta"
          class="ms-2 text-sm font-medium text-black-900 dark:text-black-300"
          >Global Delta</label
        >
      </div>
      <div class="flex items-center">
        <input
          checked
          id="fingerprint-delta"
          type="radio"
          value=""
          name="default-radio"
          class="w-4 h-4 text-blue-600 bg-black-100 dark:bg-black-700"
        />
        <label
          for="fingerprint-delta"
          class="ms-2 text-sm font-medium text-black-900 dark:text-black-300"
          >Fingerprint Delta</label
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  padding: 1rem;
  background: #f1f1f1;
}

.dataset-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.dataset-list li {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.dataset-list li:hover {
  background-color: #9cada1;
}

.dataset-list li.active {
  font-weight: bold;
  background-color: #9cada1;
}
</style>
