<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { storeToRefs } from 'pinia'
import { SelectionMode } from '@/pixi/interactions/controllers/SelectionController'
import Instructions from './left/Instructions.vue'

const datasetStore = useDatasetStore()
const { datasetsArray, selectedDatasetId } = storeToRefs(datasetStore)
const { setSelectedDatasetId } = datasetStore

const projectionStore = useProjectionStore()
const { projectionMethod, projectionInstance, filterCategories, activeFilter } =
  storeToRefs(projectionStore)
const { clearFilters } = projectionStore

const currentMode = ref<SelectionMode>(SelectionMode.RECTANGLE)
const selectionModeText = computed(() =>
  currentMode.value === SelectionMode.RECTANGLE ? 'Rectangle Selection' : 'Lasso Selection',
)

const selectedCategory = computed({
  get: () => activeFilter.value.category,
  set: (value) => {
    if (value !== activeFilter.value.category) {
      activeFilter.value.category = value
      activeFilter.value.values = []

      if (value === null) {
        projectionStore.clearFilters()
      }
    }
  },
})

const availableCategoryValues = computed(() => {
  if (!selectedCategory.value) return []
  return projectionStore.getCategoryValues(selectedCategory.value)
})

const selectedValues = computed({
  get: () => activeFilter.value.values,
  set: (values) => {
    if (selectedCategory.value) {
      projectionStore.applyFilter(selectedCategory.value, values)
    }
  },
})

const hasActiveFilters = computed(() => {
  return activeFilter.value.category && activeFilter.value.values.length > 0
})

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

const selectAllValues = () => {
  if (selectedCategory.value) {
    selectedValues.value = [...availableCategoryValues.value]
  }
}

const deselectAllValues = () => {
  selectedValues.value = []
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

    <!-- Filters Section -->
    <section class="section">
      <div class="flex items-center justify-between">
        <h3 class="section-title">Filters</h3>
        <button v-if="hasActiveFilters" @click="clearFilters" class="btn btn-xs btn-ghost">
          Clear
        </button>
      </div>
      <button @click="toggleSelectionMode" class="btn btn-sm btn-primary flex-1">
        <a>{{ selectionModeText }}</a>
      </button>

      <div v-if="filterCategories && filterCategories.length > 0" class="filter-container">
        <!-- Category Selector -->
        <div class="form-control">
          <label class="label pb-1">
            <span class="label-text">Category</span>
          </label>
          <select class="select select-sm w-full" v-model="selectedCategory">
            <option :value="null">Select category...</option>
            <option v-for="category in filterCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <!-- Values MultiSelect -->
        <div v-if="selectedCategory" class="mt-2">
          <div class="form-control">
            <div class="flex items-center justify-between">
              <label class="label-text">Values</label>
              <div class="flex gap-1">
                <button
                  @click="selectAllValues"
                  class="btn btn-xs btn-ghost py-1"
                  :disabled="selectedValues.length === availableCategoryValues.length"
                >
                  All
                </button>
                <button
                  @click="deselectAllValues"
                  class="btn btn-xs btn-ghost py-1"
                  :disabled="selectedValues.length === 0"
                >
                  None
                </button>
              </div>
            </div>

            <div class="mt-1 text-xs text-gray-500" v-if="selectedValues.length > 0">
              {{ selectedValues.length }} selected
            </div>

            <div class="checkboxes-container">
              <div v-for="value in availableCategoryValues" :key="value" class="form-control">
                <label class="label cursor-pointer justify-start py-1">
                  <input
                    type="checkbox"
                    :value="value"
                    v-model="selectedValues"
                    class="checkbox checkbox-xs mr-2"
                  />
                  <span class="label-text">{{ value }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filterCategories && filterCategories.length === 0"
        class="text-sm text-gray-500"
      >
        No categorical data available for filtering
      </div>
      <div v-else class="text-sm text-gray-500">Load a projection to enable filtering</div>
    </section>
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
