<script setup lang="ts">
import { onMounted, computed } from 'vue'

import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { storeToRefs } from 'pinia'
import PointFilterPanel from './left/PointFilterPanel.vue'
import AttributeFilterPanel from './left/AttributeFilterPanel.vue'
import Instructions from './left/Instructions.vue'

const datasetStore = useDatasetStore()
const { datasetsArray, selectedDatasetId } = storeToRefs(datasetStore)
const { setSelectedDatasetId } = datasetStore

const projectionStore = useProjectionStore()
const { projectionMethod } = storeToRefs(projectionStore)

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

onMounted(async () => {})
</script>

<template>
  <div class="sidebar">
    <h2 class="text-xl font-bold mb-2">Data Explorer</h2>

    <!-- Dataset Section -->
    <section class="section">
      <h3 class="section-title">Dataset</h3>
      <select class="select w-full" @change="handleSelect" v-model="selectedDatasetId">
        <option disabled :value="null">Select Dataset</option>
        <option v-for="dataset in datasetsArray" :key="dataset.id" :value="dataset.id">
          {{ dataset.name }}
        </option>
      </select>

      <!-- Projection options -->
      <div class="mt-3">
        <div class="flex items-center justify-between">
          <select class="select-sm" v-model="projectionMethod">
            <option value="pca">PCA</option>
            <option value="tsne">t-SNE</option>
          </select>
          <button @click="loadProj()" class="btn btn-sm btn-primary">Compute</button>
        </div>
      </div>
    </section>

    <!-- Point Filter Section -->
    <PointFilterPanel />

    <!-- Attribute Filter Section (only show if metadata is available) -->
    <AttributeFilterPanel />
    <!-- Instructions Section -->
    <Instructions />
  </div>
</template>

<style scoped>
.sidebar {
  padding: 1rem;
  background: #f1f1f1;
  height: 100%;
  overflow-y: auto;
}

.section {
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.checkboxes-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: #f9fafb;
}

/* Custom scrollbar */
.checkboxes-container::-webkit-scrollbar {
  width: 6px;
}

.checkboxes-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.checkboxes-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.checkboxes-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
