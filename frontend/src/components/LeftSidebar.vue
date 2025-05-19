<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'
import { SelectionMode } from '@/pixi/interactions/controllers/SelectionController'

const datasetStore = useDatasetStore()
const { datasetsArray, selectedDatasetId } = storeToRefs(datasetStore)
const { setSelectedDatasetId } = datasetStore

const projectionStore = useProjectionStore()
const { projectionMethod, projectionInstance } = storeToRefs(projectionStore)

const fingerprintStore = useFingerprintStore()
const { addFingerprint } = fingerprintStore

const currentMode = ref<SelectionMode>(SelectionMode.RECTANGLE)

const loadProj = async () => {
  projectionStore.clearAllProjectionData()

  await projectionStore.loadProjection()
}

const handleSelect = (event: Event) => {
  const select = event.target as HTMLSelectElement
  if (select) {
    setSelectedDatasetId(Number(select.value || null))
  }
}

const toggleSelectionMode = () => {
  if (projectionInstance.value) {
    projectionInstance.value.toggleSelectionMode()
    currentMode.value =
      currentMode.value === SelectionMode.RECTANGLE ? SelectionMode.LASSO : SelectionMode.RECTANGLE
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
      <button @click="loadProj()" class="btn btn-xs btn-content">Compute Points</button>
      <h2 class="text-xl font-bold">Fingerprint</h2>
      <button @click="toggleSelectionMode" class="btn btn-xs btn-content">
        Toggle Selection Mode
      </button>
      <button @click="addFingerprint()" class="btn btn-xs btn-content">Create Fingerprint</button>
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
