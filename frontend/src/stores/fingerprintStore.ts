import { defineStore } from 'pinia'
import { calcFingerprintStats } from '@/utils/calculations/calcFingerprintStats'
import type { Fingerprint, Projection, AttributeStats } from '@/models/data'
import { ref, computed } from 'vue'
import { useProjectionStore } from '@/stores/projectionStore'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { useDrillDownStore } from './drillDownStore'
import { FingerprintVisualizationService } from '@/services/FingerprintVisualizationService'

export const useFingerprintStore = defineStore('fingerprintStore', () => {
  // STATE
  const fingerprints = ref<Fingerprint[]>([])
  const fingerprintCounter = ref(1)
  const selection = ref<Projection[]>([])
  const selectedFingerprints = ref<Fingerprint[]>([])

  const visualizationService = new FingerprintVisualizationService()

  const selectedFingerprintPoints = computed(() => {
    if (selectedFingerprints.value.length === 0) return []
    return selectedFingerprints.value.flatMap((fingerprint) => fingerprint.projectedPoints)
  })

  const currentParentId = computed(() => useDrillDownStore().currentParentId)
  const filteredFingerprints = computed(() => {
    return fingerprints.value.filter((fp) => fp.parentId === currentParentId.value)
  })

  //ACTIONS
  // triggers on brush select
  function setSelection(points: Projection[]) {
    selection.value = points
  }

  // Helper function to get filter description
  function getFilterDescription(category: string, values: string[]): string {
    if (!category || values.length === 0) return 'All Points'

    if (values.length === 1) {
      return `${category}=${values[0]}`
    } else if (values.length <= 3) {
      return `${category}=${values.join(',')}`
    } else {
      return `${category} (${values.length} values)`
    }
  }

  // on button click computes fingerprint from brush selection
  function addFingerprint(customName: string | null = null) {
    const projectionStore = useProjectionStore()
    let pointsToUse: Projection[] = []
    let name: string

    const dimredInstance = projectionStore.projectionInstance?.dimred
    const screenPositions = new Map<string, { x: number; y: number }>()

    if (dimredInstance) {
      dimredInstance.pixiDimredPoints.forEach((point, id) => {
        screenPositions.set(id, { x: point.x, y: point.y })
      })
    }

    if (selection.value.length > 0) {
      pointsToUse = selection.value
      if (customName) {
        name = customName
      } else {
        name = `Fingerprint ${fingerprintCounter.value++}`
      }
    } else {
      const activeFilter = usePointFilterStore().activePointFilter
      let filteredIds: string[] = []

      if (activeFilter.category && activeFilter.values.length > 0) {
        filteredIds = projectionStore.projection
          .filter((point) => {
            if (point.original && activeFilter.category) {
              const value = String(point.original[activeFilter.category])
              const stringValues = activeFilter.values.map((v) => String(v))
              return value !== undefined && stringValues.includes(value)
            }
            return false
          })
          .map((point) => point.id)

        name = getFilterDescription(activeFilter.category, activeFilter.values)
      } else {
        filteredIds = projectionStore.projection.map((point) => point.id)
        name = `All Points ${fingerprintCounter.value++}`
      }

      pointsToUse = projectionStore.projection
        .filter((point) => filteredIds.includes(point.id))
        .map((point) => {
          const screenPos = screenPositions.get(point.id)
          return {
            ...point,
            pos: screenPos || point.pos, // Use screen position if available
          }
        })
    }

    if (pointsToUse.length === 0) return

    const originals = pointsToUse.map((p) => p.original)
    const localStats = calcFingerprintStats(originals)
    const id = crypto.randomUUID()
    const centroid = calculateSelectionCentroid(pointsToUse)
    const color = visualizationService.assignColor(id)
    const parentId = currentParentId.value
    console.log('stats', localStats)

    const fingerprint: Fingerprint = {
      id,
      name,
      projectedPoints: [...pointsToUse],
      localStats,
      centroid,
      color,
      parentId,
      childIds: [],
    }

    if (parentId) {
      const parentFingerprint = fingerprints.value.find((fp) => fp.id === parentId)
      if (parentFingerprint && parentFingerprint.childIds) {
        parentFingerprint.childIds.push(id)
      }
    }

    fingerprints.value.push(fingerprint)

    if (dimredInstance) {
      selection.value = []
      dimredInstance.clearSelection()
      dimredInstance.app.render()
    }
  }

  function removeFingerprint(id: string, projectionInstance: any | null | undefined) {
    const fingerprintToRemove = fingerprints.value.find((fp) => fp.id === id)
    if (!fingerprintToRemove) return

    if (fingerprintToRemove.childIds && fingerprintToRemove.childIds.length > 0) {
      ;[...fingerprintToRemove.childIds].forEach((childId) => {
        removeFingerprint(childId, projectionInstance)
      })
    }

    if (fingerprintToRemove.parentId) {
      const parent = fingerprints.value.find((fp) => fp.id === fingerprintToRemove.parentId)
      if (parent && parent.childIds) {
        parent.childIds = parent.childIds.filter((cid) => cid !== id)
      }
    }
    visualizationService.releaseColor(id)

    fingerprints.value = fingerprints.value.filter((f) => f.id !== id)
    selectedFingerprints.value = selectedFingerprints.value.filter((f) => f.id !== id)

    // Update visualization
    visualizationService.updateAttributeRingVisualization(
      projectionInstance,
      selectedFingerprints.value,
    )

    // Restore hidden points from the removed fingerprint
    if (projectionInstance?.dimred) {
      const pointIds = fingerprintToRemove.projectedPoints.map((p) => p.id)
      projectionInstance.dimred.showPointsById(pointIds)
      projectionInstance.dimred.removeMiniRing(fingerprintToRemove)
    }
  }

  function deselectAllFingerprints() {
    selectedFingerprints.value = []
  }

  function clearFingerprints() {
    fingerprints.value = []
    selectedFingerprints.value = []
    fingerprintCounter.value = 1

    visualizationService.resetColors()
  }

  function renameFingerprint(id: string, newName: string) {
    const fingerprintToRename = fingerprints.value.find((fp) => fp.id === id)
    if (!fingerprintToRename) return false

    fingerprintToRename.name = newName
    return true
  }

  function getFingerprintById(id: string): Fingerprint | undefined {
    return fingerprints.value.find((fp) => fp.id === id)
  }

  function toggleSelectedFingerprint(
    fingerprint: Fingerprint,
    projectionInstance: any | null | undefined,
  ) {
    const index = selectedFingerprints.value.findIndex((f) => f.id === fingerprint.id)
    if (index === -1) {
      selectedFingerprints.value.push(fingerprint)
    } else {
      selectedFingerprints.value.splice(index, 1)
    }

    // Use service to update visualization
    visualizationService.updateAttributeRingVisualization(
      projectionInstance,
      selectedFingerprints.value,
    )
  }

  function calculateSelectionCentroid(points: Projection[]): { x: number; y: number } {
    // Calculate centroid
    const sumX = points.reduce((sum, point) => sum + point.pos.x, 0)
    const sumY = points.reduce((sum, point) => sum + point.pos.y, 0)

    return {
      x: sumX / points.length,
      y: sumY / points.length,
    }
  }

  return {
    fingerprints,
    selection,
    selectedFingerprints,
    selectedFingerprintPoints,
    filteredFingerprints,
    setSelection,
    getFilterDescription,

    addFingerprint,
    removeFingerprint,
    deselectAllFingerprints,
    clearFingerprints,

    getFingerprintById,
    toggleSelectedFingerprint,
    calculateSelectionCentroid,
    renameFingerprint,

    // Expose visualization service
    visualizationService,
  }
})
