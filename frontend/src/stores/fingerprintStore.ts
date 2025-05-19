import { defineStore } from 'pinia'
import { calcFingerprintStats } from '@/utils/calculations/calcFingerprintStats'
import type { Fingerprint, Projection, FeatureStats } from '@/models/data'
import { ref, computed } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import { Colors } from '@/config/Themes'

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

  // on button click computes fingerprint from brush selection
  function addFingerprint() {
    if (selection.value.length === 0) return

    const originals = selection.value.map((p) => p.original)

    const localStats = calcFingerprintStats(originals)

    const id = crypto.randomUUID()
    const name = `Fingerprint ${fingerprintCounter.value++}`
    const centroid = calculateSelectionCentroid(selection.value)

    const fingerprint: Fingerprint = {
      id,
      name,
      projectedPoints: [...selection.value],
      localStats,
      centroid,
    }

    fingerprints.value.push(fingerprint)
  }

  function removeFingerprint(id: string, projectionInstance: any | null | undefined) {
    fingerprints.value = fingerprints.value.filter((f) => f.id !== id)
    selectedFingerprints.value = selectedFingerprints.value.filter((f) => f.id !== id)
    updateAttributeRingVisualization(projectionInstance)
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
        ring.clearLocalStats()
        const colorMap = getComparisonColors()

        selectedFingerprints.value.forEach((fp) => {
          const color = colorMap[fp.id]
          const numericStats = Object.fromEntries(
            Object.entries(fp.localStats).filter(([key, _]) => ring.hasAttribute(key)),
          )
          ring.setLocalStats(fp.id, numericStats, color)
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
        ring.clearLocalStats()
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
