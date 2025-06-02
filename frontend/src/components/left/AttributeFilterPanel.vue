<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { projectionService } from '@/services/projectionService'

const attributeFilterStore = useAttributeFilterStore()
const {
  attributeMetadata,
  metadataAttributes,
  metadataCategories,
  uniqueValues,
  hasMetadata,
  attributeMetadataFilter,
  attributeFilterActive,
  activeAttributes,
  allNumericAttributes,
  isRecalculating,
} = storeToRefs(attributeFilterStore)

const { updateAttributeFilter, clearAttributeFilter } = attributeFilterStore

const projectionStore = useProjectionStore()
const { resetToBaseProjection } = projectionStore

// Metadata filtering for attributes
const selectedMetadataCategory = computed({
  get: () => attributeMetadataFilter.value.category,
  set: (value) => {
    if (value !== attributeMetadataFilter.value.category) {
      attributeMetadataFilter.value.category = value
      attributeMetadataFilter.value.value = null
    }
  },
})

// Get unique values for the selected category across all attributes
const availableAttributeCategoryValues = computed(() => {
  if (!selectedMetadataCategory.value) return []

  const category = selectedMetadataCategory.value
  if (uniqueValues.value && category in uniqueValues.value) {
    return uniqueValues.value[category]
  }
})

const selectedMetadataValue = computed({
  get: () => attributeMetadataFilter.value.value,
  set: (value) => {
    attributeMetadataFilter.value.value = value

    // Apply filter when value changes
    if (value && selectedMetadataCategory.value) {
      updateAttributeFilter(selectedMetadataCategory.value, value)
    } else {
      clearAttributeFilter()
    }
  },
})

const attributeFilterStats = computed(() => {
  return {
    shown: activeAttributes.value.length,
    total: allNumericAttributes.value.length,
    filtered: allNumericAttributes.value.length - activeAttributes.value.length,
  }
})

const hasActiveAttributeFilter = computed(() => attributeFilterActive.value)

const clearFilter = () => {
  clearAttributeFilter()
  projectionService.resetToBaseProjection()
  selectedMetadataCategory.value = null
  selectedMetadataValue.value = null
}

const recalculateProjection = async () => {
  if (activeAttributes.value.length > 0) {
    attributeFilterStore.setRecalculating(true)
    try {
      await projectionService.recalculateWithAttributes(activeAttributes.value)
      projectionStore.projectionInstance?.updateAttributeRing(activeAttributes.value)
    } catch (error) {
      console.error('Failed to recalculate projection:', error)
    } finally {
      attributeFilterStore.setRecalculating(false)
    }
  }
}
</script>

<template>
  <section class="section" v-if="hasMetadata">
    <div class="flex items-center justify-between">
      <h3 class="section-title">Attribute Filter</h3>
      <button v-if="hasActiveAttributeFilter" @click="clearFilter" class="btn btn-xs btn-ghost">
        Clear
      </button>
    </div>

    <div class="mb-2 text-sm">
      <p>Filter attributes shown in the attribute ring</p>
    </div>

    <div class="filter-container">
      <!-- Category Selector -->
      <div class="form-control">
        <label class="label pb-1">
          <span class="label-text">Category</span>
        </label>
        <select class="select select-sm w-full" v-model="selectedMetadataCategory">
          <option :value="null">Select category...</option>
          <option v-for="category in metadataCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <!-- Value Selector -->
      <div v-if="selectedMetadataCategory" class="form-control mt-2">
        <label class="label pb-1">
          <span class="label-text">Value</span>
        </label>
        <select class="select select-sm w-full" v-model="selectedMetadataValue">
          <option :value="null">Select value...</option>
          <option v-for="value in availableAttributeCategoryValues" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </div>

      <!-- Filter stats -->
      <div
        v-if="hasActiveAttributeFilter"
        class="mt-3 px-2 py-1 bg-blue-50 text-blue-800 rounded text-sm"
      >
        Showing {{ attributeFilterStats.shown }} of {{ attributeFilterStats.total }} attributes
        <span v-if="attributeFilterStats.filtered > 0">
          ({{ attributeFilterStats.filtered }} filtered out)
        </span>

        <!-- Add Recalculate button -->
        <div class="mt-2">
          <button @click="recalculateProjection" class="btn btn-sm btn-primary w-full">
            <span v-if="!isRecalculating">Recalculate Projection</span>
            <span v-else class="loading loading-spinner loading-xs mr-1"></span>
            <span v-if="isRecalculating">Recalculating...</span>
          </button>
        </div>
      </div>
      <!-- Loading indicator -->
      <div v-if="isRecalculating" class="mt-3 text-center">
        <span class="loading loading-spinner loading-sm"></span>
        Recalculating projection...
      </div>
    </div>
  </section>
</template>

<style scoped>
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
</style>
