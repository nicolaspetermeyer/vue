import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Projection, AttributeStats } from '@/models/data'
import { useProjectionStore } from './projectionStore'
import { useFingerprintStore } from './fingerprintStore'

export const useDrillDownStore = defineStore('drillDown', () => {
  // State
  const projectionHistory = ref<
    { projection: Projection[]; stats: Record<string, AttributeStats>; parentId?: string }[]
  >([])
  const currentParentId = ref<string | undefined>(undefined)

  // Computed
  const canGoBack = computed(() => projectionHistory.value.length > 0)
  const isDrilledDownView = computed(() => currentParentId.value !== undefined)
  const currentViewLevel = computed(() => projectionHistory.value.length)

  /**
   * Drill down to a filtered projection
   */
  function drillDownToProjection(newProjection: Projection[], parentId?: string) {
    const projectionStore = useProjectionStore()

    if (projectionStore.projection.length > 0) {
      projectionHistory.value.push({
        projection: [...projectionStore.projection],
        stats: { ...projectionStore.globalStats },
        parentId: currentParentId.value,
      })
    }

    currentParentId.value = parentId
    projectionStore.setProjection(newProjection)
  }

  /**
   * Go back to previous projection
   */
  function goBackToPreviousProjection(): boolean {
    if (projectionHistory.value.length === 0) {
      return false
    }

    const previousProjection = projectionHistory.value.pop()
    if (previousProjection) {
      const projectionStore = useProjectionStore()
      projectionStore.setProjection(previousProjection.projection)
      projectionStore.setGlobalStats(previousProjection.stats)
      currentParentId.value = previousProjection.parentId

      const fingerprintStore = useFingerprintStore()
      fingerprintStore.selectedFingerprints = []

      return true
    }

    return false
  }

  /**
   * Reset to the base projection
   */
  function resetToBaseProjection() {
    const projectionStore = useProjectionStore()
    projectionHistory.value = []
    currentParentId.value = undefined

    // Reset to the unfiltered projection if available
    if (projectionStore.unfilteredProjection.length > 0) {
      projectionStore.setProjection([...projectionStore.unfilteredProjection])
    }

    // Clear fingerprints
    useFingerprintStore().selectedFingerprints = []
  }

  /**
   * Clear history when loading a new projection
   */
  function clearHistory() {
    projectionHistory.value = []
    currentParentId.value = undefined
  }

  return {
    projectionHistory,
    currentParentId,
    canGoBack,
    isDrilledDownView,
    currentViewLevel,

    drillDownToProjection,
    goBackToPreviousProjection,
    resetToBaseProjection,
    clearHistory,
  }
})
