<script setup lang="ts">
import { computed } from 'vue'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { projectionService } from '@/services/projectionService'
import { storeToRefs } from 'pinia'

const pointFilterStore = usePointFilterStore()

const { pointFilterCategories, activePointFilter } = storeToRefs(pointFilterStore)

const { getPointCategoryValues } = pointFilterStore

const selectedCategory = computed({
  get: () => activePointFilter.value.category,
  set: (value) => {
    if (value !== activePointFilter.value.category) {
      projectionService.applyPointFilter(value, [])
    }
  },
})

const availableCategoryValues = computed(() => {
  if (!selectedCategory.value) return []
  return getPointCategoryValues(selectedCategory.value)
})

const selectedValues = computed({
  get: () => activePointFilter.value.values,
  set: (values) => {
    projectionService.applyPointFilter(selectedCategory.value, values)
  },
})

const hasActiveFilters = computed(() => {
  return activePointFilter.value.category && activePointFilter.value.values.length > 0
})

const selectAllValues = () => {
  if (selectedCategory.value) {
    projectionService.applyPointFilter(selectedCategory.value, [...availableCategoryValues.value])
  }
}

const deselectAllValues = () => {
  projectionService.applyPointFilter(selectedCategory.value, [])
}

const clear = () => {
  projectionService.clearPointFilter()
}
</script>

<template>
  <section class="section">
    <div class="flex items-center justify-between">
      <h3 class="section-title">Filters</h3>
      <button v-if="hasActiveFilters" @click="clear" class="btn btn-xs btn-ghost">Clear</button>
    </div>

    <div v-if="pointFilterCategories && pointFilterCategories.length > 0" class="filter-container">
      <!-- Category Selector -->
      <div class="form-control">
        <label class="label pb-1">
          <span class="label-text">Category</span>
        </label>
        <select class="select select-sm w-full" v-model="selectedCategory">
          <option :value="null">Select category...</option>
          <option v-for="category in pointFilterCategories" :key="category" :value="category">
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
      v-else-if="pointFilterCategories && pointFilterCategories.length === 0"
      class="text-sm text-gray-500"
    >
      No categorical data available for filtering
    </div>
    <div v-else class="text-sm text-gray-500">Load a projection to enable filtering</div>
  </section>
</template>
