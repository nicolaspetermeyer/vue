import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Projection } from '@/models/data'

export const usePointFilterStore = defineStore('pointFilter', () => {
  // available categories for filtering and unique values
  const pointFilterCategories = ref<string[] | null>(null)
  const pointCategoryValues = ref<Record<string, string[]>>({})

  // Current active filter (user selection)
  const activePointFilter = ref<{
    category: string | null
    values: string[]
  }>({
    category: null,
    values: [],
  })

  // Set available filters when projection loads
  function initAvailablePointFilters(
    categories: string[] | null,
    values: Record<string, string[]>,
  ) {
    pointFilterCategories.value = categories
    pointCategoryValues.value = values
  }

  function setActivePointFilter(category: string | null, values: string[]) {
    activePointFilter.value = {
      category,
      values: [...values],
    }
  }

  function clearActivePointFilter() {
    activePointFilter.value = { category: null, values: [] }
  }

  // Return values for a given category
  function getPointCategoryValues(category: string): string[] {
    return pointCategoryValues.value[category] || []
  }

  // Compute filtered point ids for a projection
  function filterPointIds(projection: Projection[]) {
    const { category, values } = activePointFilter.value
    if (!category || values.length === 0) return projection.map((p) => p.id)
    return projection
      .filter(
        (point) => point.original && category && values.includes(String(point.original[category])),
      )
      .map((point) => point.id)
  }

  function getPointFilterDescription() {
    const { category, values } = activePointFilter.value
    if (!category || values.length === 0) return 'All Points'
    if (values.length === 1) return `${category}=${values[0]}`
    if (values.length <= 3) return `${category}=${values.join(', ')}`
    return `${category} (${values.length} values)`
  }

  return {
    pointFilterCategories,
    pointCategoryValues,
    activePointFilter,
    initAvailablePointFilters,
    setActivePointFilter,
    clearActivePointFilter,
    getPointCategoryValues,
    filterPointIds,
    getPointFilterDescription,
  }
})
