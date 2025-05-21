<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'
import { SelectionMode } from '@/pixi/interactions/controllers/SelectionController'

const datasetStore = useDatasetStore()
const { datasetsArray, selectedDatasetId } = storeToRefs(datasetStore)
const { setSelectedDatasetId } = datasetStore

const projectionStore = useProjectionStore()
const { projectionMethod, projectionInstance, filterCategories, activeFilter } =
  storeToRefs(projectionStore)

const fingerprintStore = useFingerprintStore()
const { addFingerprint } = fingerprintStore

const currentMode = ref<SelectionMode>(SelectionMode.RECTANGLE)

const selectedCategory = computed({
  get: () => activeFilter.value.category,
  set: (value) => {
    // When category changes, reset values and update the filter
    if (value !== activeFilter.value.category) {
      activeFilter.value.category = value
      activeFilter.value.values = []

      // If null, clear all filters
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
      // Apply the filter with new values
      projectionStore.applyFilter(selectedCategory.value, values)
    }
  },
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
      <h2 class="text-xl font-bold">Filters</h2>
      <div class="mt-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Filter Points</h2>
          <button v-if="selectedCategory" @click="" class="btn btn-xs btn-ghost">Clear</button>
        </div>

        <div v-if="filterCategories && filterCategories.length > 0" class="filter-container mt-2">
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
              <label class="label pb-1">
                <span class="label-text">Values</span>
                <span v-if="selectedValues.length > 0" class="label-text-alt text-primary">
                  {{ selectedValues.length }} selected
                </span>
              </label>

              <div class="checkboxes-container max-h-40 overflow-y-auto border rounded p-1">
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
          class="text-sm text-gray-500 mt-2"
        >
          No categorical data available for filtering
        </div>
        <div v-else class="text-sm text-gray-500 mt-2">Load a projection to enable filtering</div>
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
