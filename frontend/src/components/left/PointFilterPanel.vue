<script setup lang="ts">
import { computed } from 'vue'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { projectionService } from '@/services/projectionService'
import { storeToRefs } from 'pinia'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useProjectionStore } from '@/stores/projectionStore'

const projectionStore = useProjectionStore()
const { projection } = storeToRefs(projectionStore)

const pointFilterStore = usePointFilterStore()
const { pointFilterCategories, activePointFilter } = storeToRefs(pointFilterStore)

const fingerprintStore = useFingerprintStore()
const { addFingerprint } = fingerprintStore

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

const createFingerprintPerValue = () => {
  if (!selectedCategory.value || availableCategoryValues.value.length === 0) return

  const valuesToProcess =
    selectedValues.value.length > 0 ? selectedValues.value : availableCategoryValues.value

  valuesToProcess.forEach((value) => {
    const pointsForValue = projection.value.filter((point) => {
      return point.original[selectedCategory.value as string] === value
    })

    if (pointsForValue.length > 0) {
      fingerprintStore.setSelection(pointsForValue)

      const name = `${selectedCategory.value}: ${value}`
      addFingerprint(name)
    }
  })
}
</script>

<template>
  <section class="section">
    <div class="flex items-center justify-between">
      <h3 class="section-title">Point Filter</h3>
      <button v-if="hasActiveFilters" @click="clear" class="btn btn-xs btn-ghost">Clear</button>
    </div>

    <div v-if="pointFilterCategories && pointFilterCategories.length > 0" class="filter-container">
      <!-- Category Selector -->
      <div class="form-control">
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
          <div class="flex space-x-2 mb-2">
            <button
              @click="addFingerprint()"
              class="btn btn-xs btn-primary flex-1"
              :disabled="selectedValues.length === 0"
              title="Create fingerprint from selected values"
            >
              Create Fingerprint
            </button>
            <button
              @click="createFingerprintPerValue"
              class="btn btn-xs btn-primary flex-1"
              :disabled="availableCategoryValues.length === 0"
              title="Create separate fingerprint for each category value"
            >
              Create Per Value
            </button>
          </div>

          <div class="mt-1 text-xs text-gray-500" v-if="selectedValues.length > 0">
            {{ selectedValues.length }} selected
          </div>

          <div class="checkboxes-container">
            <div v-for="value in availableCategoryValues" :key="value" class="form-control">
              <label class="label cursor-pointer justify-start py-1 text-black">
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
