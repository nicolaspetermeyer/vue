import { defineStore } from 'pinia'
import { calcFingerprintStats } from '@/utils/calculations/calcFingerprintStats'
import type { Fingerprint, Projection, FeatureStats } from '@/models/data'
import { ref, computed } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import { Colors } from '@/config/Themes'
import { useProjectionStore } from '@/stores/projectionStore'

export const useFingerprintStore = defineStore('fingerprintStore', () => {
  //STATE
  const fingerprints = ref<Fingerprint[]>([])
  const fingerprintCounter = ref(1)
  const selection = ref<Projection[]>([])
  const selectedFingerprints = ref<Fingerprint[]>([])

  // Computed property for the selected fingerprint's points
  const selectedFingerprintPoints = computed(() => {
    if (selectedFingerprints.value.length === 0) return []

    return selectedFingerprints.value.flatMap((fingerprint) => fingerprint.projectedPoints)
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
  function addFingerprint() {
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
      name = `Fingerprint ${fingerprintCounter.value++}`
    } else {
      const activeFilter = projectionStore.activeFilter
      let filteredIds: string[] = []

      if (activeFilter.category && activeFilter.values.length > 0) {
        filteredIds = projectionStore.projection
          .filter((point) => {
            if (point.original && activeFilter.category) {
              const value = point.original[activeFilter.category]
              return value !== undefined && activeFilter.values.includes(String(value))
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

    const fingerprint: Fingerprint = {
      id,
      name,
      projectedPoints: [...pointsToUse],
      localStats,
      centroid,
    }

    fingerprints.value.push(fingerprint)

    selection.value = []
  }

  function removeFingerprint(id: string, projectionInstance: any | null | undefined) {
    const fingerprintToRemove = fingerprints.value.find((fp) => fp.id === id)

    if (!fingerprintToRemove) return

    fingerprints.value = fingerprints.value.filter((f) => f.id !== id)
    selectedFingerprints.value = selectedFingerprints.value.filter((f) => f.id !== id)
    updateAttributeRingVisualization(projectionInstance)

    // Restore hidden points from the removed fingerprint
    if (projectionInstance?.dimred) {
      const pointIds = fingerprintToRemove.projectedPoints.map((p) => p.id)
      projectionInstance.dimred.showPointsById(pointIds)
      projectionInstance.dimred.removeMiniRing(fingerprintToRemove)
    }
  }

  function clearFingerprints() {
    fingerprints.value = []
    selectedFingerprints.value = []
    fingerprintCounter.value = 1
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

    updateAttributeRingVisualization(projectionInstance)
  }

  function updateAttributeRingVisualization(projectionInstance: PixiProjection | null | undefined) {
    const ring = projectionInstance?.attributeRing
    if (ring) {
      if (selectedFingerprints.value.length > 0) {
        ring.clearLocalRing()
        const colorMap = getComparisonColors()

        selectedFingerprints.value.forEach((fp) => {
          const color = colorMap[fp.id]

          ring.setLocalRing(fp.id, fp.localStats, color)
        })

        // Highlight points if dimred is available
        if (projectionInstance?.dimred) {
          const pointColorMap: Record<string, number> = {}
          selectedFingerprints.value.forEach((fp) => {
            const color = colorMap[fp.id]
            fp.projectedPoints.forEach((point) => {
              pointColorMap[point.id] = color
            })
          })
          projectionInstance.dimred.highlightFingerprintPoints(pointColorMap)
        }
      } else {
        // Clear visualization when no fingerprints are selected
        ring.clearLocalRing()
        projectionInstance?.dimred?.highlightFingerprintPoints({})
      }
    }
  }

  function getComparisonColors(): Record<string, number> {
    // Define a set of distinct colors for comparisons
    const colors = Colors.FINGERPRINT_COLORS

    const colorMap: Record<string, number> = {}

    selectedFingerprints.value.forEach((fp, index) => {
      colorMap[fp.id] = colors[index % colors.length]
    })

    return colorMap
  }

  // function getTopFeatures(stats: Record<string, FeatureStats>, limit = 1): string[] {
  //   return Object.entries(stats)
  //     .sort(([, a], [, b]) => Math.abs(b.meanDelta) - Math.abs(a.meanDelta)) // sort by deviation
  //     .slice(0, limit)
  //     .map(([key]) => key)
  // }

  function calculateSelectionCentroid(points: Projection[]): { x: number; y: number } {
    // Calculate centroid
    const sumX = points.reduce((sum, point) => sum + point.pos.x, 0)
    const sumY = points.reduce((sum, point) => sum + point.pos.y, 0)

    return {
      x: sumX / points.length,
      y: sumY / points.length,
    }
  }

  function getFingerprintCentroid(fingerprintId: string): { x: number; y: number } | null {
    const fingerprint = fingerprints.value.find((f) => f.id === fingerprintId)
    if (!fingerprint) {
      return null
    }
    return calculateSelectionCentroid(fingerprint.projectedPoints)
  }

  return {
    fingerprints,
    selectedFingerprints,
    selectedFingerprintPoints,
    setSelection,
    getFilterDescription,
    addFingerprint,
    removeFingerprint,
    clearFingerprints,
    updateAttributeRingVisualization,
    toggleSelectedFingerprint,
    getComparisonColors,

    // getTopFeatures,
    calculateSelectionCentroid,
    getFingerprintCentroid,
  }
})
