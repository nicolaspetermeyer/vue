<script setup lang="ts">
import { onMounted } from 'vue'

import { useDatasetStore } from '@/stores/datasetStore'
import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'

const datasetStore = useDatasetStore()
const { datasetsArray, selectedDataset, selectedDatasetId } = storeToRefs(datasetStore)
const { setSelectedDatasetId } = datasetStore

const dataStore = useDataStore()
const { loadData, loadProjection } = dataStore

const handleSelect = (event: Event) => {
  const select = event.target as HTMLSelectElement
  if (select) {
    setSelectedDatasetId(Number(select.value) || null)
    loadData()
  }
}

const runDimRed = () => {
  loadProjection()
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
      <button @click="runDimRed()" class="btn btn-xs btn-content">Compute Points</button>
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
