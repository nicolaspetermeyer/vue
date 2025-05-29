<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'

const attributeFilterStore = useAttributeFilterStore()
const {
  attributeMetadata,
  metadataAttributes,
  metadataCategories,
  hasMetadata,
  attributeMetadataFilter,
  attributeFilterActive,
  activeAttributes,
  allNumericAttributes,
} = storeToRefs(attributeFilterStore)

const { filterAttributesByMetadata, clearAttributeFilter } = attributeFilterStore

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

  const uniqueValues = new Set<string>()

  // Loop through all attributes with metadata
  Object.keys(attributeMetadata.value || {}).forEach((attr) => {
    const metadata = attributeMetadata.value[attr]
    const category = selectedMetadataCategory.value
    if (category && metadata?.categories) {
      const value = metadata.categories[category]
      if (value) {
        uniqueValues.add(value)
      }
    }
  })

  return Array.from(uniqueValues).sort()
})

const selectedMetadataValue = computed({
  get: () => attributeMetadataFilter.value.value,
  set: (value) => {
    attributeMetadataFilter.value.value = value

    // Apply filter when value changes
    if (value && selectedMetadataCategory.value) {
      filterAttributesByMetadata(selectedMetadataCategory.value, value)
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
</script>

<template>
  <section class="section" v-if="hasMetadata">
    <div class="flex items-center justify-between">
      <h3 class="section-title">Attribute Filter</h3>
      <button
        v-if="hasActiveAttributeFilter"
        @click="() => clearAttributeFilter"
        class="btn btn-xs btn-ghost"
      >
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
