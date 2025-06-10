<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { projectionService } from '@/services/projectionService'
import { storeToRefs } from 'pinia'
import PointFilterPanel from './left/PointFilterPanel.vue'
import AttributeFilterPanel from './left/AttributeFilterPanel.vue'
import Instructions from './left/Instructions.vue'
import ThresholdControlPanel from './left/ThresholdControlPanel.vue'
import DimReductionExplanationModal from './left/DimReductionExplanationModal.vue'

const datasetStore = useDatasetStore()
const { datasetsArray, selectedDatasetId } = storeToRefs(datasetStore)
const { setSelectedDatasetId } = datasetStore

const projectionStore = useProjectionStore()
const {
  projectionMethod,
  perplexity,
  umapNeighbors,
  umapMinDist,
  showPerplexityControl,
  showUmapControls,
} = storeToRefs(projectionStore)

const showDimReductionModal = ref(false)

const toggleDimReductionModal = () => {
  showDimReductionModal.value = !showDimReductionModal.value
}

const loadProj = async () => {
  projectionStore.clearAllProjectionData()

  await projectionService.loadProjection()
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
        <div class="flex space-x-2 mb-3">
          <select class="select-sm select-primary" v-model="projectionMethod">
            <option value="pca">PCA</option>
            <option value="tsne">t-SNE</option>
            <option value="umap">UMAP</option>
          </select>
          <!-- Dimensionality Reduction Info Button -->
          <button
            @click="toggleDimReductionModal"
            class="btn btn-soft btn-sm btn-info btn-primary flex-1"
            :class="{ 'btn-active': showDimReductionModal }"
          >
            <span class="mr-1">ℹ️</span> About DR
          </button>
          <!-- Load Projection Button -->
          <button @click="loadProj()" class="btn btn-sm btn-primary flex-1">Compute</button>
        </div>

        <!-- t-SNE Perplexity Slider -->
        <div v-if="showPerplexityControl" class="mt-2">
          <div class="flex justify-between items-center text-sm">
            <span>Perplexity:</span>
            <span class="font-medium">{{ perplexity }}</span>
          </div>
          <input
            type="range"
            v-model.number="perplexity"
            min="5"
            max="100"
            step="1"
            class="range range-sm w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 px-1">
            <span>5</span>
            <span>50</span>
            <span>100</span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Higher values consider more global structure. Lower values focus on local neighborhoods.
          </div>
        </div>

        <!-- UMAP Parameter Controls -->
        <div v-if="showUmapControls" class="mt-2">
          <!-- n_neighbors slider -->
          <div class="flex justify-between items-center text-sm">
            <span>Neighbors:</span>
            <span class="font-medium">{{ umapNeighbors }}</span>
          </div>
          <input
            type="range"
            v-model.number="umapNeighbors"
            min="2"
            max="100"
            step="1"
            class="range range-sm w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 px-1">
            <span>2</span>
            <span>50</span>
            <span>100</span>
          </div>
          <div class="text-xs text-gray-500 mt-1 mb-3">
            Controls how UMAP balances local versus global structure. Higher values preserve more
            global structure.
          </div>

          <!-- min_dist slider -->
          <div class="flex justify-between items-center text-sm">
            <span>Minimum Distance:</span>
            <span class="font-medium">{{ umapMinDist.toFixed(2) }}</span>
          </div>
          <input
            type="range"
            v-model.number="umapMinDist"
            min="0.0"
            max="1.0"
            step="0.01"
            class="range range-sm w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 px-1">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Controls how tightly points are packed together. Lower values create more clustered
            embeddings.
          </div>
        </div>
      </div>
    </section>
    <!-- Treshold Filter -->
    <ThresholdControlPanel />

    <!-- Point Filter Section -->
    <PointFilterPanel />

    <!-- Attribute Filter Section (only show if metadata is available) -->
    <AttributeFilterPanel />
    <!-- Instructions Section -->
    <Instructions />
    <!-- Dimensionality Reduction Modal -->
    <DimReductionExplanationModal
      :show="showDimReductionModal"
      @close="showDimReductionModal = false"
    />
  </div>
</template>

<style scoped>
.sidebar {
  padding: 1rem;
  background: #ffffff;
  height: 100%;
  overflow-y: auto;
}

.section {
  padding: 0.75rem;
  background: #d1d1d1;
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

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(66, 42, 213);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(60, 80, 251);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

input[type='range']::-webkit-slider-runnable-track {
  background: #e5e7eb;
  border: none;
  height: 8px;
}

/* .checkboxes-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #d7dadf;
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: #f9fafb;
} */

/* Custom scrollbar
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
} */
</style>
