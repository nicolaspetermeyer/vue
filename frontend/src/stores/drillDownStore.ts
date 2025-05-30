import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProjectionHistoryState } from '@/models/data'

export const useDrillDownStore = defineStore('drillDown', () => {
  // State
  const projectionHistory = ref<ProjectionHistoryState[]>([])
  const currentParentId = ref<string | undefined>(undefined)
  const originalPositions = ref<Map<string, { x: number; y: number }>>(new Map())
  const isLoading = ref<boolean>(false)

  // Computed
  const canGoBack = computed(() => projectionHistory.value.length > 0)
  const isDrilledDownView = computed(() => currentParentId.value !== undefined)
  const currentViewLevel = computed(() => projectionHistory.value.length)

  function saveProjectionState(state: ProjectionHistoryState) {
    projectionHistory.value.push(state)
  }

  function popHistoryState(): ProjectionHistoryState | undefined {
    return projectionHistory.value.pop()
  }

  function setParentId(id: string | undefined) {
    currentParentId.value = id
  }

  function setOriginalPositions(positions: Map<string, { x: number; y: number }>) {
    originalPositions.value = positions
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function truncateHistoryAt(index: number) {
    if (index >= 0 && index < projectionHistory.value.length) {
      projectionHistory.value = projectionHistory.value.slice(0, index + 1)
    }
  }

  function clearHistory() {
    projectionHistory.value = []
    currentParentId.value = undefined
  }

  return {
    // State
    projectionHistory,
    currentParentId,
    originalPositions,
    isLoading,

    // Computed
    canGoBack,
    isDrilledDownView,
    currentViewLevel,

    // Actions
    saveProjectionState,
    popHistoryState,
    setParentId,
    setOriginalPositions,
    setLoading,
    truncateHistoryAt,
    clearHistory,
  }
})
